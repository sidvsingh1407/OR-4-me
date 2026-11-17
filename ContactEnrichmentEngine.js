/**
 * Contact Enrichment Engine
 *
 * Implements a zero-guessing, two-pass contact discovery funnel:
 * 1. Pass 1 (Free Web Bio/Site Scrape): Crawls company root and contact/about/team subpages.
 *    Extracts standard and de-obfuscated emails, filters junk aliases, and tags personal vs generic inboxes.
 * 2. Pass 2 (Apollo People Enrichment API): Matches executive names against Apollo's match API
 *    using the user's APOLLO_API_KEY to retrieve verified work emails.
 *
 * Strictly adheres to the Zero-Guessing principle: no unverified pattern guessing.
 */

// ============================================================================
// CONSTANTS & JUNK FILTERS
// ============================================================================

const JUNK_EMAIL_PREFIXES = [
  'abuse@',
  'legal@',
  'noreply@',
  'no-reply@',
  'donotreply@',
  'dmca@',
  'postmaster@',
  'privacy@',
  'security@',
  'billing@',
  'compliance@',
  'webmaster@',
  'hostmaster@',
  'mailer-daemon@',
  'root@',
  'unsubscribe@',
  'investors@',
  'jobs@',
  'careers@'
];

const GENERIC_INBOX_PREFIXES = [
  'info@',
  'contact@',
  'hello@',
  'support@',
  'sales@',
  'team@',
  'press@',
  'media@',
  'inquiries@',
  'office@',
  'general@'
];

const INVALID_EMAIL_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.css', '.js', '.json', '.xml', '.ico', '.woff', '.woff2', '.ttf'
];

const CONTACT_PATH_CANDIDATES = [
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/team',
  '/our-team',
  '/leadership',
  '/connect'
];

// ============================================================================
// CONTACT ENRICHMENT ENGINE CLASS
// ============================================================================

class ContactEnrichmentEngine {
  constructor() {
    this.logger = AppLogger.getLogger('ContactEnrichmentEngine');
    this.db = getDatabase();
    this.httpClient = new HttpClient();
    this.config = getAppConfig();
    this.queueManager = getQueueManager();
    this.scriptProps = getScriptProps();
  }

  /**
   * Main entry point for the ENRICH_CONTACT task.
   * @param {Object} payload - { leadId: string }
   * @returns {Object} Result summary { status, leadId, executiveEmail, emailConfidence, emailSource }
   */
  execute(payload = {}) {
    Validation.assertObject(payload, 'Contact Enrichment Payload');
    const leadId = payload.leadId;

    if (!leadId) {
      this.logger.warn('execute', 'No leadId provided in payload. Skipping.');
      return { status: 'SKIPPED', reason: 'MISSING_LEAD_ID' };
    }

    this.logger.info('execute', `Starting contact enrichment for Lead ID: ${leadId}`);

    const lead = this.db.getById('Leads', leadId);
    if (!lead) {
      this.logger.error('execute', `Lead ${leadId} not found in Leads table.`);
      return { status: 'FAILED', reason: 'LEAD_NOT_FOUND', leadId };
    }

    const contactResult = this.enrichLeadContact(lead);

    // Persist discovered contact data to the Lead record
    const updateData = {
      executiveEmail: contactResult.executiveEmail || '',
      emailConfidence: contactResult.emailConfidence || 'NONE',
      emailSource: contactResult.emailSource || 'NONE',
      emailVerificationStatus: contactResult.emailVerificationStatus || 'NOT_FOUND'
    };

    this.db.update('Leads', leadId, updateData);
    this.logger.info('execute', `Updated Lead ${leadId} with contact result: ${updateData.executiveEmail} [${updateData.emailConfidence}]`);

    // Chain to next pipeline stage: SCORE_LEAD
    this.queueManager.enqueue('SCORE_LEAD', { leadId: leadId }, 1);
    this.logger.info('execute', `Enqueued SCORE_LEAD task for Lead ID: ${leadId}`);

    return {
      status: 'SUCCESS',
      leadId,
      ...updateData
    };
  }

  /**
   * Performs the two-pass contact discovery funnel for a given lead.
   * @param {Object} lead - Structured lead record from Leads table.
   * @returns {Object} { executiveEmail, emailConfidence, emailSource, emailVerificationStatus }
   */
  enrichLeadContact(lead) {
    const domain = this._resolveDomain(lead);
    const website = lead.website || (domain ? `https://${domain}` : '');
    const executiveNames = lead.executiveNames ? lead.executiveNames.split(',').map(s => s.trim()).filter(Boolean) : [];
    const primaryExecutive = executiveNames.length > 0 ? executiveNames[0] : '';

    this.logger.debug('enrichLeadContact', `Evaluating lead: ${lead.company} | Domain: ${domain} | Exec: ${primaryExecutive}`);

    let bestContact = {
      executiveEmail: '',
      emailConfidence: 'NONE',
      emailSource: 'NONE',
      emailVerificationStatus: 'NOT_FOUND'
    };

    // ------------------------------------------------------------------------
    // PASS 1: Free Web Bio / Website Scrape
    // ------------------------------------------------------------------------
    const enableWebScrape = this.config.getBoolean('ENRICHMENT.ENABLE_WEB_SCRAPE', true);
    if (enableWebScrape && (website || domain)) {
      const webResult = this.discoverFromWebsite(domain, website, executiveNames);
      if (webResult && webResult.executiveEmail) {
        bestContact = webResult;
        this.logger.info('enrichLeadContact', `Discovered email from website scrape: ${webResult.executiveEmail} (${webResult.emailConfidence})`);

        // If personal executive email discovered with HIGH confidence, return immediately
        if (webResult.emailConfidence === 'HIGH') {
          return bestContact;
        }
      }
    }

    // ------------------------------------------------------------------------
    // PASS 2: Apollo People Match API
    // ------------------------------------------------------------------------
    const enableApollo = this.config.getBoolean('ENRICHMENT.ENABLE_APOLLO', true);
    if (enableApollo && primaryExecutive && domain) {
      const apolloResult = this.fetchApolloContact(primaryExecutive, domain, lead.company);
      if (apolloResult && apolloResult.executiveEmail) {
        this.logger.info('enrichLeadContact', `Discovered email via Apollo API: ${apolloResult.executiveEmail} (${apolloResult.emailVerificationStatus})`);
        return apolloResult;
      }
    }

    // Return best contact found (or NONE if zero confirmed emails)
    return bestContact;
  }

  /**
   * Pass 1: Crawls root and candidate subpages (/contact, /about, /team).
   * Extracts, de-obfuscates, filters junk, and identifies named vs generic inboxes.
   * @param {string} domain
   * @param {string} websiteUrl
   * @param {string[]} executiveNames
   * @returns {Object|null}
   */
  discoverFromWebsite(domain, websiteUrl, executiveNames) {
    if (!domain && !websiteUrl) return null;

    const baseOrigin = this._normalizeOrigin(websiteUrl || `https://${domain}`);
    const maxPages = this.config.getNumber('ENRICHMENT.CONTACT_PAGES_LIMIT', 3);

    const urlsToCrawl = [baseOrigin];
    for (let i = 0; i < CONTACT_PATH_CANDIDATES.length && urlsToCrawl.length <= maxPages; i++) {
      urlsToCrawl.push(`${baseOrigin}${CONTACT_PATH_CANDIDATES[i]}`);
    }

    const discoveredEmails = new Set();
    const candidateEmails = [];

    for (const url of urlsToCrawl) {
      try {
        const response = this.httpClient.get(url, {
          'User-Agent': this.config.get('CRAWLER.USER_AGENT', 'Mozilla/5.0 (compatible; TarkaXBot/1.0)')
        });

        if (response && response.isSuccess && response.text) {
          const emails = this._extractEmailsFromHtml(response.text);
          for (const email of emails) {
            if (!discoveredEmails.has(email)) {
              discoveredEmails.add(email);
              candidateEmails.push(email);
            }
          }
        }
      } catch (err) {
        this.logger.debug('discoverFromWebsite', `Failed to crawl ${url}: ${err.message}`);
      }
    }

    if (candidateEmails.length === 0) {
      return null;
    }

    // Evaluate candidate emails against executive names and patterns
    let bestNamedEmail = null;
    let bestGenericEmail = null;

    for (const email of candidateEmails) {
      const lowerEmail = email.toLowerCase();

      // Check if junk
      if (this._isJunkEmail(lowerEmail)) {
        continue;
      }

      // Check if generic inbox
      const isGeneric = GENERIC_INBOX_PREFIXES.some(prefix => lowerEmail.startsWith(prefix));

      if (isGeneric) {
        if (!bestGenericEmail) {
          bestGenericEmail = email;
        }
        continue;
      }

      // Check if email matches any executive's name (high confidence)
      const matchesExecutive = executiveNames.some(name => {
        const parts = name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
        return parts.some(part => lowerEmail.includes(part));
      });

      if (matchesExecutive) {
        return {
          executiveEmail: email,
          emailConfidence: 'HIGH',
          emailSource: 'WEBSITE',
          emailVerificationStatus: 'UNVERIFIED'
        };
      }

      // Candidate named email without exact executive name match
      if (!bestNamedEmail) {
        bestNamedEmail = email;
      }
    }

    if (bestNamedEmail) {
      return {
        executiveEmail: bestNamedEmail,
        emailConfidence: 'MEDIUM',
        emailSource: 'WEBSITE',
        emailVerificationStatus: 'UNVERIFIED'
      };
    }

    if (bestGenericEmail) {
      return {
        executiveEmail: bestGenericEmail,
        emailConfidence: 'MEDIUM',
        emailSource: 'WEBSITE',
        emailVerificationStatus: 'GENERIC_INBOX'
      };
    }

    return null;
  }

  /**
   * Pass 2: Apollo People Match API
   * POST https://api.apollo.io/api/v1/people/match
   * @param {string} executiveName
   * @param {string} domain
   * @param {string} companyName
   * @returns {Object|null}
   */
  fetchApolloContact(executiveName, domain, companyName) {
    const apiKey = this.scriptProps.get('APOLLO_API_KEY') || this.config.get('ENRICHMENT.APOLLO_API_KEY', '');
    if (!apiKey) {
      this.logger.debug('fetchApolloContact', 'No APOLLO_API_KEY configured. Skipping Apollo lookup.');
      return null;
    }

    const { firstName, lastName } = this._splitName(executiveName);
    if (!firstName) {
      return null;
    }

    const url = 'https://api.apollo.io/api/v1/people/match';
    const payload = {
      api_key: apiKey,
      first_name: firstName,
      last_name: lastName || undefined,
      domain: domain,
      organization_name: companyName || undefined
    };

    try {
      const response = this.httpClient.post(url, JSON.stringify(payload), {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      });

      if (!response.isSuccess || !response.json) {
        this.logger.warn('fetchApolloContact', `Apollo API responded with status ${response.statusCode}`);
        return null;
      }

      const person = response.json.person;
      if (!person || !person.email) {
        this.logger.debug('fetchApolloContact', `No email found in Apollo for ${executiveName} @ ${domain}`);
        return null;
      }

      const isVerified = person.email_status === 'verified';
      return {
        executiveEmail: person.email,
        emailConfidence: isVerified ? 'HIGH' : 'LOW',
        emailSource: 'APOLLO',
        emailVerificationStatus: isVerified ? 'VERIFIED' : 'UNVERIFIED'
      };
    } catch (err) {
      this.logger.error('fetchApolloContact', `Apollo Match API error for ${executiveName}`, err);
      return null;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  _extractEmailsFromHtml(html) {
    if (!html || typeof html !== 'string') return [];

    // 1. De-obfuscate common obfuscations
    const deobfuscated = this._deobfuscateText(html);

    // 2. Standard RFC-compliant email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = deobfuscated.match(emailRegex) || [];

    // 3. Filter invalid extensions and junk
    const validEmails = [];
    const seen = new Set();

    for (const raw of matches) {
      const email = raw.trim();
      const lower = email.toLowerCase();

      // Check extension (skip .png, .jpg, etc.)
      const isFile = INVALID_EMAIL_EXTENSIONS.some(ext => lower.endsWith(ext));
      if (isFile) continue;

      if (!seen.has(lower)) {
        seen.add(lower);
        validEmails.push(email);
      }
    }

    return validEmails;
  }

  _deobfuscateText(text) {
    return text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#64;/gi, '@')
      .replace(/&#46;/gi, '.')
      .replace(/\[\s*at\s*\]|\(\s*at\s*\)|\s+at\s+/gi, '@')
      .replace(/\[\s*dot\s*\]|\(\s*dot\s*\)|\s+dot\s+/gi, '.');
  }

  _isJunkEmail(email) {
    return JUNK_EMAIL_PREFIXES.some(prefix => email.startsWith(prefix));
  }

  _splitName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', lastName: '' };
    }
    const clean = fullName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }

  _resolveDomain(lead) {
    if (lead.domain) {
      return lead.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
    if (lead.website) {
      return lead.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
    return '';
  }

  _normalizeOrigin(url) {
    if (!url) return '';
    let cleaned = url.trim().toLowerCase();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    try {
      const parts = cleaned.split('/');
      return `${parts[0]}//${parts[2]}`;
    } catch (e) {
      return cleaned;
    }
  }
}

// ============================================================================
// SINGLETON GETTER & TASK DISPATCHER REGISTRATION
// ============================================================================

function getContactEnrichmentEngine() {
  if (!getContactEnrichmentEngine.instance) {
    getContactEnrichmentEngine.instance = new ContactEnrichmentEngine();
  }
  return getContactEnrichmentEngine.instance;
}

function registerContactEnrichmentEngine() {
  const dispatcher = getTaskDispatcher();
  dispatcher.registerTask('ENRICH_CONTACT', (payload) => {
    return getContactEnrichmentEngine().execute(payload);
  });
}

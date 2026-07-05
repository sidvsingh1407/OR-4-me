/**
 * AI Enrichment Engine
 *
 * Transforms raw crawler output into structured intelligence.
 * Fetches from RawLeads and writes normalized records to Leads.
 */

const ENRICHMENT_STATES = {
  INITIALIZE: 'INITIALIZE',
  FETCH_BATCH: 'FETCH_BATCH',
  PROCESS_RECORDS: 'PROCESS_RECORDS',
  CHECKPOINT: 'CHECKPOINT'
};

class EnrichmentEngine {
  constructor() {
    this.logger = AppLogger.getLogger('EnrichmentEngine');
    this.db = getDatabase();
    this.ai = getAIProvider();
    this.config = getAppConfig();
    this.stateManager = getExecutionStateManager();
    this.timeoutManager = getTimeoutManager();
    this.batchSize = this.config.getNumber('ENRICHMENT.BATCH_SIZE', 5);

    // Initialize Sub-Extractors
    this.companyExtractor = new CompanyExtractor();
    this.executiveExtractor = new ExecutiveExtractor();
    this.technologyExtractor = new TechnologyExtractor();
    this.painExtractor = new PainExtractor();
    this.confidenceCalculator = new ConfidenceCalculator();
    this.qualityExtractor = new QualityExtractor();
    this.locationExtractor = new LocationExtractor();
    this.fundingExtractor = new FundingExtractor();
    this.hiringExtractor = new HiringExtractor();
    this.vendorExtractor = new VendorExtractor();
    this.riskExtractor = new RiskExtractor();
    this.signalExtractor = new SignalExtractor();
  }

  /**
   * Main entry point for the ENRICH_LEAD task.
   * @param {Object} payload - Task payload, typically state from a previous checkpoint.
   * @returns {Object} A contract object { status, nextState, payload }.
   */
  execute(payload = {}) {
    let currentState;

    // Handle queue integration where payload provides the rawLeadId explicitly
    if (payload && payload.rawLeadId && !payload.state) {
      this.logger.info('EnrichmentEngine', 'execute', `Processing single rawLead via Queue Task: ${payload.rawLeadId}`);
      const rawLead = this.fetchRawLeadById(payload.rawLeadId);
      if (!rawLead || rawLead.enrichmentStatus !== 'PENDING') {
         this.logger.warn('EnrichmentEngine', 'execute', `RawLead ${payload.rawLeadId} not found or not PENDING.`);
         return { status: 'SUCCESS', nextState: null, payload: null };
      }
      this.processBatch([rawLead]);
      return { status: 'SUCCESS', nextState: null, payload: null };
    }

    // Handle batched processing state machine (checkpointing)
    if (payload && payload.state) {
        currentState = payload;
    } else {
        currentState = { state: ENRICHMENT_STATES.INITIALIZE, processedCount: 0, currentBatch: [] };
    }

    this.logger.info('EnrichmentEngine', 'execute', `Starting execution from state: ${currentState.state}`);

    try {
      while (true) {
        if (this.timeoutManager.isApproachingTimeout()) {
          this.logger.warn('EnrichmentEngine', 'execute', 'Approaching timeout. Yielding to ExecutionEngine.');
          return { status: 'CONTINUE', nextState: currentState.state, payload: currentState };
        }

        switch (currentState.state) {
          case ENRICHMENT_STATES.INITIALIZE:
            this.logger.info('EnrichmentEngine', 'execute', 'Initializing Enrichment Engine');
            currentState.state = ENRICHMENT_STATES.FETCH_BATCH;
            break;

          case ENRICHMENT_STATES.FETCH_BATCH:
            this.logger.info('EnrichmentEngine', 'execute', 'Fetching batch of RawLeads');
            const batch = this.fetchPendingRawLeads(this.batchSize);
            if (batch.length === 0) {
              this.logger.info('EnrichmentEngine', 'execute', 'No pending RawLeads found. Ending execution.');
              return { status: 'SUCCESS', nextState: null, payload: null };
            }
            currentState.currentBatch = batch;
            currentState.state = ENRICHMENT_STATES.PROCESS_RECORDS;
            break;

          case ENRICHMENT_STATES.PROCESS_RECORDS:
            this.logger.info('EnrichmentEngine', 'execute', `Processing batch of ${currentState.currentBatch.length} records`);
            this.processBatch(currentState.currentBatch);
            currentState.processedCount += currentState.currentBatch.length;
            currentState.currentBatch = [];
            currentState.state = ENRICHMENT_STATES.CHECKPOINT;
            break;

          case ENRICHMENT_STATES.CHECKPOINT:
            this.logger.info('EnrichmentEngine', 'execute', `Checkpoint reached. Processed ${currentState.processedCount} records total.`);
            currentState.state = ENRICHMENT_STATES.FETCH_BATCH;
            return { status: 'CONTINUE', nextState: ENRICHMENT_STATES.FETCH_BATCH, payload: currentState };

          default:
            throw new Error(`Unknown state: ${currentState.state}`);
        }
      }
    } catch (error) {
      this.logger.error('EnrichmentEngine', 'execute', `Error in state ${currentState.state}`, error);
      throw error;
    }
  }

  fetchRawLeadById(rawLeadId) {
    const rawLeads = this.db.query('RawLeads', { rawLeadId: rawLeadId });
    return rawLeads.length > 0 ? rawLeads[0] : null;
  }

  fetchPendingRawLeads(limit) {
    const rawLeads = this.db.query('RawLeads', { enrichmentStatus: 'PENDING' });
    return rawLeads.slice(0, limit);
  }

  processBatch(batch) {
    const successfullyEnriched = [];
    const failedLeads = [];

    // Phase 1: Enrich all records without holding locks
    for (const rawLead of batch) {
      try {
        const enrichedData = this.enrichLead(rawLead);
        const normalizedData = this.runExtractors(enrichedData, rawLead);
        successfullyEnriched.push({ rawLeadId: rawLead._id, data: normalizedData });
      } catch (e) {
        this.logger.error('EnrichmentEngine', 'processBatch', `Failed to process RawLead ${rawLead._id}`, e);
        failedLeads.push({ rawLeadId: rawLead._id, error: e, retryCount: (rawLead.retryCount || 0) + 1 });
      }
    }

    // Phase 2: Batch write all successful records, holding locks only during DB writes
    if (successfullyEnriched.length > 0 || failedLeads.length > 0) {
      const lock = DistributedLockManager.acquire(30000, 'ENRICHMENT_BATCH');
      if (!lock) {
        throw new Error('Failed to acquire lock for processing batch.');
      }

      try {
        this.db.beginTransaction();

        // Batch Insert Leads
        if (successfullyEnriched.length > 0) {
           const leadsToInsert = successfullyEnriched.map(item => item.data);
           this.db.insert('Leads', leadsToInsert);

           // Update successfully processed RawLeads
           for (const item of successfullyEnriched) {
             this.db.update('RawLeads', item.rawLeadId, { enrichmentStatus: 'PROCESSED', lastAttempt: new Date().toISOString() });
           }
        }

        // Update failed RawLeads
        for (const failure of failedLeads) {
            const status = failure.retryCount > 3 ? 'FAILED' : 'PENDING';
            this.db.update('RawLeads', failure.rawLeadId, { enrichmentStatus: status, retryCount: failure.retryCount, lastAttempt: new Date().toISOString() });
        }

        this.db.commitTransaction();
      } catch (e) {
        this.db.rollbackTransaction();
        throw e;
      } finally {
        DistributedLockManager.release('ENRICHMENT_BATCH');
      }
    }
  }

  enrichLead(rawLead) {
    // Single unified prompt
    const prompt = `
    Extract structured business intelligence from the following raw crawler text.
    Return ONLY valid JSON according to this schema. Do not include markdown formatting or explanations.

    Schema:
    {
      "companyName": "string",
      "website": "string (URL)",
      "domain": "string",
      "industry": "string",
      "companySize": "string",
      "employeeEstimate": "number",
      "country": "string",
      "state": "string",
      "city": "string",
      "executiveNames": ["string"],
      "executiveTitles": ["string"],
      "technologiesMentioned": ["string"],
      "aiProductsMentioned": ["string"],
      "aiVendorsMentioned": ["string"],
      "fundingMentioned": "string",
      "hiringSignals": ["string"],
      "aiInitiatives": ["string"],
      "aiProblems": ["string"],
      "aiPainCategories": [
        {
          "category": "string",
          "subcategory": "string",
          "originalText": "string",
          "normalizedName": "string",
          "confidence": "number",
          "sourceSentence": "string"
        }
      ],
      "aiMaturityIndicators": ["string"],
      "riskIndicators": ["string"],
      "buyingSignals": ["string"]
    }

    Raw Text:
    Title: ${this.normalizeText(rawLead.title || '')}
    Description: ${this.normalizeText(rawLead.description || '')}
    Body: ${this.normalizeText(rawLead.body || '')}
    `;

    return RetryEngine.execute(() => {
        const responseText = this.ai.generate(prompt, { max_tokens: 4096 });

        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('\`\`\`json')) {
            cleanedText = cleanedText.substring(7);
            if (cleanedText.endsWith('\`\`\`')) {
                cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            }
        } else if (cleanedText.startsWith('\`\`\`')) {
             cleanedText = cleanedText.substring(3);
             if (cleanedText.endsWith('\`\`\`')) {
                cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            }
        }

        try {
            return JSON.parse(cleanedText);
        } catch (e) {
             throw new Error(`Failed to parse AI output as JSON: ${e.message}`);
        }
    }, { maxRetries: 3, baseDelayMs: 2000, context: 'AI_ENRICH_LEAD' });
  }

  normalizeText(text) {
      if (!text || typeof text !== 'string') return '';
      // Remove HTML tags
      let normalized = text.replace(/<[^>]*>?/gm, ' ');
      // Decode HTML entities
      normalized = normalized.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      // Remove Markdown links
      normalized = normalized.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Remove duplicate punctuation
      normalized = normalized.replace(/([.,?!])\1+/g, '$1');
      // Normalize whitespace
      normalized = normalized.replace(/\s+/g, ' ').trim();
      return normalized;
  }

  runExtractors(aiData, rawLead) {
     const company = this.companyExtractor.extract(aiData);
     const executives = this.executiveExtractor.extract(aiData);
     const technologies = this.technologyExtractor.extract(aiData);
     const painSignals = this.painExtractor.extract(aiData);
     const location = this.locationExtractor.extract(aiData);
     const funding = this.fundingExtractor.extract(aiData);
     const hiring = this.hiringExtractor.extract(aiData);
     const vendors = this.vendorExtractor.extract(aiData);
     const risks = this.riskExtractor.extract(aiData);
     const signals = this.signalExtractor.extract(aiData);

     const confidenceScore = this.confidenceCalculator.calculate(aiData);
     const qualityScore = this.qualityExtractor.calculate(aiData);

     return {
        company: company.name,
        domain: company.domain,
        score: qualityScore,
        website: company.website,
        industry: company.industry,
        companySize: company.companySize,
        employeeEstimate: company.employeeEstimate,
        country: location.country,
        state: location.state,
        city: location.city,
        executiveNames: executives.names,
        executiveTitles: executives.titles,
        technologiesMentioned: technologies.technologiesMentioned,
        aiProductsMentioned: technologies.aiProductsMentioned,
        aiVendorsMentioned: vendors.aiVendorsMentioned,
        fundingMentioned: funding.fundingMentioned,
        hiringSignals: hiring.hiringSignals,
        aiInitiatives: signals.aiInitiatives,
        aiProblems: signals.aiProblems,
        aiPainCategories: JSON.stringify(painSignals),
        aiMaturityIndicators: signals.aiMaturityIndicators,
        riskIndicators: risks.riskIndicators,
        buyingSignals: signals.buyingSignals,
        sourceQuality: qualityScore,
        confidenceScore: confidenceScore,
        completenessScore: qualityScore,
        freshnessScore: this.qualityExtractor.calculateFreshness(rawLead),
        reliabilityScore: confidenceScore,
        sourceTrustScore: this.qualityExtractor.calculateTrust(rawLead),
        extractionQualityScore: qualityScore,
        overallQualityScore: Math.round((confidenceScore + qualityScore) / 2),
        originalSource: rawLead.source || 'Unknown',
        originalUrl: rawLead.url || '',
        crawlTimestamp: rawLead.crawlTimestamp || new Date().toISOString()
     };
  }
}

// ---------------------------------------------------------------------------
// DETERMINISTIC EXTRACTOR MODULES
// ---------------------------------------------------------------------------

class CompanyExtractor {
    extract(data) {
        return {
            name: this.normalizeName(data.companyName),
            website: this.normalizeUrl(data.website),
            domain: this.normalizeDomain(data.domain),
            industry: this.normalizeIndustry(data.industry),
            companySize: this.normalizeString(data.companySize),
            employeeEstimate: this.normalizeNumber(data.employeeEstimate)
        };
    }
    normalizeName(name) {
        if (!name || typeof name !== 'string') return 'Unknown';
        return name.trim().replace(/\b(Inc\.|LLC|Corp\.|Ltd\.)\b/gi, '').trim();
    }
    normalizeUrl(url) {
        if (!url || typeof url !== 'string') return '';
        url = url.trim().toLowerCase();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        return url;
    }
    normalizeDomain(domain) {
        if (!domain || typeof domain !== 'string') return '';
        domain = domain.trim().toLowerCase();
        domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
        return domain.split('/')[0];
    }
    normalizeIndustry(ind) {
        if (!ind || typeof ind !== 'string') return '';
        // Simple capitalize first letter
        return ind.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
    normalizeString(str) {
        return (typeof str === 'string') ? str.trim() : '';
    }
    normalizeNumber(num) {
        return (typeof num === 'number' && !isNaN(num)) ? num : 0;
    }
}

class ExecutiveExtractor {
    extract(data) {
        return {
            names: this.normalizeArray(data.executiveNames).map(n => this.capitalize(n)).join(', '),
            titles: this.normalizeArray(data.executiveTitles).map(t => this.capitalize(t)).join(', ')
        };
    }
    normalizeArray(arr) {
        if (!Array.isArray(arr)) return typeof arr === 'string' ? [arr] : [];
        return arr.filter(i => typeof i === 'string' && i.trim().length > 0).map(i => i.trim());
    }
    capitalize(str) {
        return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
}

class TechnologyExtractor {
    extract(data) {
        return {
            technologiesMentioned: this.normalizeArray(data.technologiesMentioned).join(', '),
            aiProductsMentioned: this.normalizeArray(data.aiProductsMentioned).join(', ')
        };
    }
    normalizeArray(arr) {
        if (!Array.isArray(arr)) return typeof arr === 'string' ? [arr] : [];
        return arr.filter(i => typeof i === 'string' && i.trim().length > 0).map(i => i.trim());
    }
}

class PainExtractor {
    extract(data) {
        if (!Array.isArray(data.aiPainCategories)) return [];
        return data.aiPainCategories.map(pain => ({
            category: this.normalizeString(pain.category),
            subcategory: this.normalizeString(pain.subcategory),
            originalText: this.normalizeString(pain.originalText),
            normalizedName: this.normalizeString(pain.normalizedName),
            confidence: this.normalizeNumber(pain.confidence, 50),
            sourceSentence: this.normalizeString(pain.sourceSentence)
        }));
    }
    normalizeString(str) { return (typeof str === 'string') ? str.trim() : ''; }
    normalizeNumber(num, def) { return (typeof num === 'number' && !isNaN(num)) ? num : def; }
}

class ConfidenceCalculator {
    calculate(data) {
        let score = 50;
        if (data.companyName && data.companyName.trim() !== '') score += 15;
        if (data.domain && data.domain.trim() !== '') score += 10;
        if (Array.isArray(data.executiveNames) && data.executiveNames.length > 0) score += 10;
        if (Array.isArray(data.aiInitiatives) && data.aiInitiatives.length > 0) score += 10;
        if (Array.isArray(data.aiPainCategories) && data.aiPainCategories.length > 0) score += 5;
        return Math.min(score, 100);
    }
}

class QualityExtractor {
    calculate(data) {
        let score = 0;
        const keys = Object.keys(data);
        if (keys.length === 0) return 0;
        let filledKeys = 0;
        for (const key of keys) {
            if (data[key] && (typeof data[key] === 'string' || (Array.isArray(data[key]) && data[key].length > 0))) {
                filledKeys++;
            }
        }
        return Math.floor((filledKeys / keys.length) * 100);
    }
    calculateFreshness(rawLead) {
        if (!rawLead.crawlTimestamp) return 50;
        try {
             const crawlDate = new Date(rawLead.crawlTimestamp);
             const diffDays = Math.floor((new Date() - crawlDate) / (1000 * 60 * 60 * 24));
             if (diffDays <= 1) return 100;
             if (diffDays <= 7) return 80;
             if (diffDays <= 30) return 60;
             return 40;
        } catch(e) { return 50; }
    }
    calculateTrust(rawLead) {
        const source = (rawLead.source || '').toLowerCase();
        if (source.includes('linkedin') || source.includes('bloomberg') || source.includes('reuters')) return 95;
        if (source.includes('news') || source.includes('blog')) return 75;
        return 60;
    }
}

class LocationExtractor {
    extract(data) {
        return {
            country: this.normalizeString(data.country),
            state: this.normalizeString(data.state),
            city: this.normalizeString(data.city)
        };
    }
    normalizeString(str) { return (typeof str === 'string') ? str.trim() : ''; }
}

class FundingExtractor {
    extract(data) {
        return { fundingMentioned: this.normalizeString(data.fundingMentioned) };
    }
    normalizeString(str) { return (typeof str === 'string') ? str.trim() : ''; }
}

class HiringExtractor {
    extract(data) {
        return { hiringSignals: this.normalizeArray(data.hiringSignals).join(', ') };
    }
    normalizeArray(arr) {
        if (!Array.isArray(arr)) return typeof arr === 'string' ? [arr] : [];
        return arr.filter(i => typeof i === 'string' && i.trim().length > 0).map(i => i.trim());
    }
}

class VendorExtractor {
    extract(data) {
        return { aiVendorsMentioned: this.normalizeArray(data.aiVendorsMentioned).join(', ') };
    }
    normalizeArray(arr) {
        if (!Array.isArray(arr)) return typeof arr === 'string' ? [arr] : [];
        return arr.filter(i => typeof i === 'string' && i.trim().length > 0).map(i => i.trim());
    }
}

class RiskExtractor {
    extract(data) {
        return { riskIndicators: this.normalizeArray(data.riskIndicators).join(', ') };
    }
    normalizeArray(arr) {
        if (!Array.isArray(arr)) return typeof arr === 'string' ? [arr] : [];
        return arr.filter(i => typeof i === 'string' && i.trim().length > 0).map(i => i.trim());
    }
}

class SignalExtractor {
    extract(data) {
        return {
            aiInitiatives: this.normalizeArray(data.aiInitiatives).join(', '),
            aiProblems: this.normalizeArray(data.aiProblems).join(', '),
            aiMaturityIndicators: this.normalizeArray(data.aiMaturityIndicators).join(', '),
            buyingSignals: this.normalizeArray(data.buyingSignals).join(', ')
        };
    }
    normalizeArray(arr) {
        if (!Array.isArray(arr)) return typeof arr === 'string' ? [arr] : [];
        return arr.filter(i => typeof i === 'string' && i.trim().length > 0).map(i => i.trim());
    }
}

// Registration exported as a function to be called during bootstrap.
function registerEnrichmentEngine() {
  const dispatcher = getTaskDispatcher();
  dispatcher.registerTask('ENRICH_LEAD', (payload) => {
    const engine = new EnrichmentEngine();
    return engine.execute(payload);
  });
}

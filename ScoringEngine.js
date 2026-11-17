/**
 * TarkaX Phase 8 - Buying Intent & Lead Scoring Engine
 *
 * Deterministic, rules-based engine to calculate AI Adoption Pain
 * Buying Intent Score, incorporating various signals (pain, growth, hiring, etc.).
 */

// ============================================================================
// BASE SCORER INTERFACE
// ============================================================================

class BaseScorer {
  constructor(name) {
    this.name = name;
  }

  /**
   * Evaluates the lead and returns a score component object.
   * @param {Object} lead - The structured lead record.
   * @param {Object} rawLead - The corresponding raw lead record (optional).
   * @returns {Object} { score: number, signals: string[], reasoning: string[], detected: string[] }
   */
  evaluate(lead, rawLead) {
    throw new Error(`Scorer ${this.name} must implement evaluate()`);
  }

  /**
   * Helper method to parse a string field containing comma-separated or JSON values
   */
  _parseField(value) {
    if (!value) return [];
    if (typeof value === 'object' && Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Try parsing as JSON first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback to comma separated
      }
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  /**
   * Text matching utility that checks if terms exist in a text corpus
   * @param {string} text - The text to search within.
   * @param {Array<Object>} dictionary - Array of { term, score } objects
   * @returns {Array<Object>} List of matched terms with their scores
   */
  _matchTerms(text, dictionary) {
    if (!text || typeof text !== 'string') return [];
    const matched = [];
    const lowerText = text.toLowerCase();

    for (const item of dictionary) {
      if (item.term && lowerText.includes(item.term.toLowerCase())) {
        matched.push(item);
      }
    }
    return matched;
  }
}

// ============================================================================
// SPECIFIC SCORERS
// ============================================================================

class PainScorer extends BaseScorer {
  constructor() {
    super('Pain');
    this.dictionary = getAppConfig().get('SCORING.SIGNALS.PAIN') || [];
  }

  evaluate(lead, rawLead) {
    let score = 0;
    const signals = [];
    const reasoning = [];
    const detected = [];
    const matchedTerms = new Set();

    // 1. Check structured fields first
    const painCategories = this._parseField(lead.aiPainCategories);
    if (painCategories.length > 0) {
      for (const cat of painCategories) {
        for (const dictItem of this.dictionary) {
          if (cat.toLowerCase().includes(dictItem.term.toLowerCase()) && !matchedTerms.has(dictItem.term)) {
             score += dictItem.score;
             signals.push(`Structured Pain: ${dictItem.term}`);
             detected.push(dictItem.term);
             matchedTerms.add(dictItem.term);
          }
        }
      }
    }

    const aiProblems = this._parseField(lead.aiProblems);
     if (aiProblems.length > 0) {
      for (const prob of aiProblems) {
        for (const dictItem of this.dictionary) {
          if (prob.toLowerCase().includes(dictItem.term.toLowerCase()) && !matchedTerms.has(dictItem.term)) {
             score += dictItem.score;
             signals.push(`Structured Problem: ${dictItem.term}`);
             detected.push(dictItem.term);
             matchedTerms.add(dictItem.term);
          }
        }
      }
    }

    // 2. Scan raw text if available
    let textToScan = [lead.buyingSignals, lead.riskIndicators].join(' ');
    if (rawLead && rawLead.body) {
      textToScan += ' ' + rawLead.body;
    }

    const textMatches = this._matchTerms(textToScan, this.dictionary);
    for (const match of textMatches) {
      if (!matchedTerms.has(match.term)) {
        score += match.score;
        signals.push(`Text Mention: ${match.term}`);
        detected.push(match.term);
        matchedTerms.add(match.term);
      }
    }

    if (score > 0) {
      reasoning.push(`Identified ${matchedTerms.size} distinct AI pain indicators.`);
    }

    return { score: Math.min(score, 100), signals, reasoning, detected };
  }
}

class GrowthScorer extends BaseScorer {
  constructor() {
    super('Growth');
    this.dictionary = getAppConfig().get('SCORING.SIGNALS.GROWTH') || [];
  }

  evaluate(lead, rawLead) {
    let score = 0;
    const signals = [];
    const reasoning = [];
    const detected = [];
    const matchedTerms = new Set();

    let textToScan = [lead.buyingSignals, lead.companySize].join(' ');
    if (rawLead && rawLead.body) {
      textToScan += ' ' + rawLead.body;
    }

    const textMatches = this._matchTerms(textToScan, this.dictionary);
    for (const match of textMatches) {
      if (!matchedTerms.has(match.term)) {
        score += match.score;
        signals.push(`Growth Signal: ${match.term}`);
        detected.push(match.term);
        matchedTerms.add(match.term);
      }
    }

    // Explicit rule for high employee estimate, proxy for potential growth/size
    const enterpriseThreshold = getAppConfig().getNumber('SCORING.GROWTH.ENTERPRISE_THRESHOLD', 1000);
    const enterpriseScore = getAppConfig().getNumber('SCORING.GROWTH.ENTERPRISE_SCORE', 10);

    if (lead.employeeEstimate && Number(lead.employeeEstimate) > enterpriseThreshold) {
      score += enterpriseScore;
      signals.push(`Enterprise Scale (${enterpriseThreshold}+ employees)`);
      reasoning.push(`Company has enterprise-level employee count (>${enterpriseThreshold}).`);
    }

    if (score > 0 && reasoning.length === 0) {
      reasoning.push(`Identified ${matchedTerms.size} growth indicators.`);
    }

    return { score: Math.min(score, 100), signals, reasoning, detected };
  }
}

class HiringScorer extends BaseScorer {
  constructor() {
    super('Hiring');
    this.dictionary = getAppConfig().get('SCORING.SIGNALS.HIRING') || [];
  }

  evaluate(lead, rawLead) {
    let score = 0;
    const signals = [];
    const reasoning = [];
    const detected = [];
    const matchedTerms = new Set();

    const hiringSignals = this._parseField(lead.hiringSignals);
    if (hiringSignals.length > 0) {
      for (const signal of hiringSignals) {
        for (const dictItem of this.dictionary) {
          if (signal.toLowerCase().includes(dictItem.term.toLowerCase()) && !matchedTerms.has(dictItem.term)) {
             score += dictItem.score;
             signals.push(`Hiring: ${dictItem.term}`);
             detected.push(dictItem.term);
             matchedTerms.add(dictItem.term);
          }
        }
      }
    }

    let textToScan = '';
    if (rawLead && rawLead.body) {
      textToScan += rawLead.body;
    }

    const textMatches = this._matchTerms(textToScan, this.dictionary);
    for (const match of textMatches) {
      if (!matchedTerms.has(match.term)) {
        score += match.score;
        signals.push(`Hiring Mention: ${match.term}`);
        detected.push(match.term);
        matchedTerms.add(match.term);
      }
    }

    if (score > 0) {
      reasoning.push(`Identified active hiring for ${matchedTerms.size} AI-related roles.`);
    }

    return { score: Math.min(score, 100), signals, reasoning, detected };
  }
}

class TechnologyScorer extends BaseScorer {
  constructor() {
    super('Technology');
    this.dictionary = getAppConfig().get('SCORING.SIGNALS.TECHNOLOGY') || [];
  }

  evaluate(lead, rawLead) {
    let score = 0;
    const signals = [];
    const reasoning = [];
    const detected = [];
    const matchedTerms = new Set();

    const techFields = [
      ...this._parseField(lead.technologiesMentioned),
      ...this._parseField(lead.aiProductsMentioned),
      ...this._parseField(lead.aiVendorsMentioned)
    ];

    if (techFields.length > 0) {
      for (const tech of techFields) {
        for (const dictItem of this.dictionary) {
          if (tech.toLowerCase().includes(dictItem.term.toLowerCase()) && !matchedTerms.has(dictItem.term)) {
             score += dictItem.score;
             signals.push(`Tech Stack: ${dictItem.term}`);
             detected.push(dictItem.term);
             matchedTerms.add(dictItem.term);
          }
        }
      }
    }

    let textToScan = '';
    if (rawLead && rawLead.body) {
      textToScan += rawLead.body;
    }

    const textMatches = this._matchTerms(textToScan, this.dictionary);
    for (const match of textMatches) {
      if (!matchedTerms.has(match.term)) {
        score += match.score;
        signals.push(`Tech Mention: ${match.term}`);
        detected.push(match.term);
        matchedTerms.add(match.term);
      }
    }

    if (score > 0) {
      reasoning.push(`Identified adoption or discussion of ${matchedTerms.size} key AI technologies.`);
    }

    return { score: Math.min(score, 100), signals, reasoning, detected };
  }
}

class FundingScorer extends BaseScorer {
  constructor() {
    super('Funding');
    this.dictionary = getAppConfig().get('SCORING.SIGNALS.FUNDING') || [];
  }

  evaluate(lead, rawLead) {
    let score = 0;
    const signals = [];
    const reasoning = [];
    const detected = [];
    const matchedTerms = new Set();

    const fundingMentioned = this._parseField(lead.fundingMentioned);
    if (fundingMentioned.length > 0) {
      for (const funding of fundingMentioned) {
        for (const dictItem of this.dictionary) {
          if (funding.toLowerCase().includes(dictItem.term.toLowerCase()) && !matchedTerms.has(dictItem.term)) {
             score += dictItem.score;
             signals.push(`Funding Event: ${dictItem.term}`);
             detected.push(dictItem.term);
             matchedTerms.add(dictItem.term);
          }
        }
      }
    }

    let textToScan = lead.buyingSignals || '';
    if (rawLead && rawLead.body) {
      textToScan += ' ' + rawLead.body;
    }

    const textMatches = this._matchTerms(textToScan, this.dictionary);
    for (const match of textMatches) {
      if (!matchedTerms.has(match.term)) {
        score += match.score;
        signals.push(`Funding Mention: ${match.term}`);
        detected.push(match.term);
        matchedTerms.add(match.term);
      }
    }

    if (score > 0) {
      reasoning.push(`Identified positive funding or expansion events.`);
    }

    return { score: Math.min(score, 100), signals, reasoning, detected };
  }
}

class ExecutiveScorer extends BaseScorer {
  constructor() {
    super('Executive');
    this.dictionary = getAppConfig().get('SCORING.SIGNALS.EXECUTIVE') || [];
  }

  evaluate(lead, rawLead) {
    let score = 0;
    const signals = [];
    const reasoning = [];
    const detected = [];
    const matchedTerms = new Set();

    const executiveTitles = this._parseField(lead.executiveTitles);
    if (executiveTitles.length > 0) {
      for (const title of executiveTitles) {
        for (const dictItem of this.dictionary) {
          if (title.toLowerCase().includes(dictItem.term.toLowerCase()) && !matchedTerms.has(dictItem.term)) {
             score += dictItem.score;
             signals.push(`Executive Title: ${dictItem.term}`);
             detected.push(dictItem.term);
             matchedTerms.add(dictItem.term);
          }
        }
      }
    }

    let textToScan = [lead.aiInitiatives, lead.executiveNames].join(' ');
    if (rawLead && rawLead.body) {
      textToScan += ' ' + rawLead.body;
    }

    const textMatches = this._matchTerms(textToScan, this.dictionary);
    for (const match of textMatches) {
      if (!matchedTerms.has(match.term)) {
        score += match.score;
        signals.push(`Executive Signal: ${match.term}`);
        detected.push(match.term);
        matchedTerms.add(match.term);
      }
    }

    if (score > 0) {
      reasoning.push(`Identified strategic AI leadership or initiatives.`);
    }

    return { score: Math.min(score, 100), signals, reasoning, detected };
  }
}

// ============================================================================
// MASTER SCORING ENGINE
// ============================================================================

class ScoringEngine {
  constructor() {
    this.config = getAppConfig();
    this.db = getDatabase();
    this.logger = getLogger();

    this.scorers = [
      new PainScorer(),
      new GrowthScorer(),
      new HiringScorer(),
      new TechnologyScorer(),
      new FundingScorer(),
      new ExecutiveScorer()
    ];
  }

  /**
   * Calculates the score for an individual lead without persisting.
   * @param {Object} lead - The lead record.
   * @param {Object} rawLead - The raw lead record (optional).
   * @returns {Object} The complete ScoreResult object.
   */
  calculateScore(lead, rawLead = null) {
    // Calculate base scores from all modules
    const breakdown = {};
    let totalWeightedScore = 0;
    let allSignals = [];
    let allReasoning = [];
    let allDetected = [];

    for (const scorer of this.scorers) {
      const result = scorer.evaluate(lead, rawLead);
      const weight = this.config.getNumber(`SCORING.WEIGHTS.${scorer.name.toUpperCase()}`, 0);

      breakdown[scorer.name] = result.score;
      totalWeightedScore += (result.score * weight);

      if (result.signals.length > 0) {
          allSignals = allSignals.concat(result.signals);
          allReasoning = allReasoning.concat(result.reasoning);
          allDetected = allDetected.concat(result.detected);
      }
    }

    // Adjust for decay based on crawlTimestamp
    const freshnessFactor = this._calculateFreshnessDecay(lead.crawlTimestamp);
    let finalScore = totalWeightedScore * freshnessFactor;

    // Adjust for source confidence
    const confidenceMultiplier = this._calculateConfidenceMultiplier(lead.originalSource);
    finalScore = finalScore * confidenceMultiplier;

    // Cap at MAX_SCORE
    const maxScore = this.config.getNumber('SCORING.MAX_SCORE', 100);
    finalScore = Math.min(Math.round(finalScore), maxScore);

    const overallConfidence = Math.round(confidenceMultiplier * freshnessFactor * 100);

    // Determine Tier & Action
    const tierInfo = this._determineTier(finalScore);

    // Structure Result
    return {
      buyingIntentScore: finalScore,
      confidenceScore: overallConfidence,
      painScore: breakdown['Pain'] || 0,
      growthScore: breakdown['Growth'] || 0,
      technologyScore: breakdown['Technology'] || 0,
      hiringScore: breakdown['Hiring'] || 0,
      priorityTier: tierInfo.label,
      recommendedAction: tierInfo.action,
      reasoning: allReasoning.length > 0 ? Array.from(new Set(allReasoning)).join(' | ') : 'Insufficient signals for reasoning.',
      contributingSignals: Array.from(new Set(allSignals)).slice(0, 10).join(', '), // Top 10
      detectedPains: Array.from(new Set(allDetected)).slice(0, 10).join(', '),
      signalBreakdown: JSON.stringify(breakdown),
      scoreBreakdown: JSON.stringify({
          rawScore: Math.round(totalWeightedScore),
          freshnessFactor: freshnessFactor.toFixed(2),
          confidenceMultiplier: confidenceMultiplier.toFixed(2)
      }),
      calculatedAt: DBUtils.getTimestamp()
    };
  }

  /**
   * Scores an individual lead and persists it.
   * @param {string} leadId - The ID of the lead in the Leads table.
   * @param {Object} [leadRecord] - Optional lead record object to avoid querying.
   * @returns {Object} The complete ScoreResult object.
   */
  scoreLead(leadId, leadRecord = null) {
    try {
      const lead = leadRecord || this.db.getById('Leads', leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found.`);
      }

      let rawLead = null;
      if (lead.originalUrl) {
          const results = this.db.findMany('RawLeads', { url: lead.originalUrl });
          if (results && results.length > 0) {
              rawLead = results[0];
          }
      }

      const scoreResult = this.calculateScore(lead, rawLead);

      // Persist to Database
      this._persistScore(lead._id, scoreResult);

      this.logger.info('ScoringEngine', 'scoreLead', `Successfully scored lead ${leadId}`, { finalScore: scoreResult.buyingIntentScore, tier: scoreResult.priorityTier });

      return scoreResult;

    } catch (e) {
      this.logger.error('ScoringEngine', 'scoreLead', `Failed to score lead ${leadId}`, e);
      throw e;
    }
  }

  /**
   * Batch scores multiple leads.
   * @param {Array<string>} leadIds - Array of lead IDs.
   */
  batchScore(leadIds) {
      if (!Array.isArray(leadIds) || leadIds.length === 0) return;

      this.logger.info('ScoringEngine', 'batchScore', `Starting batch scoring for ${leadIds.length} leads.`);

      const updatesById = {};

      for (const id of leadIds) {
          try {
              const lead = this.db.getById('Leads', id);
              if (!lead) continue;

              let rawLead = null;
              if (lead.originalUrl) {
                  const results = this.db.findMany('RawLeads', { url: lead.originalUrl });
                  if (results && results.length > 0) {
                      rawLead = results[0];
                  }
              }

              const scoreResult = this.calculateScore(lead, rawLead);
              updatesById[id] = scoreResult;
          } catch(e) {
              this.logger.error('ScoringEngine', 'batchScore', `Failed to calculate score for lead ${id}`, e);
          }
      }

      if (Object.keys(updatesById).length > 0) {
          try {
              this.db.batchUpdate('Leads', updatesById);
              this.logger.info('ScoringEngine', 'batchScore', `Successfully batch updated ${Object.keys(updatesById).length} leads.`);
          } catch(e) {
              this.logger.error('ScoringEngine', 'batchScore', `Failed to persist batch score updates`, e);
          }
      }
  }

  _persistScore(leadId, scoreResult) {
    this.db.update('Leads', leadId, scoreResult);
  }

  _calculateFreshnessDecay(timestampStr) {
      if (!timestampStr) return 1.0; // Assume fresh if no timestamp

      try {
          const timestamp = new Date(timestampStr).getTime();
          const now = Date.now();
          const ageDays = (now - timestamp) / (1000 * 60 * 60 * 24);

          if (ageDays < 0) return 1.0;

          const floor = this.config.getNumber('SCORING.DECAY.FLOOR', 0.5);
          const maxDays = this.config.getNumber('SCORING.DECAY.MAX_DAYS', 90);

          if (ageDays > maxDays) return floor;

          const decayRate = this.config.getNumber('SCORING.DECAY.RATE', 0.05); // e.g. 5% per week
          const ageWeeks = ageDays / 7;

          const decayFactor = Math.max(floor, 1.0 - (ageWeeks * decayRate));
          return decayFactor;

      } catch(e) {
          return 1.0; // Fail open
      }
  }

  _calculateConfidenceMultiplier(source) {
      if (!source) return this.config.getNumber('SCORING.CONFIDENCE.UNKNOWN', 0.5);

      const srcUpper = source.toUpperCase();

      if (srcUpper.includes('LINKEDIN')) return this.config.getNumber('SCORING.CONFIDENCE.LINKEDIN', 1.0);
      if (srcUpper.includes('GITHUB')) return this.config.getNumber('SCORING.CONFIDENCE.GITHUB', 0.9);
      if (srcUpper.includes('REDDIT')) return this.config.getNumber('SCORING.CONFIDENCE.REDDIT', 0.7);
      if (srcUpper.includes('HACKER') || srcUpper.includes('YC')) return this.config.getNumber('SCORING.CONFIDENCE.HACKERNEWS', 0.8);
      if (srcUpper.includes('NEWS') || srcUpper.includes('BLOG')) return this.config.getNumber('SCORING.CONFIDENCE.NEWS', 0.85);

      return this.config.getNumber('SCORING.CONFIDENCE.UNKNOWN', 0.6);
  }

  _determineTier(score) {
      if (score >= this.config.getNumber('SCORING.TIERS.TIER_1.MIN_SCORE', 85)) {
          return {
              label: this.config.get('SCORING.TIERS.TIER_1.LABEL', 'Tier 1'),
              action: this.config.get('SCORING.TIERS.TIER_1.ACTION', 'Immediate Outreach')
          };
      }
      if (score >= this.config.getNumber('SCORING.TIERS.TIER_2.MIN_SCORE', 70)) {
          return {
              label: this.config.get('SCORING.TIERS.TIER_2.LABEL', 'Tier 2'),
              action: this.config.get('SCORING.TIERS.TIER_2.ACTION', 'High Priority')
          };
      }
      if (score >= this.config.getNumber('SCORING.TIERS.TIER_3.MIN_SCORE', 50)) {
          return {
              label: this.config.get('SCORING.TIERS.TIER_3.LABEL', 'Tier 3'),
              action: this.config.get('SCORING.TIERS.TIER_3.ACTION', 'Warm Lead')
          };
      }
      if (score >= this.config.getNumber('SCORING.TIERS.TIER_4.MIN_SCORE', 30)) {
          return {
              label: this.config.get('SCORING.TIERS.TIER_4.LABEL', 'Tier 4'),
              action: this.config.get('SCORING.TIERS.TIER_4.ACTION', 'Monitor')
          };
      }
      return {
          label: this.config.get('SCORING.TIERS.TIER_5.LABEL', 'Tier 5'),
          action: this.config.get('SCORING.TIERS.TIER_5.ACTION', 'Ignore')
      };
  }
}

// Global Singleton Getter
let _scoringEngineInstance = null;
function getScoringEngine() {
  if (!_scoringEngineInstance) {
    _scoringEngineInstance = new ScoringEngine();
  }
  return _scoringEngineInstance;
}

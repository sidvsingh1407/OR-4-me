/**
 * TarkaX Recommendation Engine
 *
 * Deterministically evaluates a lead and identifies the best TarkaX product fit.
 * Uses configuration to evaluate pain categories against product profiles.
 */

class RecommendationEngine {
  constructor() {
    this.config = getAppConfig();
    this.db = getDatabase();
    this.logger = getLogger();
    this.products = this.config.get('RECOMMENDATION.PRODUCTS', {});
    this.highConfidenceThreshold = this.config.getNumber('RECOMMENDATION.THRESHOLDS.HIGH_CONFIDENCE', 75);
    this.minFitScoreThreshold = this.config.getNumber('RECOMMENDATION.THRESHOLDS.MIN_FIT_SCORE', 30);
  }

  /**
   * Main entry point to analyze a lead and generate recommendations.
   * @param {string} leadId - The ID of the lead to analyze.
   * @returns {Object} The complete recommendation result.
   */
  analyzeLead(leadId) {
    try {
      const lead = this.db.getById('Leads', leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found.`);
      }

      const result = this.generateRecommendation(lead);
      this._persistRecommendation(lead._id, result);

      this.logger.info('RecommendationEngine', 'analyzeLead', `Successfully analyzed lead ${leadId}`, { primaryProduct: result.primaryProduct, confidence: result.recommendationConfidence });
      return result;
    } catch (e) {
      this.logger.error('RecommendationEngine', 'analyzeLead', `Failed to analyze lead ${leadId}`, e);
      throw e;
    }
  }

  /**
   * Helper method to parse a string field containing comma-separated or JSON values
   */
  _parseField(value) {
    if (!value) return [];
    if (typeof value === 'object' && Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  /**
   * Calculates fit scores for all products for a given lead.
   * @param {Object} lead - The lead record.
   * @returns {Object} Map of product keys to their fit scores and evidence.
   */
  calculateProductFit(lead) {
    const fits = {};

    const extractedPains = new Set();
    const parsedPainCategories = this._parseField(lead.aiPainCategories);
    const parsedProblems = this._parseField(lead.aiProblems);

    parsedPainCategories.forEach(p => extractedPains.add(p.toLowerCase()));
    parsedProblems.forEach(p => extractedPains.add(p.toLowerCase()));

    let combinedText = [lead.buyingSignals, lead.riskIndicators, lead.aiInitiatives].join(' ').toLowerCase();

    for (const [productKey, productDef] of Object.entries(this.products)) {
      let score = 0;
      let matchedSignals = [];

      for (const signal of productDef.signals) {
        const signalLower = signal.toLowerCase();

        let found = false;
        if (extractedPains.has(signalLower)) {
            found = true;
        } else if (combinedText.includes(signalLower)) {
            found = true;
        }

        if (found) {
            score += 20; // Base score per signal matched
            matchedSignals.push(signal);
        }
      }

      // Add a bonus if model is confident about the signals generally (using lead.sourceTrustScore or similar if present, here just a small boost if a lot matched)
      if (matchedSignals.length > 3) {
          score += 15;
      }

      fits[productKey] = {
        score: Math.min(score, 100),
        evidenceCount: matchedSignals.length,
        matchedSignals: matchedSignals
      };
    }

    return fits;
  }

  /**
   * Determines the primary product to recommend based on fit scores.
   */
  determinePrimaryProduct(fits) {
    let topProduct = null;
    let topScore = -1;

    for (const [key, fitData] of Object.entries(fits)) {
      if (fitData.score > topScore && fitData.score >= this.minFitScoreThreshold) {
        topScore = fitData.score;
        topProduct = key;
      }
    }
    return topProduct;
  }

  /**
   * Determines the secondary product.
   */
  determineSecondaryProduct(fits, primaryProduct) {
    let topProduct = null;
    let topScore = -1;

    for (const [key, fitData] of Object.entries(fits)) {
      if (key !== primaryProduct && fitData.score > topScore && fitData.score >= this.minFitScoreThreshold) {
        topScore = fitData.score;
        topProduct = key;
      }
    }
    return topProduct;
  }

  /**
   * Predicts business outcome based on primary product and matched signals.
   */
  predictBusinessOutcome(productKey, fitData) {
    if (!productKey || !this.products[productKey]) return 'No clear business outcome identified.';
    const product = this.products[productKey];
    return product.businessOutcomes.join(', ');
  }

  /**
   * Generates a deterministic sales briefing.
   */
  generateSalesBrief(lead, recommendation, primaryKey, secondaryKey) {
    if (!primaryKey) {
        return `COMPANY: ${lead.company}\n\nNo TarkaX product currently meets the minimum fit threshold. Monitor for future signals.`;
    }

    const product = this.products[primaryKey];
    const topPains = this._parseField(lead.aiPainCategories).slice(0, 3).join(', ') || 'General AI concerns';

    return `COMPANY SUMMARY:
${lead.company} (${lead.industry || 'Unknown Industry'}) - ${lead.employeeEstimate || 'Unknown'} employees

DETECTED AI PAIN:
${topPains}

EVIDENCE SUMMARY:
Detected ${recommendation.evidenceCount} explicit signals indicating a need for ${product.name}.
Signals include: ${recommendation.matchedSignals.slice(0, 3).join(', ')}.

RECOMMENDED PRODUCT:
Primary: ${product.name}
${secondaryKey ? `Secondary: ${this.products[secondaryKey].name}` : ''}

REASON FOR RECOMMENDATION:
${recommendation.recommendationReason}

EXPECTED BUSINESS OUTCOME:
${recommendation.expectedBusinessOutcome}

SUGGESTED DISCOVERY QUESTIONS:
- ${product.discoveryQuestions.join('\n- ')}

SUGGESTED FIRST CONVERSATION ANGLE:
${product.firstConversationAngle}`;
  }

  /**
   * Generates the complete recommendation object for a lead.
   */
  generateRecommendation(lead) {
    const fits = this.calculateProductFit(lead);

    const primaryProductKey = this.determinePrimaryProduct(fits);
    const secondaryProductKey = this.determineSecondaryProduct(fits, primaryProductKey);

    const primaryFitData = primaryProductKey ? fits[primaryProductKey] : { score: 0, evidenceCount: 0, matchedSignals: [] };

    const confidence = primaryFitData.score;
    const reason = primaryProductKey
        ? `Matched ${primaryFitData.evidenceCount} indicators aligned with ${this.products[primaryProductKey].name}. Evidence includes: ${primaryFitData.matchedSignals.slice(0, 3).join(', ')}.`
        : 'Insufficient evidence to recommend a specific product.';

    const expectedOutcome = this.predictBusinessOutcome(primaryProductKey, primaryFitData);

    const recommendation = {
      primaryProduct: primaryProductKey ? this.products[primaryProductKey].name : null,
      secondaryProduct: secondaryProductKey ? this.products[secondaryProductKey].name : null,
      futureUpsell: null, // Hard to deterministically guess without more complex temporal logic, left null per spec optional
      aiAuditFit: fits['AI_AUDIT'] ? fits['AI_AUDIT'].score : 0,
      workflowDiagnosticFit: fits['WORKFLOW_DIAGNOSTIC'] ? fits['WORKFLOW_DIAGNOSTIC'].score : 0,
      promptStudioFit: fits['PROMPT_STUDIO'] ? fits['PROMPT_STUDIO'].score : 0,
      recommendationConfidence: confidence,
      recommendationReason: reason,
      expectedBusinessOutcome: expectedOutcome,
      evidenceCount: primaryFitData.evidenceCount,
      matchedSignals: primaryFitData.matchedSignals
    };

    recommendation.salesBrief = this.generateSalesBrief(lead, recommendation, primaryProductKey, secondaryProductKey);

    if (confidence >= this.highConfidenceThreshold) {
        recommendation.opportunityCategory = 'Hot Opportunity';
        recommendation.estimatedPriority = 'High';
    } else if (confidence >= this.minFitScoreThreshold) {
        recommendation.opportunityCategory = 'Warm Opportunity';
        recommendation.estimatedPriority = 'Medium';
    } else {
        recommendation.opportunityCategory = 'Nurture';
        recommendation.estimatedPriority = 'Low';
    }

    return recommendation;
  }

  _persistRecommendation(leadId, result) {
    const updateData = {
        primaryProduct: result.primaryProduct,
        secondaryProduct: result.secondaryProduct,
        futureUpsell: result.futureUpsell,
        aiAuditFit: result.aiAuditFit,
        workflowDiagnosticFit: result.workflowDiagnosticFit,
        promptStudioFit: result.promptStudioFit,
        recommendationConfidence: result.recommendationConfidence,
        recommendationReason: result.recommendationReason,
        expectedBusinessOutcome: result.expectedBusinessOutcome,
        salesBrief: result.salesBrief,
        opportunityCategory: result.opportunityCategory,
        estimatedPriority: result.estimatedPriority
    };
    this.db.update('Leads', leadId, updateData);
  }
}

// Global Singleton Getter
let _recommendationEngineInstance = null;
function getRecommendationEngine() {
  if (!_recommendationEngineInstance) {
    _recommendationEngineInstance = new RecommendationEngine();
  }
  return _recommendationEngineInstance;
}

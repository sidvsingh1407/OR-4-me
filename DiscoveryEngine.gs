/**
 * AI Discovery Engine
 *
 * Responsible for dynamically deciding what the crawler should search every day.
 * Generates enterprise AI search queries using the configured AI Provider.
 * Maintains state via Checkpoint Engine and is orchestrated by the Execution Engine.
 */

const DISCOVERY_STATES = {
  INITIALIZE: 'INITIALIZE',
  LOAD_HISTORY: 'LOAD_HISTORY',
  LOAD_RESULTS: 'LOAD_RESULTS',
  GENERATE_TRENDS: 'GENERATE_TRENDS',
  GENERATE_KEYWORDS: 'GENERATE_KEYWORDS',
  GENERATE_EXECUTIVES: 'GENERATE_EXECUTIVES',
  GENERATE_BOOLEAN: 'GENERATE_BOOLEAN',
  BUILD_SEARCHES: 'BUILD_SEARCHES',
  VALIDATE: 'VALIDATE',
  REMOVE_DUPLICATES: 'REMOVE_DUPLICATES',
  RANK: 'RANK',
  SAVE: 'SAVE',
  QUEUE: 'QUEUE'
};

class DiscoveryEngine {
  constructor() {
    this.logger = AppLogger.getLogger('DiscoveryEngine');
    this.db = getDatabase();
    this.ai = getAIProvider();
    this.config = getAppConfig();
    this.checkpointEngine = getCheckpointEngine();
  }

  /**
   * Main lifecycle method: Initialize
   * Sets up internal state from payload or config.
   */
  initialize(payload = {}) {
    const defaultState = {
      state: DISCOVERY_STATES.INITIALIZE,
      context: payload.context || {},
      history: [],
      results: [],
      trends: [],
      keywords: [],
      executives: [],
      booleans: [],
      searches: [],
      checkpointId: payload.checkpointId || Utils.generateId(),
      progress: 0
    };

    // If we have an existing payload state, merge it
    return { ...defaultState, ...payload };
  }

  /**
   * Main lifecycle method: Validate
   * Ensures the environment and configuration are ready for execution.
   */
  validate() {
    if (!this.ai.health()) {
      throw new ConfigurationError('DiscoveryEngine Validation Failed: AI Provider is not healthy or unreachable.');
    }
  }

  /**
   * Main lifecycle method: Execute
   * Executes the exact state requested by the payload, returning the next state.
   * @param {Object} payload - The current state object.
   * @returns {Object} Structured engine response (CONTINUE, COMPLETED, FAILED).
   */
  execute(payload) {
    let currentState = this.initialize(payload);

    try {
      this.validate();

      switch (currentState.state) {
        case DISCOVERY_STATES.INITIALIZE:
          currentState.state = DISCOVERY_STATES.LOAD_HISTORY;
          currentState.progress = 5;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.LOAD_HISTORY, payload: currentState };

        case DISCOVERY_STATES.LOAD_HISTORY:
          // Fetch previous active searches
          const historyRecords = this.db.query('DiscoveryHistory', { status: 'ACTIVE' }, 50);
          currentState.history = historyRecords.map(r => r.searchQuery);
          currentState.state = DISCOVERY_STATES.LOAD_RESULTS;
          currentState.progress = 10;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.LOAD_RESULTS, payload: currentState };

        case DISCOVERY_STATES.LOAD_RESULTS:
          // Contract for crawler results that will be populated in Phase 5.
          const crawlerContractShape = {
             id: 'string',
             source: 'string',
             sourceType: 'string',
             company: 'string',
             organization: 'string',
             title: 'string',
             description: 'string',
             url: 'string',
             author: 'string',
             publishedAt: 'string',
             country: 'string',
             language: 'string',
             industries: [],
             technologies: [],
             executives: [],
             painSignals: [],
             hiringSignals: [],
             aiSignals: [],
             metadata: {},
             rawContent: 'string'
          };
          // Example mock result matching contract
          currentState.results = [ { ...crawlerContractShape, id: Utils.generateId(), company: 'Example Inc', painSignals: ['legacy system'] } ];

          currentState.state = DISCOVERY_STATES.GENERATE_TRENDS;
          currentState.progress = 15;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.GENERATE_TRENDS, payload: currentState };

        case DISCOVERY_STATES.GENERATE_TRENDS:
          const trendMatrix = this.ai.generateSearchMatrix({
            industry: currentState.context.industry || 'Enterprise Software',
            focus: 'AI failures, migrations, and shadow AI'
          });
          currentState.trends = trendMatrix;
          currentState.state = DISCOVERY_STATES.GENERATE_KEYWORDS;
          currentState.progress = 25;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.GENERATE_KEYWORDS, payload: currentState };

        case DISCOVERY_STATES.GENERATE_KEYWORDS:
          // Flatten concepts to keywords
          currentState.keywords = currentState.trends.reduce((acc, t) => acc.concat(t.keywords || []), []);
          currentState.state = DISCOVERY_STATES.GENERATE_EXECUTIVES;
          currentState.progress = 35;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.GENERATE_EXECUTIVES, payload: currentState };

        case DISCOVERY_STATES.GENERATE_EXECUTIVES:
          currentState.executives = this.config.get('DISCOVERY.EXECUTIVE_TITLES', ['Director of AI', 'VP of Engineering', 'CIO', 'CDO']);
          currentState.state = DISCOVERY_STATES.GENERATE_BOOLEAN;
          currentState.progress = 45;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.GENERATE_BOOLEAN, payload: currentState };

        case DISCOVERY_STATES.GENERATE_BOOLEAN:
          const concepts = [...new Set([...currentState.keywords, ...currentState.executives])];
          currentState.booleans = this.ai.generateBooleanQueries(concepts.slice(0, 10), { count: 5 });
          currentState.state = DISCOVERY_STATES.BUILD_SEARCHES;
          currentState.progress = 60;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.BUILD_SEARCHES, payload: currentState };

        case DISCOVERY_STATES.BUILD_SEARCHES:
          currentState.searches = currentState.booleans.map(b => ({
            id: Utils.generateId(),
            query: b,
            category: 'Generated AI Boolean',
            confidence: 0.9,
            source: 'DiscoveryEngine'
          }));
          currentState.state = DISCOVERY_STATES.VALIDATE;
          currentState.progress = 70;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.VALIDATE, payload: currentState };

        case DISCOVERY_STATES.VALIDATE:
          // Filter out generic or bad searches
          currentState.searches = currentState.searches.filter(s => s.query && s.query.length > 10 && s.query.length < 200);

          // Blacklist check
          const blacklistRecords = this.db.query('DiscoveryBlacklist', {}, 100);
          const blacklistedTerms = blacklistRecords.map(r => r.term.toLowerCase());

          currentState.searches = currentState.searches.filter(s => {
             const lowerQuery = s.query.toLowerCase();
             return !blacklistedTerms.some(term => lowerQuery.includes(term));
          });

          currentState.state = DISCOVERY_STATES.REMOVE_DUPLICATES;
          currentState.progress = 75;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.REMOVE_DUPLICATES, payload: currentState };

        case DISCOVERY_STATES.REMOVE_DUPLICATES:
          // Simple deduplication
          const seen = new Set(currentState.history);
          currentState.searches = currentState.searches.filter(s => !seen.has(s.query));
          currentState.state = DISCOVERY_STATES.RANK;
          currentState.progress = 80;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.RANK, payload: currentState };

        case DISCOVERY_STATES.RANK:
          // Calculate dynamic priority and quality score
          currentState.searches.forEach(s => {
             s.priority = 2; // Default

             // Boost priority if it contains high value terms
             const highValueTerms = ['fail', 'risk', 'migration', 'cost', 'shadow ai', 'abandon'];
             const lowerQuery = s.query.toLowerCase();
             if (highValueTerms.some(term => lowerQuery.includes(term))) {
                s.priority = 1;
                s.confidence = Math.min(1.0, s.confidence + 0.1);
             }

             // Lower priority if query is overly complex or generic
             if (s.query.length > 100 || (!s.query.includes('AND') && !s.query.includes('OR'))) {
                s.priority = 3;
             }
          });
          currentState.state = DISCOVERY_STATES.SAVE;
          currentState.progress = 85;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.SAVE, payload: currentState };

        case DISCOVERY_STATES.SAVE:
          // Save generated searches to DiscoveryHistory
          for (const s of currentState.searches) {
             this.db.insert('DiscoveryHistory', {
                searchQuery: s.query,
                generationSource: s.source,
                category: s.category,
                confidence: s.confidence,
                status: 'ACTIVE'
             });
          }
          currentState.state = DISCOVERY_STATES.QUEUE;
          currentState.progress = 95;
          return { status: 'CONTINUE', nextState: DISCOVERY_STATES.QUEUE, payload: currentState };

        case DISCOVERY_STATES.QUEUE:
          // Generate final queue items
          const queueItems = currentState.searches.map(s => ({
            searchQuery: s.query,
            category: s.category,
            priority: s.priority,
            confidence: s.confidence,
            source: s.source,
            executionStatus: 'PENDING',
            generatedTimestamp: new Date().toISOString()
          }));

          for (const item of queueItems) {
            this.db.insert('SearchQueue', item);
          }

          // Add to main execution queue for Phase 5 (Crawlers) to process.
          // By default, map generic discoveries to generic Crawler Engine dispatch task
          const qManager = getQueueManager();
          queueItems.forEach(item => {
             // We drop it into the main queue for the CRAWL phase to pick up.
             // Usually CRAWL picks it up via payload or config state.
             qManager.enqueue('CRAWL', { searchItem: item }, item.priority);
          });

          // Phase 5 Discovery Extension:
          // Inject newly discovered domains or sources directly to CRAWLER Config if high confidence
          this._expandCrawlerConfiguration(currentState.searches);

          currentState.progress = 100;
          return { status: 'COMPLETED', payload: currentState };

        default:
          throw new Error(`Unknown state: ${currentState.state}`);
      }
    } catch (e) {
      this.logger.error('DiscoveryEngine', 'Execute', `Failed at state ${currentState.state}`, e);
      return { status: 'FAILED', retryable: true, reason: e.message, payload: currentState };
    }
  }

  /**
   * Extends the CRAWLER targets dynamically if the search engine discovered new specific domains/subreddits
   */
  _expandCrawlerConfiguration(searches) {
    const config = getAppConfig();
    const currentSubs = config.get('CRAWLER.DEFAULT_SUBREDDITS', []);

    // Naive mock extraction: if a boolean search contains a site:reddit.com/r/xyz, extract xyz
    // In reality this would be its own AI extraction phase for source URLs
    searches.forEach(s => {
       if (s.query && s.query.includes('site:reddit.com/r/')) {
          const match = s.query.match(/site:reddit\.com\/r\/([a-zA-Z0-9_]+)/);
          if (match && match[1] && !currentSubs.includes(match[1])) {
             currentSubs.push(match[1]);
          }
       }
    });

    config.set('CRAWLER.DEFAULT_SUBREDDITS', currentSubs);
    // Since config is memory, and sheets are persistence, we would normally sync config back to sheets here.
  }

  /**
   * Main lifecycle method: Checkpoint
   */
  checkpoint(payload) {
     this.checkpointEngine.saveCheckpoint({
       currentTask: payload.state,
       currentModule: 'DiscoveryEngine',
       apiState: payload
     });
  }

  /**
   * Main lifecycle method: Recover
   */
  recover() {
     // Managed dynamically by Execution Engine injecting the payload
  }

  /**
   * Main lifecycle method: Cleanup
   */
  cleanup() {
     this.logger.info('DiscoveryEngine', 'Cleanup', 'Discovery pipeline completed.');
  }
}

// Global factory
function getDiscoveryEngine() {
  if (!getDiscoveryEngine.instance) {
    getDiscoveryEngine.instance = new DiscoveryEngine();
  }
  return getDiscoveryEngine.instance;
}

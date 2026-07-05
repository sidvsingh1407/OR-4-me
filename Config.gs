/**
 * Configuration Engine.
 * Manages an in-memory key-value store for application configuration.
 */
class Config {
  constructor() {
    this._store = {};
  }

  /**
   * Sets a configuration value.
   * @param {string} key - The configuration key.
   * @param {*} value - The configuration value.
   */
  set(key, value) {
    Validation.assertString(key, 'Config Key');
    this._store[key] = value;
  }

  /**
   * Gets a configuration value.
   * @param {string} key - The configuration key.
   * @param {*} [defaultValue] - An optional default value if the key is not found.
   * @returns {*} The configuration value.
   * @throws {ConfigurationError} If the key is not found and no default value is provided.
   */
  get(key, defaultValue = undefined) {
    Validation.assertString(key, 'Config Key');

    if (this._store.hasOwnProperty(key)) {
      return this._store[key];
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new ConfigurationError(`Configuration key '${key}' is missing.`);
  }

  /**
   * Checks if a configuration key exists.
   * @param {string} key - The configuration key.
   * @returns {boolean} True if the key exists, false otherwise.
   */
  has(key) {
    Validation.assertString(key, 'Config Key');
    return this._store.hasOwnProperty(key);
  }

  /**
   * Retrieves a configuration value and enforces that it is a boolean.
   * Useful for feature flags.
   * @param {string} key - The configuration key.
   * @param {boolean} [defaultValue] - Default value if not found.
   * @returns {boolean} The boolean value.
   */
  getBoolean(key, defaultValue = undefined) {
    const value = this.get(key, defaultValue);
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    throw new ConfigurationError(`Configuration key '${key}' is not a valid boolean. Value: ${value}`);
  }

  /**
   * Retrieves a configuration value and enforces that it is a number.
   * @param {string} key - The configuration key.
   * @param {number} [defaultValue] - Default value if not found.
   * @returns {number} The numeric value.
   */
  getNumber(key, defaultValue = undefined) {
    const value = this.get(key, defaultValue);
    const parsed = Number(value);
    if (isNaN(parsed) || !isFinite(parsed)) {
       throw new ConfigurationError(`Configuration key '${key}' is not a valid number. Value: ${value}`);
    }
    return parsed;
  }

  /**
   * Retrieves all configuration as a cloned object.
   * @returns {Object} A deep copy of the current configuration.
   */
  getAll() {
    return Utils.deepClone(this._store);
  }

  /**
   * Loads multiple configuration pairs from an object.
   * @param {Object} configObject - The configuration object.
   */
  load(configObject) {
    Validation.assertObject(configObject, 'Configuration Object');
    for (const key in configObject) {
      if (Object.prototype.hasOwnProperty.call(configObject, key)) {
        this.set(key, configObject[key]);
      }
    }
  }

  /**
   * Clears all configuration values.
   */
  clear() {
    this._store = {};
  }
}

// Export a singleton instance for global use across the runtime.
function getAppConfig() {
  if (!getAppConfig.instance) {
    getAppConfig.instance = new Config();

    // Load default TarkaX phase 4 configuration
    getAppConfig.instance.load({
      // AI Defaults
      'AI.PROVIDER': 'gemini',
      'AI.MODEL': 'gemini-2.5-flash',
      'AI.API_KEY': '', // To be filled by user securely
      'AI.BASE_URL': 'https://generativelanguage.googleapis.com/v1beta',
      'AI.TEMPERATURE': 0.2,
      'AI.MAX_TOKENS': 4096,
      'AI.TIMEOUT_MS': 30000,

      // Discovery Defaults
      'DISCOVERY.CATEGORIES': [
        'Enterprise AI', 'Digital Transformation', 'Automation', 'RPA',
        'LLMs', 'RAG', 'Agentic AI', 'Prompt Engineering'
      ],
      'DISCOVERY.INDUSTRIES': [
        'Healthcare', 'Manufacturing', 'Finance', 'Insurance', 'Retail'
      ],
      'DISCOVERY.COUNTRIES': ['USA', 'UK', 'Canada', 'Australia'],
      'DISCOVERY.LANGUAGES': ['English'],
      'DISCOVERY.BOOLEAN_OPERATORS': ['AND', 'OR', 'NOT', 'site:', 'intitle:', 'inurl:'],
      'DISCOVERY.EXECUTIVE_TITLES': [
        'Director of AI', 'VP of Engineering', 'CIO', 'CDO',
        'Head of AI', 'Chief AI Officer', 'VP Data Science'
      ],
      'DISCOVERY.AI_TERMS': [
        'RAG', 'Copilot', 'Vector Database', 'Fine-tuning', 'Prompt Injection'
      ],
            'DISCOVERY.PAIN_CATEGORIES': [
        'Implementation Failure', 'Cost Overrun', 'Compliance Risk', 'Shadow AI'
      ],

      // Enrichment Defaults
      'ENRICHMENT.BATCH_SIZE': 5,
      // Crawler Defaults
      'CRAWLER.BATCH_SIZE': 50,
      'CRAWLER.MAX_PAGES': 10,
      'CRAWLER.RETRY_COUNT': 3,
      'CRAWLER.TIMEOUT_MS': 15000,
      'CRAWLER.ENABLED_PLUGINS': [
        'RSSCrawler', 'RedditCrawler', 'GitHubCrawler', 'HackerNewsCrawler',
        'GreenhouseCrawler', 'LeverCrawler', 'AshbyCrawler', 'WorkableCrawler'
      ],
      'CRAWLER.USER_AGENT': 'TarkaX/1.0 (Enterprise AI Intelligence Agent)',
      'CRAWLER.LANGUAGE_FILTER': 'en',

      // Plugin Specific Limits
      'CRAWLER.REDDIT_RATE_LIMIT_MS': 2000,
      'CRAWLER.GITHUB_RATE_LIMIT_MS': 1000,

      // Default Feeds/Targets (Discovery expands this)
      'CRAWLER.DEFAULT_RSS_FEEDS': [
        'https://techcrunch.com/category/artificial-intelligence/feed/'
      ],
      'CRAWLER.GENERIC_RSS_FEEDS': [
        'https://news.ycombinator.com/rss'
      ],
      'CRAWLER.ENGINEERING_RSS_FEEDS': [
        'https://engineering.fb.com/feed/'
      ],
      'CRAWLER.AI_RSS_FEEDS': [
        'https://openai.com/blog/rss/'
      ],
      'CRAWLER.DEFAULT_SUBREDDITS': [
        'MachineLearning', 'ArtificialInteligence', 'DataScience', 'mlops'
      ],
      'CRAWLER.GITHUB_QUERIES': [
        'AI integration failed', 'LLM timeout', 'vector database cost'
      ],
      'CRAWLER.GREENHOUSE_COMPANIES': [
        'openai', 'anthropic', 'cohere'
      ],
      'CRAWLER.LEVER_COMPANIES': [
        'scaleai'
      ],
      'CRAWLER.ASHBY_COMPANIES': [
        'pinecone'
      ],
      'CRAWLER.WORKABLE_COMPANIES': [
        'jasper'
      ],

      // Scoring Engine Defaults
      'SCORING.MAX_SCORE': 100,

      // Component Weights (must sum to 1.0)
      'SCORING.WEIGHTS.PAIN': 0.35,
      'SCORING.WEIGHTS.GROWTH': 0.15,
      'SCORING.WEIGHTS.HIRING': 0.20,
      'SCORING.WEIGHTS.TECHNOLOGY': 0.15,
      'SCORING.WEIGHTS.FUNDING': 0.10,
      'SCORING.WEIGHTS.EXECUTIVE': 0.05,

      // Priority Tiers Configuration
      'SCORING.TIERS.TIER_1.MIN_SCORE': 85,
      'SCORING.TIERS.TIER_1.LABEL': 'Tier 1',
      'SCORING.TIERS.TIER_1.ACTION': 'Immediate Outreach',

      'SCORING.TIERS.TIER_2.MIN_SCORE': 70,
      'SCORING.TIERS.TIER_2.LABEL': 'Tier 2',
      'SCORING.TIERS.TIER_2.ACTION': 'High Priority',

      'SCORING.TIERS.TIER_3.MIN_SCORE': 50,
      'SCORING.TIERS.TIER_3.LABEL': 'Tier 3',
      'SCORING.TIERS.TIER_3.ACTION': 'Warm Lead',

      'SCORING.TIERS.TIER_4.MIN_SCORE': 30,
      'SCORING.TIERS.TIER_4.LABEL': 'Tier 4',
      'SCORING.TIERS.TIER_4.ACTION': 'Monitor',

      'SCORING.TIERS.TIER_5.MIN_SCORE': 0,
      'SCORING.TIERS.TIER_5.LABEL': 'Tier 5',
      'SCORING.TIERS.TIER_5.ACTION': 'Ignore',

      // Decay factors based on freshness (age in days)
      'SCORING.DECAY.MAX_DAYS': 90,
      'SCORING.DECAY.RATE': 0.05, // 5% decay per week
      'SCORING.DECAY.FLOOR': 0.5,

      // Growth specific thresholds
      'SCORING.GROWTH.ENTERPRISE_THRESHOLD': 1000,
      'SCORING.GROWTH.ENTERPRISE_SCORE': 10,

      // Keyword dictionaries with their base scores
      'SCORING.SIGNALS.PAIN': [
        { term: 'Shadow AI', score: 20 },
        { term: 'AI governance', score: 18 },
        { term: 'prompt inconsistency', score: 15 },
        { term: 'hallucination complaints', score: 15 },
        { term: 'automation failures', score: 15 },
        { term: 'model drift', score: 12 },
        { term: 'ROI concerns', score: 20 },
        { term: 'manual processes', score: 10 }
      ],

      'SCORING.SIGNALS.GROWTH': [
        { term: 'employee growth', score: 10 },
        { term: 'hiring velocity', score: 15 },
        { term: 'department expansion', score: 10 },
        { term: 'AI team growth', score: 20 },
        { term: 'engineering expansion', score: 15 }
      ],

      'SCORING.SIGNALS.HIRING': [
        { term: 'AI Engineer', score: 15 },
        { term: 'ML Engineer', score: 15 },
        { term: 'Prompt Engineer', score: 20 },
        { term: 'AI Product Manager', score: 18 },
        { term: 'AI Governance Lead', score: 25 },
        { term: 'AI Operations', score: 20 },
        { term: 'AI Security', score: 20 },
        { term: 'LLM Engineer', score: 18 },
        { term: 'MLOps Engineer', score: 15 },
        { term: 'AI Consultant', score: 10 }
      ],

      'SCORING.SIGNALS.TECHNOLOGY': [
        { term: 'OpenAI', score: 10 },
        { term: 'Gemini', score: 10 },
        { term: 'Claude', score: 10 },
        { term: 'Microsoft Copilot', score: 15 },
        { term: 'GitHub Copilot', score: 12 },
        { term: 'LangChain', score: 15 },
        { term: 'LlamaIndex', score: 15 },
        { term: 'Vector Database', score: 18 },
        { term: 'RAG', score: 20 },
        { term: 'MCP', score: 25 },
        { term: 'AI agents', score: 20 }
      ],

      'SCORING.SIGNALS.FUNDING': [
        { term: 'recent funding', score: 15 },
        { term: 'Series A', score: 10 },
        { term: 'Series B', score: 12 },
        { term: 'Series C', score: 15 },
        { term: 'IPO preparation', score: 20 },
        { term: 'acquisitions', score: 15 }
      ],

      'SCORING.SIGNALS.EXECUTIVE': [
        { term: 'AI strategy', score: 20 },
        { term: 'transformation roadmap', score: 15 },
        { term: 'Chief AI Officer', score: 25 },
        { term: 'VP AI', score: 20 }
      ],

      // Source Confidence multipliers
      'SCORING.CONFIDENCE.LINKEDIN': 1.0,
      'SCORING.CONFIDENCE.GITHUB': 0.9,
      'SCORING.CONFIDENCE.REDDIT': 0.7,
      'SCORING.CONFIDENCE.HACKERNEWS': 0.8,
      'SCORING.CONFIDENCE.NEWS': 0.85,
      'SCORING.CONFIDENCE.COMPANY_BLOG': 0.95,
      // Source Confidence multipliers
      'SCORING.CONFIDENCE.LINKEDIN': 1.0,
      'SCORING.CONFIDENCE.GITHUB': 0.9,
      'SCORING.CONFIDENCE.REDDIT': 0.7,
      'SCORING.CONFIDENCE.HACKERNEWS': 0.8,
      'SCORING.CONFIDENCE.NEWS': 0.85,
      'SCORING.CONFIDENCE.COMPANY_BLOG': 0.95,
      'SCORING.CONFIDENCE.UNKNOWN': 0.5,

      // Automation & Schedule Defaults
      'AUTOMATION.SCHEDULE.DAILY_PIPELINE': '01:00',
      'AUTOMATION.SCHEDULE.HEALTH_CHECK_HOURS': 1,
      'AUTOMATION.SCHEDULE.QUEUE_RESUME_MINUTES': 15,
      'AUTOMATION.SCHEDULE.DASHBOARD_REFRESH_HOURS': 2,
      'AUTOMATION.SCHEDULE.DAILY_MAINTENANCE': '02:00',
      'AUTOMATION.SCHEDULE.WEEKLY_OPTIMIZATION': 3, // Sunday 3 AM, or just a generic number representing Day of Week/Hour
      'AUTOMATION.SCHEDULE.MONTHLY_MAINTENANCE': 4, // 1st of month 4 AM
      'AUTOMATION.SCHEDULE.RECOVERY_TRIGGER_MINUTES': 30,

      // Maintenance Defaults
      'MAINTENANCE.ARCHIVE_LEADS_DAYS': 90,
      'MAINTENANCE.CLEANUP_LOGS_DAYS': 30,
      'MAINTENANCE.CACHE_PURGE_HOURS': 24,

      // Automation Engine Config
      'AUTOMATION.RETRY_STORM_THRESHOLD': 50,
      'AUTOMATION.STUCK_TASK_MINUTES': 15,
      'AUTOMATION.MAX_EXECUTION_TIME_MINUTES': 5
    });
  }
  return getAppConfig.instance;
}

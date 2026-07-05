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
      ]
    });
  }
  return getAppConfig.instance;
}

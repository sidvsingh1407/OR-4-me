
/******************************************************************
ERRORS
******************************************************************/

/**
 * Base custom error class for the application.
 * Extends standard Error to provide structured details and name tracking.
 */
class BaseError extends Error {
  /**
   * @param {string} message - The error message.
   * @param {Object} [details=null] - Additional contextual details about the error.
   */
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;

    // Capture stack trace for V8 runtime
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when an input validation fails.
 */
class ValidationError extends BaseError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Thrown when system configuration is invalid or missing.
 */
class ConfigurationError extends BaseError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Thrown when an external HTTP or network request fails.
 */
class NetworkError extends BaseError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Thrown when an operation exceeds its allowed time limit.
 */
class TimeoutError extends BaseError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Thrown when a system lock cannot be acquired or released.
 */
class LockError extends BaseError {
  constructor(message, details = null) {
    super(message, details);
  }
}



/******************************************************************
VALIDATION
******************************************************************/

/**
 * Defensive programming module providing assertion utilities.
 * Throws ValidationError for any failed assertions.
 */
class Validation {
  /**
   * Asserts that a value is not null and not undefined.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertNotNull(value, name = 'Value') {
    if (value === null || value === undefined) {
      throw new ValidationError(`${name} cannot be null or undefined.`);
    }
  }

  /**
   * Asserts that a value is a non-empty string.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertString(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'string') {
      throw new ValidationError(`${name} must be a string. Received: ${typeof value}`);
    }
    if (value.trim() === '') {
      throw new ValidationError(`${name} cannot be an empty string.`);
    }
  }

  /**
   * Asserts that a value is a finite number.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertNumber(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      throw new ValidationError(`${name} must be a finite number. Received: ${value}`);
    }
  }

  /**
   * Asserts that a value is an object and not an array or null.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertObject(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new ValidationError(`${name} must be an object. Received: ${typeof value}`);
    }
  }

  /**
   * Asserts that a value is an array.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertArray(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (!Array.isArray(value)) {
      throw new ValidationError(`${name} must be an array.`);
    }
  }

  /**
   * Asserts that a value is a function.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertFunction(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'function') {
      throw new ValidationError(`${name} must be a function. Received: ${typeof value}`);
    }
  }
}



/******************************************************************
CONFIGURATION
******************************************************************/

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



/******************************************************************
LOGGER
******************************************************************/

/**
 * Logging Engine.
 * Provides leveled, structured logging with contextual metadata.
 * Designed to write to standard console, which in GAS maps to Stackdriver/Cloud Logging.
 */
class AppLogger {
  /**
   * Initializes the Logger.
   * @param {string} [context='System'] - The default context or component name.
   */
  constructor(context = 'System') {
    Validation.assertString(context, 'Logger Context');
    this.context = context;

    // Enum for log levels
    this.LEVELS = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4
    };

    // Default level; can be overridden by Config later
    this.currentLevel = this.LEVELS.INFO;
  }

  /**
   * Sets the active logging level.
   * @param {string} levelName - The string representation of the level (e.g., 'DEBUG', 'INFO').
   */
  setLevel(levelName) {
    Validation.assertString(levelName, 'Log Level Name');
    const upperLevel = levelName.toUpperCase();
    if (this.LEVELS.hasOwnProperty(upperLevel)) {
      this.currentLevel = this.LEVELS[upperLevel];
    } else {
      throw new ConfigurationError(`Invalid log level: ${levelName}`);
    }
  }

  /**
   * Creates a new AppLogger instance with a specific context.
   * Useful for class-level or module-level loggers.
   * @param {string} context - The component name.
   * @returns {Logger} A new AppLogger instance.
   */
  static getLogger(context) {
    return new AppLogger(context);
  }

  /**
   * Internal method to format and emit the log.
   * @param {number} level - The numeric log level.
   * @param {string} levelName - The string name of the log level.
   * @param {string} message - The main log message.
   * @param {Object} [meta={}] - Additional structured data.
   */
  _log(level, levelName, message, meta = {}) {
    if (level < this.currentLevel) return;

    const payload = {
      timestamp: new Date().toISOString(),
      level: levelName,
      context: this.context,
      message: message
    };

    if (meta && Object.keys(meta).length > 0) {
      // Safely stringify meta to avoid circular reference errors in Cloud Logging
      try {
        payload.meta = JSON.parse(JSON.stringify(meta));
      } catch (e) {
        payload.meta = { error: 'Could not serialize metadata' };
      }
    }

    // Emit using native console for Google Apps Script Stackdriver integration
    if (typeof console !== 'undefined') {
      if (level === this.LEVELS.ERROR && console.error) {
        console.error(JSON.stringify(payload));
      } else if (level === this.LEVELS.WARN && console.warn) {
        console.warn(JSON.stringify(payload));
      } else if (level === this.LEVELS.INFO && console.info) {
        console.info(JSON.stringify(payload));
      } else {
        console.log(JSON.stringify(payload));
      }
    }
  }

  /**
   * Logs a debug message.
   * @param {string} message - The message.
   * @param {Object} [meta={}] - Additional metadata.
   */
  debug(message, meta = {}) {
    this._log(this.LEVELS.DEBUG, 'DEBUG', message, meta);
  }

  /**
   * Logs an info message.
   * @param {string} message - The message.
   * @param {Object} [meta={}] - Additional metadata.
   */
  info(message, meta = {}) {
    this._log(this.LEVELS.INFO, 'INFO', message, meta);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The message.
   * @param {Object} [meta={}] - Additional metadata.
   */
  warn(message, meta = {}) {
    this._log(this.LEVELS.WARN, 'WARN', message, meta);
  }

  /**
   * Logs an error message.
   * @param {string|Error} error - The error message or Error object.
   * @param {Object} [meta={}] - Additional metadata.
   */
  error(error, meta = {}) {
    let message = '';
    const extendedMeta = Utils.deepClone(meta) || {};

    if (error instanceof Error) {
      message = error.message;
      extendedMeta.stack = error.stack;
      extendedMeta.name = error.name;
      if (error.details) {
        extendedMeta.details = error.details;
      }
    } else {
      message = String(error);
    }

    this._log(this.LEVELS.ERROR, 'ERROR', message, extendedMeta);
  }
}

// Export a default system logger
function getSystemLog() {
  if (!getSystemLog.instance) {
    getSystemLog.instance = AppLogger.getLogger('System');
  }
  return getSystemLog.instance;
}


/**
 * Execution Logger
 *
 * Implements a fail-safe hierarchy for system logging as mandated:
 * 1. DatabaseEngine API (SystemLogs sheet)
 * 2. console.error / console.log
 * 3. PropertiesService (Emergency Buffer)
 *
 * Never calls SpreadsheetApp directly.
 */

class ExecutionLogger {
  constructor() {
    this.isLogging = false; // Recursion guard
  }

  /**
   * Internal logging method executing the fail-safe hierarchy.
   */
  _log(level, module, operation, message, error = null, details = null) {
    if (this.isLogging) {
      try {
        console.error(`ExecutionLogger Recursion Guard Triggered [${level}]: ${message}`);
      } catch (e) { /* ignore */ }
      return;
    }

    this.isLogging = true;
    try {
      this._writeToDatabase(level, module, operation, message, error, details);
    } catch (dbError) {
      try {
        // Fallback 1: Console
        const logPayload = {
          level,
          module,
          operation,
          message,
          error: error ? (error.stack || String(error)) : null,
          details
        };
        if (level === 'ERROR' || level === 'WARN') {
          console.error(`ExecutionLogger DB Failure: ${dbError.message}. Original Log:`, JSON.stringify(logPayload));
        } else {
          console.log(`ExecutionLogger DB Failure: ${dbError.message}. Original Log:`, JSON.stringify(logPayload));
        }

        // Fallback 2: PropertiesService Emergency Buffer
        this._writeToProperties(level, module, message, error);
      } catch (fallbackError) {
        // Ultimate silent failure
      }
    } finally {
      this.isLogging = false;
    }
  }

  _writeToDatabase(level, module, operation, message, error, details) {
    const db = getDatabase();

    // We expect the SystemLogs table schema as defined in DatabaseEngine
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      module: module,
      operation: operation || 'N/A',
      message: message,
      stack: error && error.stack ? error.stack : (error ? String(error) : ''),
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : ''
    };

    // Use retry manager from existing codebase if available, or just insert
    if (typeof RetryEngine !== 'undefined') {
      RetryEngine.execute(() => {
        db.insert('SystemLogs', logEntry);
      }, { operationName: 'ExecutionLogger Database Insert', maxRetries: 2 });
    } else {
      db.insert('SystemLogs', logEntry);
    }
  }

  _writeToProperties(level, module, message, error) {
    try {
      const props = getScriptProps();
      const logsStr = props.get('EMERGENCY_EXECUTION_LOGS', '[]');
      let logs = [];
      try {
        logs = JSON.parse(logsStr);
      } catch(e) { logs = []; }

      logs.push({
        t: new Date().toISOString(),
        l: level,
        mod: module,
        m: message,
        e: error ? String(error) : ''
      });

      // Keep only the last 20 to respect the 9kb limit of PropertiesService
      if (logs.length > 20) logs = logs.slice(logs.length - 20);
      props.set('EMERGENCY_EXECUTION_LOGS', JSON.stringify(logs));
    } catch (e) {
      // Nothing more we can do
    }
  }

  debug(module, operation, message, details = null) {
    this._log('DEBUG', module, operation, message, null, details);
  }

  info(module, operation, message, details = null) {
    this._log('INFO', module, operation, message, null, details);
  }

  warn(module, operation, message, error = null, details = null) {
    this._log('WARN', module, operation, message, error, details);
  }

  error(module, operation, message, error = null, details = null) {
    this._log('ERROR', module, operation, message, error, details);
  }
}

// Singleton getter
function getExecutionLogger() {
  if (!getExecutionLogger.instance) {
    getExecutionLogger.instance = new ExecutionLogger();
  }
  return getExecutionLogger.instance;
}



/******************************************************************
UTILITIES
******************************************************************/

/**
 * General purpose utilities for the application.
 */
class Utils {
  /**
   * Generates a pseudo-random UUID-like string.
   * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * @returns {string} The generated ID.
   */
  static generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Suspends execution for the specified number of milliseconds.
   * @param {number} ms - The number of milliseconds to sleep.
   */
  static sleep(ms) {
    Validation.assertNumber(ms, 'Sleep duration (ms)');
    if (ms < 0) {
      throw new ValidationError('Sleep duration cannot be negative.');
    }
    // Utilities.sleep is a built-in Google Apps Script service.
    // We wrap it to provide validation and a standard namespace.
    if (typeof Utilities !== 'undefined' && Utilities.sleep) {
      Utilities.sleep(ms);
    } else {
       // Fallback for environments outside GAS if needed, though this is primarily for GAS.
       const start = new Date().getTime();
       while (new Date().getTime() < start + ms) {
         // Busy wait
       }
    }
  }

  /**
   * Splits an array into smaller arrays of a specified chunk size.
   * @param {Array} array - The array to chunk.
   * @param {number} size - The maximum size of each chunk.
   * @returns {Array<Array>} An array of chunks.
   */
  static chunkArray(array, size) {
    Validation.assertArray(array, 'Array to chunk');
    Validation.assertNumber(size, 'Chunk size');
    if (size <= 0) {
      throw new ValidationError('Chunk size must be greater than zero.');
    }

    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  /**
   * Creates a deep copy of an object or array.
   * Note: This method uses JSON serialization and will not preserve functions, Dates, or specific object instances.
   * @param {*} obj - The object to clone.
   * @returns {*} A deep copy of the object.
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      throw new BaseError('Failed to deep clone object.', { originalError: e.message });
    }
  }
}


/**
 * Cache Manager.
 * Abstracts Google Apps Script CacheService with automatic JSON serialization.
 */
class CacheManager {
  /**
   * Initializes the cache manager for a specific cache scope.
   * @param {string} [scope='SCRIPT'] - The cache scope: 'SCRIPT', 'USER', or 'DOCUMENT'.
   */
  constructor(scope = 'SCRIPT') {
    Validation.assertString(scope, 'Cache Scope');
    this.scope = scope.toUpperCase();
    this.logger = AppLogger.getLogger(`CacheManager[${this.scope}]`);
    this._cache = this._getService();
  }

  /**
   * Internal method to get the native GAS CacheService instance.
   * @returns {GoogleAppsScript.Cache.Cache} The cache service instance.
   */
  _getService() {
    if (typeof CacheService === 'undefined') {
      this.logger.warn('CacheService is undefined. Using in-memory mock cache.');
      return {
        _store: {},
        get: function(k) { return this._store[k] || null; },
        put: function(k, v, exp) { this._store[k] = v; },
        remove: function(k) { delete this._store[k]; }
      };
    }

    switch (this.scope) {
      case 'SCRIPT':
        return CacheService.getScriptCache();
      case 'USER':
        return CacheService.getUserCache();
      case 'DOCUMENT':
        return CacheService.getDocumentCache();
      default:
        throw new ConfigurationError(`Unsupported cache scope: ${this.scope}`);
    }
  }

  /**
   * Retrieves and deserializes a value from the cache.
   * @param {string} key - The cache key.
   * @returns {*} The cached value, or null if not found/expired.
   */
  get(key) {
    Validation.assertString(key, 'Cache Key');
    try {
      const cachedStr = this._cache.get(key);
      if (!cachedStr) {
        return null;
      }
      return JSON.parse(cachedStr);
    } catch (e) {
      this.logger.warn(`Failed to retrieve or parse cache key '${key}': ${e.message}`);
      return null;
    }
  }

  /**
   * Serializes and stores a value in the cache.
   * @param {string} key - The cache key.
   * @param {*} value - The value to cache.
   * @param {number} [expirationInSeconds=600] - Cache expiration time in seconds (max 21600).
   */
  put(key, value, expirationInSeconds = 600) {
    Validation.assertString(key, 'Cache Key');
    Validation.assertNotNull(value, 'Cache Value');
    Validation.assertNumber(expirationInSeconds, 'Expiration Time');

    if (expirationInSeconds < 1 || expirationInSeconds > 21600) {
      this.logger.warn(`Invalid expiration time ${expirationInSeconds}s. Clamping to valid range.`);
      expirationInSeconds = Math.max(1, Math.min(expirationInSeconds, 21600));
    }

    try {
      const stringified = JSON.stringify(value);
      // GAS Cache limit is 100KB per item. Checking approx size.
      if (stringified.length > 100000) {
         this.logger.warn(`Value for key '${key}' exceeds 100KB cache limit. Skipping cache put.`);
         return;
      }
      this._cache.put(key, stringified, expirationInSeconds);
    } catch (e) {
      this.logger.error(`Failed to put value into cache for key '${key}'`, { error: e.message });
    }
  }

  /**
   * Removes a value from the cache.
   * @param {string} key - The cache key.
   */
  remove(key) {
    Validation.assertString(key, 'Cache Key');
    try {
      this._cache.remove(key);
    } catch (e) {
      this.logger.warn(`Failed to remove cache key '${key}': ${e.message}`);
    }
  }
}

// Export pre-configured managers for common scopes
function getScriptCache() {
  if (!getScriptCache.instance) {
    getScriptCache.instance = new CacheManager('SCRIPT');
  }
  return getScriptCache.instance;
}


/**
 * Properties Manager.
 * Abstracts Google Apps Script PropertiesService for secure credential and script property management.
 */
class PropertiesManager {
  /**
   * Initializes the manager for a specific property store.
   * @param {string} [storeType='SCRIPT'] - The property store type: 'SCRIPT', 'USER', or 'DOCUMENT'.
   */
  constructor(storeType = 'SCRIPT') {
    Validation.assertString(storeType, 'Store Type');
    this.storeType = storeType.toUpperCase();
    this.logger = AppLogger.getLogger(`PropertiesManager[${this.storeType}]`);
    this._properties = this._getService();
  }

  /**
   * Internal method to get the native GAS PropertiesService instance.
   * @returns {GoogleAppsScript.Properties.Properties} The properties service instance.
   */
  _getService() {
    if (typeof PropertiesService === 'undefined') {
      // Mock for non-GAS environments
      this.logger.warn('PropertiesService is undefined. Using in-memory mock.');
      return {
        _mock: {},
        getProperty: function(k) { return this._mock[k] || null; },
        setProperty: function(k, v) { this._mock[k] = v; return this; },
        deleteProperty: function(k) { delete this._mock[k]; return this; },
        getProperties: function() { return Utils.deepClone(this._mock); },
        setProperties: function(obj, del) {
          if (del) this._mock = {};
          Object.assign(this._mock, obj);
          return this;
        }
      };
    }

    switch (this.storeType) {
      case 'SCRIPT':
        return PropertiesService.getScriptProperties();
      case 'USER':
        return PropertiesService.getUserProperties();
      case 'DOCUMENT':
        return PropertiesService.getDocumentProperties();
      default:
        throw new ConfigurationError(`Unsupported store type: ${this.storeType}`);
    }
  }

  /**
   * Gets a property value by key.
   * @param {string} key - The property key.
   * @param {string} [defaultValue=null] - Default value if not found.
   * @returns {string|null} The property value.
   */
  get(key, defaultValue = null) {
    Validation.assertString(key, 'Property Key');
    try {
      const value = this._properties.getProperty(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      throw new BaseError(`Failed to read property: ${key}`, { originalError: e.message });
    }
  }

  /**
   * Sets a property value.
   * @param {string} key - The property key.
   * @param {string} value - The property value.
   */
  set(key, value) {
    Validation.assertString(key, 'Property Key');
    Validation.assertString(value, 'Property Value');
    try {
      this._properties.setProperty(key, value);
    } catch (e) {
      throw new BaseError(`Failed to set property: ${key}`, { originalError: e.message });
    }
  }

  /**
   * Deletes a property by key.
   * @param {string} key - The property key.
   */
  delete(key) {
    Validation.assertString(key, 'Property Key');
    try {
      this._properties.deleteProperty(key);
    } catch (e) {
      throw new BaseError(`Failed to delete property: ${key}`, { originalError: e.message });
    }
  }

  /**
   * Gets all properties as an object.
   * @returns {Object} All properties.
   */
  getAll() {
    try {
      return this._properties.getProperties();
    } catch (e) {
      throw new BaseError('Failed to get all properties', { originalError: e.message });
    }
  }
}

// Export pre-configured managers for common stores
function getScriptProps() {
  if (!getScriptProps.instance) {
    getScriptProps.instance = new PropertiesManager('SCRIPT');
  }
  return getScriptProps.instance;
}
function getUserProps() {
  if (!getUserProps.instance) {
    getUserProps.instance = new PropertiesManager('USER');
  }
  return getUserProps.instance;
}


/**
 * Runtime Context Manager.
 * Tracks execution time to safely manage Google Apps Script quota limits (6 minutes max).
 * Provides utilities to determine if the script needs to save state and exit gracefully.
 */
class RuntimeManager {
  /**
   * Initializes the Runtime Context.
   * @param {Object} [options={}] - Options for the runtime.
   * @param {number} [options.maxExecutionTimeMs=330000] - Default max execution time before checkpointing (5.5 minutes to leave buffer).
   */
  constructor(options = {}) {
    this.startTime = new Date().getTime();
    this.maxExecutionTimeMs = options.maxExecutionTimeMs || 330000;
    this.logger = AppLogger.getLogger('RuntimeManager');

    Validation.assertNumber(this.maxExecutionTimeMs, 'Max Execution Time');
  }

  /**
   * Gets the exact timestamp when this runtime instance was created.
   * @returns {number} Start timestamp in milliseconds.
   */
  getStartTime() {
    return this.startTime;
  }

  /**
   * Calculates the total elapsed time since the runtime started.
   * @returns {number} Elapsed time in milliseconds.
   */
  getElapsedTime() {
    return new Date().getTime() - this.startTime;
  }

  /**
   * Calculates the remaining time before hitting the configured execution limit.
   * @returns {number} Remaining time in milliseconds (can be negative if exceeded).
   */
  getRemainingTime() {
    return this.maxExecutionTimeMs - this.getElapsedTime();
  }

  /**
   * Determines if the current execution is nearing the timeout threshold and needs to checkpoint.
   * @param {number} [bufferMs=10000] - Additional buffer required for the next operation to complete safely.
   * @returns {boolean} True if the system should checkpoint and halt; false if it is safe to continue.
   */
  shouldCheckpoint(bufferMs = 10000) {
    Validation.assertNumber(bufferMs, 'Buffer MS');
    const remaining = this.getRemainingTime();

    if (remaining < bufferMs) {
      this.logger.info(`Approaching execution limit. Remaining time (${remaining}ms) is less than required buffer (${bufferMs}ms). Checkpoint advised.`);
      return true;
    }

    return false;
  }

  /**
   * Asserts that sufficient execution time remains, otherwise throws a TimeoutError.
   * Useful to place at the start of heavy operations.
   * @param {number} [requiredMs=5000] - The minimum milliseconds required to proceed.
   * @throws {TimeoutError} If sufficient time does not remain.
   */
  assertExecutionTime(requiredMs = 5000) {
    Validation.assertNumber(requiredMs, 'Required MS');
    const remaining = this.getRemainingTime();

    if (remaining < requiredMs) {
      this.logger.warn(`Execution time exhausted. Required: ${requiredMs}ms, Remaining: ${remaining}ms.`);
      throw new TimeoutError(`Insufficient execution time remaining. System must halt.`, {
        elapsed: this.getElapsedTime(),
        remaining: remaining,
        required: requiredMs
      });
    }
  }

  /**
   * Resets the start timer. Useful only if resetting state entirely within a long test or mocked run.
   */
  reset() {
    this.startTime = new Date().getTime();
    this.logger.debug('Runtime start timer reset.');
  }
}

// Export a singleton instance representing the current trigger execution.
function getRuntime() {
  if (!getRuntime.instance) {
    getRuntime.instance = new RuntimeManager();
  }
  return getRuntime.instance;
}


/**
 * Timeout Manager
 *
 * Prevents Apps Script from terminating unexpectedly by detecting remaining time,
 * saving a checkpoint, and automatically scheduling a continuation trigger.
 */

class TimeoutManager {
  /**
   * @param {Object} context The current execution context to save if a timeout occurs.
   */
  constructor(context = {}) {
    this.runtime = getRuntime(); // from Runtime.gs
    this.checkpointEngine = getCheckpointEngine();
    this.stateManager = getExecutionStateManager();
    this.context = context; // Stores currentTask, currentModule, apiState, etc.
  }

  /**
   * Updates the dynamic context that will be checkpointed.
   */
  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Checks if the execution is near the timeout limit.
   * If so, gracefully halts, checkpoints, creates a trigger, and throws an exception to stop the current run.
   * @param {number} [bufferMs=15000] - Safe buffer time (default 15s).
   */
  checkAndHaltIfNeeded(bufferMs = 15000) {
    if (this.runtime.shouldCheckpoint(bufferMs)) {
      getExecutionLogger().warn('TimeoutManager', 'checkAndHalt', `Approaching timeout limit. Checkpointing and halting. Buffer: ${bufferMs}ms`);

      // Save state
      this.stateManager.transition(ENGINE_STATES.CHECKPOINT);
      this.checkpointEngine.saveCheckpoint(this.context);

      // Create continuation trigger
      this._createContinuationTrigger();

      // Transition to EXIT
      this.stateManager.transition(ENGINE_STATES.EXIT);
      getExecutionLogger().info('TimeoutManager', 'checkAndHalt', `System safely halted and continuation scheduled.`);

      throw new TimeoutError('Execution safely halted for continuation trigger.');
    }
  }

  /**
   * Uses ScriptApp to schedule a new one-time trigger 1 minute from now to resume execution.
   */
  _createContinuationTrigger() {
    // Ensure we don't create duplicate triggers
    this._deleteContinuationTriggers();

    try {
      ScriptApp.newTrigger('TarkaX_System_Resume')
        .timeBased()
        .after(60 * 1000) // 1 minute delay
        .create();
      getExecutionLogger().info('TimeoutManager', 'createTrigger', 'Scheduled continuation trigger for 1 minute from now.');
    } catch (e) {
      getExecutionLogger().error('TimeoutManager', 'createTrigger', 'Failed to schedule continuation trigger.', e);
      // Even if trigger fails, the state is CHECKPOINT, meaning a manual run or the daily run will recover it.
    }
  }

  /**
   * Deletes all existing continuation triggers.
   */
  _deleteContinuationTriggers() {
    try {
      const triggers = ScriptApp.getProjectTriggers();
      let count = 0;
      for (const trigger of triggers) {
        if (trigger.getHandlerFunction() === 'TarkaX_System_Resume') {
          ScriptApp.deleteTrigger(trigger);
          count++;
        }
      }
      if (count > 0) {
        getExecutionLogger().debug('TimeoutManager', 'deleteTriggers', `Deleted ${count} old continuation triggers.`);
      }
    } catch (e) {
      getExecutionLogger().error('TimeoutManager', 'deleteTriggers', 'Failed to cleanup old continuation triggers.', e);
    }
  }
}

// Global entry point for the continuation trigger

// Singleton getter
function getTimeoutManager() {
  if (!getTimeoutManager.instance) {
    getTimeoutManager.instance = new TimeoutManager();
  }
  return getTimeoutManager.instance;
}


/**
 * Distributed Lock Manager (Phase 3 Canonical Implementation)
 * Orchestrates concurrency control using Google Apps Script LockService.
 * Prevents duplicate runs, double writes, race conditions, and simultaneous queue execution.
 */
class DistributedLockManager {
  /**
   * Internal method to acquire the proper native Lock object.
   * @param {string} type - Lock type 'SCRIPT', 'USER', 'DOCUMENT'
   * @returns {GoogleAppsScript.Lock.Lock}
   */
  static _getLockService(type = 'SCRIPT') {
    if (typeof LockService === 'undefined') {
      return {
        _acquired: false,
        tryLock: function(ms) {
          if (this._acquired) return false;
          this._acquired = true;
          return true;
        },
        releaseLock: function() { this._acquired = false; },
        hasLock: function() { return this._acquired; }
      };
    }
    switch (type.toUpperCase()) {
      case 'SCRIPT': return LockService.getScriptLock();
      case 'USER': return LockService.getUserLock();
      case 'DOCUMENT': return LockService.getDocumentLock();
      default: return LockService.getScriptLock();
    }
  }

  /**
   * Attempts to acquire the lock within the specified timeout.
   * @param {number} [timeoutInMillis=30000] - Maximum time to wait.
   * @param {string} [lockType='SCRIPT']
   * @returns {GoogleAppsScript.Lock.Lock|null} The lock object if acquired, null otherwise.
   */
  static acquire(timeoutInMillis = 30000, lockType = 'SCRIPT') {
    Validation.assertNumber(timeoutInMillis, 'Lock Timeout');
    const lock = this._getLockService(lockType);

    try {
      const success = lock.tryLock(timeoutInMillis);
      if (success) {
        return lock;
      } else {
        return null;
      }
    } catch (e) {
      try {
        getSystemLog().error('DistributedLockManager', { error: e.message });
      } catch (logErr) {}
      return null;
    }
  }

  /**
   * Releases a previously acquired lock.
   * @param {GoogleAppsScript.Lock.Lock} lock - The lock object to release.
   */
  static release(lock) {
    if (!lock) return;
    try {
      lock.releaseLock();
    } catch (e) {
      // Ignore release errors safely
    }
  }

  /**
   * Executes a callback function within a lock context.
   * Guarantees that the lock is released even if the callback throws an error.
   * @param {Function} callback - The function to execute.
   * @param {number} [timeoutInMillis=30000] - Timeout to acquire the lock.
   * @param {string} [lockType='SCRIPT']
   * @returns {*} The result of the callback.
   * @throws {LockError} If the lock cannot be acquired.
   */
  static executeWithLock(callback, timeoutInMillis = 30000, lockType = 'SCRIPT') {
    Validation.assertFunction(callback, 'Callback');

    const lock = this.acquire(timeoutInMillis, lockType);
    if (!lock) {
      throw new LockError(`Failed to acquire ${lockType} lock for critical section within ${timeoutInMillis}ms.`);
    }

    try {
      return callback();
    } finally {
      this.release(lock);
    }
  }
}


/**
 * Health Check Engine.
 * Orchestrates diagnostics across infrastructure components to verify the runtime environment is capable and healthy.
 */
class Health {
  /**
   * Initializes the Health checker.
   */
  constructor() {
    this.logger = AppLogger.getLogger('Health');
  }

  /**
   * Verifies that the Cache service is functioning.
   * @returns {Object} Result of the check { healthy: boolean, message: string }
   */
  checkCache() {
    try {
      const testKey = `_health_test_${new Date().getTime()}`;
      getScriptCache().put(testKey, { ok: true }, 60);
      const val = getScriptCache().get(testKey);
      getScriptCache().remove(testKey);

      if (val && val.ok === true) {
        return { healthy: true, message: 'Cache service is operational.' };
      }
      return { healthy: false, message: 'Cache service failed to return written value.' };
    } catch (e) {
      return { healthy: false, message: `Cache service error: ${e.message}` };
    }
  }

  /**
   * Verifies that the Properties service is functioning.
   * @returns {Object} Result of the check { healthy: boolean, message: string }
   */
  checkProperties() {
    try {
      const testKey = `_health_test_${new Date().getTime()}`;
      getScriptProps().set(testKey, 'ok');
      const val = getScriptProps().get(testKey);
      getScriptProps().delete(testKey);

      if (val === 'ok') {
        return { healthy: true, message: 'Properties service is operational.' };
      }
      return { healthy: false, message: 'Properties service failed to return written value.' };
    } catch (e) {
      return { healthy: false, message: `Properties service error: ${e.message}` };
    }
  }

  /**
   * Verifies that the Lock service is functioning.
   * @returns {Object} Result of the check { healthy: boolean, message: string }
   */
  checkLock() {
    try {
      const lock = DistributedLockManager.acquire(1000, 'SCRIPT');
      if (lock) {
        DistributedLockManager.release(lock);
        return { healthy: true, message: 'Lock service is operational.' };
      }
      return { healthy: false, message: 'Failed to acquire test lock.' };
    } catch (e) {
      return { healthy: false, message: `Lock service error: ${e.message}` };
    }
  }

  /**
   * Executes a full system health check across all infrastructure components.
   * @returns {Object} An aggregated health report.
   */
  runDiagnostics() {
    this.logger.info('Starting system health diagnostics.');

    const report = {
      timestamp: new Date().toISOString(),
      overallHealthy: true,
      checks: {
        cache: this.checkCache(),
        properties: this.checkProperties(),
        lock: this.checkLock()
      }
    };

    // Determine overall health based on individual component checks
    for (const key in report.checks) {
      if (!report.checks[key].healthy) {
        report.overallHealthy = false;
        this.logger.warn(`Health check failed for component: ${key}`, report.checks[key]);
      }
    }

    if (report.overallHealthy) {
      this.logger.info('All infrastructure components are healthy.');
    } else {
      this.logger.error('System health check detected degraded components.', { report });
    }

    return report;
  }

  /**
   * Asserts that the system is fully healthy. Throws if any check fails.
   * Useful for initialization routines that mandate a flawless environment.
   * @throws {BaseError} If the system is not healthy.
   */
  assertHealthy() {
    const report = this.runDiagnostics();
    if (!report.overallHealthy) {
      throw new BaseError('System is not healthy. Cannot proceed safely.', { report });
    }
  }
}

// Export a singleton instance.
function getSystemHealth() {
  if (!getSystemHealth.instance) {
    getSystemHealth.instance = new Health();
  }
  return getSystemHealth.instance;
}


/**
 * System Health Monitor
 *
 * Scans the entire execution engine and database to detect anomalies such as:
 * - Stuck queues (tasks in RUNNING state for too long)
 * - Dead checkpoints (checkpoints older than 24 hours)
 * - Long-running tasks
 * - Retry storms (excessive tasks in RETRY state)
 * - Lock contention (excessive wait times for LockService)
 * - Trigger integrity
 * - Script Properties integrity
 * - Sheet integrity
 * - Runtime statistics
 */

class HealthMonitor {
  constructor() {
    this.logger = getExecutionLogger();
  }

  /**
   * Generates a comprehensive health report for the system.
   * @returns {Object} Health report
   */
  generateReport() {
    this.logger.info('HealthMonitor', 'generateReport', 'Starting health diagnostic check.');

    const report = {
      timestamp: new Date().toISOString(),
      score: 100,
      issues: [],
      metrics: {}
    };

    try {
      this._checkQueueHealth(report);
      this._checkCheckpointHealth(report);
      this._checkRetryStorms(report);
      this._checkLockHealth(report);
      this._checkTriggerHealth(report);
      this._checkCacheAndProperties(report);
      this._checkSheetIntegrity(report);

      // Save report to both historical and status sheets
      this._saveMetrics(report);

      if (report.issues.length > 0) {
        this.logger.warn('HealthMonitor', 'generateReport', `Health check completed with ${report.issues.length} issues. Score: ${report.score}`, report);
      } else {
        this.logger.info('HealthMonitor', 'generateReport', `Health check completed perfectly. Score: ${report.score}`, report);
      }
    } catch (e) {
      this.logger.error('HealthMonitor', 'generateReport', 'Failed to complete health diagnostic check.', e);
      report.score = 0;
      report.issues.push(`Diagnostic Failure: ${e.message}`);
    }

    return report;
  }

  /**
   * Evaluates the Queue for stuck or long-running tasks.
   */
  _checkQueueHealth(report) {
    const db = getDatabase();

    // Find all tasks currently marked as RUNNING
    const runningTasks = db.findMany('Queue', { status: 'RUNNING' });
    const pendingTasks = db.findMany('Queue', { status: 'PENDING' });

    report.metrics.runningTasks = runningTasks.length;
    report.metrics.pendingTasks = pendingTasks.length;
    report.metrics.queueSize = runningTasks.length + pendingTasks.length;

    if (runningTasks.length > 0) {
      const now = new Date().getTime();
      let stuckCount = 0;

      runningTasks.forEach(task => {
        const updatedAt = new Date(task._updatedAt).getTime();
        const durationMin = (now - updatedAt) / (1000 * 60);

        // If a task has been RUNNING for more than 15 minutes, it's likely stuck
        if (durationMin > 15) {
          stuckCount++;
          report.issues.push(`Stuck Task detected: ${task._id} (RUNNING for ${durationMin.toFixed(1)} mins)`);
        }
      });

      if (stuckCount > 0) {
        report.score -= Math.min(stuckCount * 5, 30); // Max 30 point penalty for stuck tasks
        report.metrics.stuckTasks = stuckCount;
      }
    }
  }

  /**
   * Evaluates if there is an abandoned checkpoint blocking future runs.
   */
  _checkCheckpointHealth(report) {
    const checkpointEngine = getCheckpointEngine();
    const cp = checkpointEngine.loadCheckpoint();

    if (cp) {
      const cpTime = new Date(cp.timestamp).getTime();
      const now = new Date().getTime();
      const hoursOld = (now - cpTime) / (1000 * 60 * 60);

      // If a checkpoint is older than 2 hours, something failed to resume
      if (hoursOld > 2) {
        report.issues.push(`Dead Checkpoint detected. Checkpoint is ${hoursOld.toFixed(1)} hours old without resumption.`);
        report.score -= 20;
      }
      report.metrics.checkpointAgeHours = hoursOld;
    }
  }

  /**
   * Detects if the system is caught in a retry storm.
   */
  _checkRetryStorms(report) {
    const db = getDatabase();
    const retryTasks = db.findMany('Queue', { status: 'RETRY' });
    const failedTasks = db.findMany('Queue', { status: 'FAILED' }); // Count recently failed too
    const successTasks = db.findMany('Queue', { status: 'COMPLETED' });

    report.metrics.tasksInRetry = retryTasks.length;
    report.metrics.tasksFailed = failedTasks.length;
    report.metrics.tasksCompleted = successTasks.length;

    if (retryTasks.length > 50) {
      report.issues.push(`Retry Storm Warning: ${retryTasks.length} tasks currently queued for RETRY.`);
      report.score -= 15;
    }
  }

  /**
   * Evaluates Lock contention.
   */
  _checkLockHealth(report) {
    const start = new Date().getTime();

    // Attempt a quick test lock (wait max 2 seconds)
    const lock = DistributedLockManager.acquire(2000, 'SCRIPT');
    const duration = new Date().getTime() - start;

    if (!lock) {
      report.issues.push(`Lock Contention: Failed to acquire test script lock within 2000ms.`);
      report.score -= 25;
    } else {
      DistributedLockManager.release(lock);
      if (duration > 1000) {
        report.issues.push(`High Lock Contention: Took ${duration}ms to acquire lock.`);
        report.score -= 5;
      }
    }
    report.metrics.lockTestDurationMs = duration;
  }

  /**
   * Validates trigger integrity.
   */
  _checkTriggerHealth(report) {
    const triggers = ScriptApp.getProjectTriggers();
    report.metrics.triggerCount = triggers.length;

    if (triggers.length === 0) {
       report.issues.push('No triggers found. Automation is completely offline.');
       report.score -= 50;
    }
  }

  /**
   * Validates cache and properties usage.
   */
  _checkCacheAndProperties(report) {
    const props = PropertiesService.getScriptProperties();
    const keys = props.getKeys();

    report.metrics.propertiesCount = keys.length;

    // Very basic check, if keys are approaching 500 (soft limit estimation)
    if (keys.length > 500) {
       report.issues.push(`High Properties Usage: ${keys.length} keys in use.`);
       report.score -= 10;
    }

    // Cache test
    const cache = CacheService.getScriptCache();
    cache.put('HealthTest', 'OK', 60);
    const result = cache.get('HealthTest');
    if (result !== 'OK') {
       report.issues.push('CacheService is unavailable or malfunctioning.');
       report.score -= 15;
    }
  }

  /**
   * Validates core database sheets.
   */
  _checkSheetIntegrity(report) {
    const db = getDatabase();
    const expectedSheets = ['Queue', 'Checkpoints', 'SystemLogs'];

    for (const sheet of expectedSheets) {
       if (!db._getSheet(sheet)) {
          report.issues.push(`Missing core system sheet: ${sheet}`);
          report.score -= 30;
       }
    }
  }

  /**
   * Saves metrics to the AutomationMetrics tables.
   */
  _saveMetrics(report) {
    const db = getDatabase();
    const stateManager = getExecutionStateManager();
    const currentState = stateManager.getState();

    // Ensure metrics are never negative
    const finalScore = Math.max(0, report.score);

    const statusRecord = {
      id: 'CURRENT',
      healthScore: finalScore,
      queueSize: report.metrics.queueSize || 0,
      currentStage: currentState.currentStage || 'IDLE',
      runningWorker: currentState.currentWorker || 'NONE',
      activeTriggerCount: report.metrics.triggerCount || 0,
      lastSuccessfulExecution: currentState.state === 'SUCCESS' ? new Date().toISOString() : null,
      lastFailedExecution: currentState.state === 'FAILED' ? new Date().toISOString() : null,
      pendingTasks: report.metrics.pendingTasks || 0,
      failedTasks: report.metrics.tasksFailed || 0,
      retryCount: currentState.retryCount || 0,
      apiErrorCount: 0, // Would be pulled from ApiLogs if they exist
      lockContention: report.metrics.lockTestDurationMs || 0,
      runtimeMs: 0, // Can calculate based on execution start time
      remainingQuotaEstimate: 0,
      updatedAt: report.timestamp
    };

    // 1. Update Status Sheet (UPSERT)
    const existingStatus = db.findById('AutomationMetrics_Status', 'CURRENT');
    if (existingStatus) {
       db.update('AutomationMetrics_Status', 'CURRENT', statusRecord);
    } else {
       db.insert('AutomationMetrics_Status', statusRecord);
    }

    // 2. Insert into History
    db.insert('AutomationMetrics_History', {
       id: Utilities.getUuid(),
       timestamp: report.timestamp,
       healthScore: finalScore,
       queueSize: report.metrics.queueSize || 0,
       runtimeMs: 0,
       tasksCompleted: report.metrics.tasksCompleted || 0,
       tasksFailed: report.metrics.tasksFailed || 0,
       apiCalls: 0,
       retryCount: currentState.retryCount || 0,
       memoryEstimate: 0,
       triggerCount: report.metrics.triggerCount || 0,
       stageCompleted: currentState.currentStage || 'NONE'
    });
  }
}

// Global hook for scheduled monitoring

// Singleton getter
function getHealthMonitor() {
  if (!getHealthMonitor.instance) {
    getHealthMonitor.instance = new HealthMonitor();
  }
  return getHealthMonitor.instance;
}



/******************************************************************
HTTP CLIENT
******************************************************************/

/**
 * HTTP Client Engine.
 * Wraps Google Apps Script UrlFetchApp to provide built-in retries, validation, and standard error handling.
 */
class HttpClient {
  /**
   * Initializes the HttpClient.
   * @param {Object} [config={}] - Optional configuration for the client.
   */
  constructor(config = {}) {
    this.logger = AppLogger.getLogger('HttpClient');
  }

  /**
   * Internal wrapper for UrlFetchApp.
   * @param {string} url - The URL to fetch.
   * @param {Object} params - The UrlFetchApp parameters.
   * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse} The response.
   * @throws {NetworkError}
   */
  _fetchNative(url, params) {
    if (typeof UrlFetchApp === 'undefined') {
       throw new NetworkError('UrlFetchApp is undefined in this environment.');
    }

    try {
      return UrlFetchApp.fetch(url, params);
    } catch (e) {
      throw new NetworkError(`Failed to fetch URL: ${url}`, { originalError: e.message });
    }
  }

  /**
   * Executes an HTTP request with built-in retries.
   * @param {string} url - The URL to request.
   * @param {Object} [options={}] - Request options (headers, method, payload, etc.).
   * @returns {Object} The parsed response object containing status, headers, and text/json.
   * @throws {NetworkError} If the request fails after all retries.
   */
  request(url, options = {}) {
    Validation.assertString(url, 'Request URL');

    // Construct default UrlFetchApp params
    const params = {
      method: options.method ? options.method.toLowerCase() : 'get',
      headers: options.headers || {},
      muteHttpExceptions: true, // We handle status codes manually
      followRedirects: options.followRedirects !== false
    };

    if (options.payload) {
      // If payload is an object and content-type isn't form-encoded, stringify it
      if (typeof options.payload === 'object' && !params.headers['Content-Type']) {
         params.payload = JSON.stringify(options.payload);
         params.headers['Content-Type'] = 'application/json';
      } else {
         params.payload = options.payload;
      }
    }

    if (options.contentType) {
      params.contentType = options.contentType;
    }

    this.logger.debug(`Starting HTTP ${params.method.toUpperCase()} request to ${url}`);

    const operation = () => {
      const response = this._fetchNative(url, params);
      const statusCode = response.getResponseCode();

      // Treat 429 (Too Many Requests) and 5xx as retryable
      if (statusCode === 429 || statusCode >= 500) {
         throw new NetworkError(`HTTP Error ${statusCode}`, { statusCode, url });
      }

      // Return unified response structure
      let data = response.getContentText();
      let parsedJson = null;

      try {
        parsedJson = JSON.parse(data);
      } catch (e) {
        // Not JSON, ignore
      }

      return {
        statusCode: statusCode,
        headers: response.getHeaders(),
        text: data,
        json: parsedJson,
        isSuccess: statusCode >= 200 && statusCode < 300
      };
    };

    const isRetryable = (error) => {
      if (error instanceof NetworkError && error.details && error.details.statusCode) {
         const code = error.details.statusCode;
         return code === 429 || code >= 500;
      }
      const msg = error.message.toLowerCase();
      if (msg.includes('timeout') || msg.includes('dns') || msg.includes('connection error')) {
         return true;
      }
      return false;
    };

    return RetryEngine.execute(operation, {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      operationName: `HTTP ${params.method.toUpperCase()} ${url}`,
      shouldRetryPredicate: isRetryable
    });
  }

  /**
   * Helper method for GET requests.
   * @param {string} url - The URL to fetch.
   * @param {Object} [headers={}] - Optional headers.
   * @returns {Object} The response object.
   */
  get(url, headers = {}) {
    return this.request(url, { method: 'get', headers });
  }

  /**
   * Helper method for POST requests.
   * @param {string} url - The URL to fetch.
   * @param {*} payload - The request payload.
   * @param {Object} [headers={}] - Optional headers.
   * @returns {Object} The response object.
   */
  post(url, payload, headers = {}) {
    return this.request(url, { method: 'post', payload, headers });
  }
}



/******************************************************************
RETRY ENGINE
******************************************************************/

/**
 * Retry Engine (Phase 3 Canonical Implementation)
 * Provides a resilient execution wrapper with exponential backoff and jitter.
 * Designed to recover from transient failures (429, 500, network).
 */
class RetryEngine {
  /**
   * Executes a function with exponential backoff on failure.
   * Default configuration: maxRetries=3, baseDelayMs=1000, maxDelayMs=30000, jitter=0.2
   *
   * @param {Function} operation - The function to execute.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.maxRetries=3]
   * @param {number} [options.baseDelayMs=1000]
   * @param {number} [options.maxDelayMs=30000]
   * @param {number} [options.jitterFactor=0.2]
   * @param {string} [options.operationName='Unknown Operation']
   * @returns {*} The result of the operation.
   */
  static execute(operation, options = {}) {
    Validation.assertFunction(operation, 'Operation');

    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    const baseDelayMs = options.baseDelayMs !== undefined ? options.baseDelayMs : 1000;
    const maxDelayMs = options.maxDelayMs !== undefined ? options.maxDelayMs : 30000;
    const jitterFactor = options.jitterFactor !== undefined ? options.jitterFactor : 0.2;
    const opName = options.operationName || 'Operation';

    let attempt = 0;
    let lastError = null;

    while (attempt <= maxRetries) {
      try {
        return operation();
      } catch (error) {
        lastError = error;
        attempt++;

        // Determine if we should stop retrying
        if (attempt > maxRetries) {
          try {
             getSystemLog().error(`RetryEngine: ${opName} failed completely after ${maxRetries} retries.`, { error: error.message });
          } catch(e){}
          throw error;
        }

        if (options.shouldRetryPredicate && !options.shouldRetryPredicate(error)) {
          try {
             getSystemLog().warn(`RetryEngine: ${opName} failed with non-retryable error. Aborting retries.`, { error: error.message });
          } catch(e){}
          throw error;
        }

        // Calculate next delay with exponential backoff and jitter
        let exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
        if (exponentialDelay > maxDelayMs) exponentialDelay = maxDelayMs;
        const jitterVariance = exponentialDelay * jitterFactor;
        const jitter = (Math.random() * 2 - 1) * jitterVariance;
        const delay = Math.max(0, Math.floor(exponentialDelay + jitter));

        try {
           getSystemLog().info(`RetryEngine: ${opName} failed. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries}).`, { error: error.message });
        } catch(e){}

        if (typeof Utils !== 'undefined' && Utils.sleep) {
           Utils.sleep(delay);
        } else if (typeof Utilities !== 'undefined') {
           Utilities.sleep(delay);
        } else {
           // mock sleep loop
           const start = new Date().getTime();
           while (new Date().getTime() - start < delay) {}
        }
      }
    }
    throw lastError;
  }
}



/******************************************************************
DATABASE ENGINE
******************************************************************/

/**
 * TarkaX Phase 2 - Google Sheets Database Engine
 *
 * STRICT CONSTRAINTS:
 * - One Google Apps Script project.
 * - No top-level instantiation. Use getter functions for singletons.
 * - ES6+ Syntax, GAS V8 Compatible.
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const SCHEMA_VERSION = 1;

const SYSTEM_COLUMNS = [
  '_id',
  '_createdAt',
  '_updatedAt',
  '_deleted',
  '_deletedAt',
  '_version',
  '_checksum',
  '_source',
  '_lastProcessed',
  '_lastModifiedBy'
];

const SCHEMA = {
  Leads: {
    company: { type: 'string', required: true },
    domain: { type: 'string' },
    score: { type: 'number', default: 0 },
    website: { type: 'string' },
    industry: { type: 'string' },
    companySize: { type: 'string' },
    employeeEstimate: { type: 'number' },
    country: { type: 'string' },
    state: { type: 'string' },
    city: { type: 'string' },
    executiveNames: { type: 'string' },
    executiveTitles: { type: 'string' },
    technologiesMentioned: { type: 'string' },
    aiProductsMentioned: { type: 'string' },
    aiVendorsMentioned: { type: 'string' },
    fundingMentioned: { type: 'string' },
    hiringSignals: { type: 'string' },
    aiInitiatives: { type: 'string' },
    aiProblems: { type: 'string' },
    aiPainCategories: { type: 'string' },
    aiMaturityIndicators: { type: 'string' },
    riskIndicators: { type: 'string' },
    buyingSignals: { type: 'string' },
    sourceQuality: { type: 'number', default: 0 },
    confidenceScore: { type: 'number', default: 0 },
    completenessScore: { type: 'number', default: 0 },
    freshnessScore: { type: 'number', default: 0 },
    reliabilityScore: { type: 'number', default: 0 },
    sourceTrustScore: { type: 'number', default: 0 },
    extractionQualityScore: { type: 'number', default: 0 },
    overallQualityScore: { type: 'number', default: 0 },
    originalSource: { type: 'string' },
    originalUrl: { type: 'string' },
    crawlTimestamp: { type: 'string' },
    // Phase 8 - Scoring Engine output columns
    buyingIntentScore: { type: 'number', default: 0 },
    painScore: { type: 'number', default: 0 },
    growthScore: { type: 'number', default: 0 },
    technologyScore: { type: 'number', default: 0 },
    hiringScore: { type: 'number', default: 0 },
    priorityTier: { type: 'string' },
    recommendedAction: { type: 'string' },
    reasoning: { type: 'string' },
    contributingSignals: { type: 'string' },
    detectedPains: { type: 'string' },
    signalBreakdown: { type: 'string' },
    scoreBreakdown: { type: 'string' },
    calculatedAt: { type: 'string' }
  },
  RawLeads: {
    rawLeadId: { type: 'string', required: true },
    source: { type: 'string' },
    sourceType: { type: 'string' },
    url: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    body: { type: 'string' },
    author: { type: 'string' },
    publishedDate: { type: 'string' },
    crawlTimestamp: { type: 'string' },
    metadata: { type: 'string' },
    rawJson: { type: 'string' },
    contentHash: { type: 'string' },
    crawlStatus: { type: 'string' },
    enrichmentStatus: { type: 'string', default: 'PENDING' },
    retryCount: { type: 'number', default: 0 },
    lastAttempt: { type: 'string' },
    processingOwner: { type: 'string' }
  },
  Duplicates: {
    originalId: { type: 'string', required: true },
    duplicateId: { type: 'string', required: true },
    confidence: { type: 'number', default: 1.0 }
  },
  DiscoveryHistory: {
    searchQuery: { type: 'string', required: true },
    generationSource: { type: 'string' },
    category: { type: 'string' },
    confidence: { type: 'number', default: 0 },
    timesExecuted: { type: 'number', default: 0 },
    resultsReturned: { type: 'number', default: 0 },
    successRate: { type: 'number', default: 0 },
    avgLeadScore: { type: 'number', default: 0 },
    avgPainScore: { type: 'number', default: 0 },
    status: { type: 'string', default: 'ACTIVE' }
  },
  SearchQueue: {
    searchQuery: { type: 'string', required: true },
    category: { type: 'string' },
    industry: { type: 'string' },
    country: { type: 'string' },
    language: { type: 'string' },
    priority: { type: 'number', default: 1 },
    confidence: { type: 'number', default: 0 },
    source: { type: 'string' },
    generatedTimestamp: { type: 'string' },
    expirationTimestamp: { type: 'string' },
    executionStatus: { type: 'string', default: 'PENDING' },
    retryCount: { type: 'number', default: 0 },
    lastExecution: { type: 'string' }
  },
  DiscoveryMetrics: {
    metricName: { type: 'string', required: true },
    metricValue: { type: 'string', required: true },
    timestamp: { type: 'string', required: true }
  },
  DiscoveryBlacklist: {
    term: { type: 'string', required: true },
    reason: { type: 'string' },
    addedAt: { type: 'string', required: true }
  },
  DiscoveryCache: {
    cacheKey: { type: 'string', required: true },
    payload: { type: 'string', required: true },
    expiresAt: { type: 'string', required: true }
  },
  DiscoveryKeywords: {
    keyword: { type: 'string', required: true },
    category: { type: 'string' },
    confidence: { type: 'number', default: 1.0 },
    source: { type: 'string' }
  },
  DiscoveryCategories: {
    name: { type: 'string', required: true },
    description: { type: 'string' },
    status: { type: 'string', default: 'ACTIVE' }
  },
  SystemLogs: {
    timestamp: { type: 'string', required: true },
    level: { type: 'string', required: true },
    module: { type: 'string', required: true },
    operation: { type: 'string' },
    message: { type: 'string', required: true },
    stack: { type: 'string' },
    details: { type: 'string' }
  },
  Queue: {
    taskType: { type: 'string', required: true },
    status: { type: 'string', required: true, default: 'PENDING' },
    payload: { type: 'string', required: true },
    attempts: { type: 'number', default: 0 },
    nextAttemptAt: { type: 'string' }
  },
  State: {
    key: { type: 'string', required: true },
    value: { type: 'string', required: true }
  },
  Cache: {
    key: { type: 'string', required: true },
    value: { type: 'string', required: true },
    expiresAt: { type: 'string', required: true }
  },
  Config: {
    key: { type: 'string', required: true },
    value: { type: 'string', required: true }
  },
  Dashboard: {
    metric: { type: 'string', required: true },
    value: { type: 'string', required: true },
    category: { type: 'string', default: 'General' }
  },
  AuditTrail: {
    operation: { type: 'string', required: true },
    sheetName: { type: 'string', required: true },
    recordId: { type: 'string', required: true },
    changedFields: { type: 'string' },
    previousValues: { type: 'string' }
  }
};

// ============================================================================
// CORE UTILITIES
// ============================================================================

class DBUtils {
  static generateUUID() {
    return Utilities.getUuid();
  }

  static getTimestamp() {
    return new Date().toISOString();
  }

  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  static safeParse(str, fallback = null) {
    if (typeof str !== 'string') return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  static safeStringify(obj) {
    if (typeof obj === 'string') return obj;
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return String(obj);
    }
  }

  static generateChecksum(obj) {
    const str = DBUtils.safeStringify(obj);
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str)
      .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
      .join('');
  }

  static typeCheck(value, type) {
    if (value === null || value === undefined || value === '') return false;
    if (type === 'uuid') return typeof value === 'string' && value.length === 36;
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number' || !isNaN(Number(value));
    if (type === 'boolean') return typeof value === 'boolean' || value === 'true' || value === 'false';
    if (type === 'object') return typeof value === 'object' && !Array.isArray(value);
    if (type === 'array') return Array.isArray(value);
    return true; // Unknown types pass by default
  }

  static castValue(value, type) {
    if (value === null || value === undefined || value === '') return null;
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true' || value === true;
    if (type === 'string') return String(value);
    if (type === 'object' || type === 'array') return DBUtils.safeParse(value, value);
    return value;
  }
}

// ============================================================================
// SYSTEM LOGGER (FAIL-SAFE)
// ============================================================================

class FailSafeLogger {
  constructor() {
    this.isLogging = false;
  }

  log(level, module, operation, message, error = null, details = null) {
    if (this.isLogging) {
      // Recursion guard: fallback to console immediately
      console.error(`Recursive Log Attempt [${level}]: ${message}`);
      return;
    }

    this.isLogging = true;
    try {
      this._writeToSheet(level, module, operation, message, error, details);
    } catch (sheetError) {
      try {
        console.error(`SystemLogs Sheet Failure: ${sheetError.message}. Original Log [${level}]: ${message}`);
      } catch (consoleError) {
        this._writeToProperties(level, message, error);
      }
    } finally {
      this.isLogging = false;
    }
  }

  _writeToSheet(level, module, operation, message, error, details) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("No active spreadsheet found.");

    let sheet = ss.getSheetByName('SystemLogs');
    if (!sheet) {
      // Attempt emergency sheet creation
      sheet = ss.insertSheet('SystemLogs');
      sheet.appendRow(['_id', '_createdAt', 'timestamp', 'level', 'module', 'operation', 'message', 'stack', 'details']);
    }

    const row = [
      DBUtils.generateUUID(),
      DBUtils.getTimestamp(),
      DBUtils.getTimestamp(),
      level,
      module,
      operation || 'N/A',
      message,
      error && error.stack ? error.stack : (error ? String(error) : ''),
      details ? DBUtils.safeStringify(details) : ''
    ];

    RetryEngine.execute(() => {
      DistributedLockManager.executeWithLock(() => {
        sheet.appendRow(row);
        SpreadsheetApp.flush();
      }, 30000, 'SCRIPT');
    }, { operationName: 'SystemLogs Write', maxRetries: 3 });
  }

  _writeToProperties(level, message, error) {
    try {
      const props = PropertiesService.getScriptProperties();
      const logsStr = props.getProperty('EMERGENCY_LOGS') || '[]';
      let logs = DBUtils.safeParse(logsStr, []);
      logs.push({
        t: DBUtils.getTimestamp(),
        l: level,
        m: message,
        e: error ? String(error) : ''
      });
      // Keep only last 20 emergency logs to avoid 9kb limit
      if (logs.length > 20) logs = logs.slice(logs.length - 20);
      props.setProperty('EMERGENCY_LOGS', JSON.stringify(logs));
    } catch (e) {
      // Ultimate silent fail
    }
  }

  info(module, operation, message, details = null) {
    this.log('INFO', module, operation, message, null, details);
  }

  warn(module, operation, message, error = null, details = null) {
    this.log('WARN', module, operation, message, error, details);
  }

  error(module, operation, message, error = null, details = null) {
    this.log('ERROR', module, operation, message, error, details);
  }
}

let _loggerInstance = null;
function getLogger() {
  if (!_loggerInstance) {
    _loggerInstance = new FailSafeLogger();
  }
  return _loggerInstance;
}

// ============================================================================
// INDEX MANAGER (CHUNKED)
// ============================================================================

class IndexManager {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.props = PropertiesService.getScriptProperties();
    this.chunkSizeLimit = 90000; // Safe limit under 100kb for CacheService string length
  }

  _getIndexMetadataKey(sheetName, columnName) {
    return `IDX_META_${sheetName}_${columnName}`;
  }

  _getChunkKey(sheetName, columnName, chunkIndex) {
    return `IDX_${sheetName}_${columnName}_CHUNK_${chunkIndex}`;
  }

  buildIndex(sheetName, columnName, records) {
    try {
      const indexMap = {};
      records.forEach(record => {
        const val = record[columnName];
        if (val !== undefined && val !== null && val !== '') {
          const key = String(val);
          if (!indexMap[key]) indexMap[key] = [];
          indexMap[key].push(record._id);
        }
      });

      const serialized = DBUtils.safeStringify(indexMap);
      this._saveChunkedIndex(sheetName, columnName, serialized);
    } catch (e) {
      getLogger().error('IndexManager', 'buildIndex', `Failed to build index for ${sheetName}.${columnName}`, e);
    }
  }

  _saveChunkedIndex(sheetName, columnName, serializedData) {
    const numChunks = Math.ceil(serializedData.length / this.chunkSizeLimit);
    const metadata = {
      numChunks,
      updatedAt: DBUtils.getTimestamp(),
      checksum: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, serializedData).join('')
    };

    const cachePayload = {};
    for (let i = 0; i < numChunks; i++) {
      const start = i * this.chunkSizeLimit;
      const chunk = serializedData.substring(start, start + this.chunkSizeLimit);
      cachePayload[this._getChunkKey(sheetName, columnName, i)] = chunk;
    }

    cachePayload[this._getIndexMetadataKey(sheetName, columnName)] = JSON.stringify(metadata);

    try {
      this.cache.putAll(cachePayload, 21600); // 6 hours max cache time
    } catch(e) {
      getLogger().warn('IndexManager', '_saveChunkedIndex', `Cache size exceeded for index ${sheetName}.${columnName}`, e);
    }
  }

  lookup(sheetName, columnName, value) {
    const metadataStr = this.cache.get(this._getIndexMetadataKey(sheetName, columnName));
    if (!metadataStr) return null; // Index missing or expired

    const metadata = DBUtils.safeParse(metadataStr);
    if (!metadata || !metadata.numChunks) return null;

    const chunkKeys = [];
    for (let i = 0; i < metadata.numChunks; i++) {
      chunkKeys.push(this._getChunkKey(sheetName, columnName, i));
    }

    const chunks = this.cache.getAll(chunkKeys);
    let serializedData = '';
    for (let i = 0; i < metadata.numChunks; i++) {
      const chunk = chunks[this._getChunkKey(sheetName, columnName, i)];
      if (!chunk) return null; // Missing chunk, index invalid
      serializedData += chunk;
    }

    const indexMap = DBUtils.safeParse(serializedData);
    if (!indexMap) return null;

    const key = String(value);
    return indexMap[key] || [];
  }

  invalidateIndex(sheetName, columnName) {
    this.cache.remove(this._getIndexMetadataKey(sheetName, columnName));
    // We let chunks expire naturally to avoid expensive search/remove operations,
    // as without metadata they will be ignored anyway.
  }
}

let _indexManagerInstance = null;
function getIndexManager() {
  if (!_indexManagerInstance) {
    _indexManagerInstance = new IndexManager();
  }
  return _indexManagerInstance;
}


// ============================================================================
// TRANSACTION ENGINE
// ============================================================================

class TransactionManager {
  constructor() {
    this.isActive = false;
    this.transactionId = null;
    this.writeAheadLog = [];
    this.snapshotData = {}; // Store original rows for rollback
  }

  beginTransaction() {
    if (this.isActive) {
      throw new Error("TransactionManager: A transaction is already active.");
    }
    this.isActive = true;
    this.transactionId = DBUtils.generateUUID();
    this.writeAheadLog = [];
    this.snapshotData = {};
    getLogger().info('TransactionManager', 'beginTransaction', `Started transaction ${this.transactionId}`);
  }

  registerMutation(sheetName, operation, rowId, originalData = null, newData = null) {
    if (!this.isActive) return;

    this.writeAheadLog.push({
      sheetName,
      operation,
      rowId,
      newData: DBUtils.deepClone(newData)
    });

    if (!this.snapshotData[sheetName]) {
      this.snapshotData[sheetName] = {};
    }

    // Only store snapshot on first mutation of this row within the transaction
    if (originalData && !this.snapshotData[sheetName][rowId]) {
      this.snapshotData[sheetName][rowId] = DBUtils.deepClone(originalData);
    }
  }

  commit() {
    if (!this.isActive) {
      throw new Error("TransactionManager: No active transaction to commit.");
    }

    // In a Google Sheets environment, true atomic commits across multiple rows/sheets
    // without locking the entire workbook is difficult.
    // Since mutations are applied immediately to the sheet by the Database engine,
    // "commit" simply means finalizing and clearing the rollback log.

    getLogger().info('TransactionManager', 'commit', `Committed transaction ${this.transactionId} with ${this.writeAheadLog.length} operations`);

    this._reset();
  }

  rollback(databaseInstance) {
    if (!this.isActive) {
      throw new Error("TransactionManager: No active transaction to rollback.");
    }

    getLogger().warn('TransactionManager', 'rollback', `Rolling back transaction ${this.transactionId}`);

    // Reverse the write ahead log and undo operations
    // Note: This requires access to the Database engine methods
    const reversedLog = [...this.writeAheadLog].reverse();

    for (const log of reversedLog) {
      try {
        if (log.operation === 'INSERT') {
          // Soft delete or hard delete the newly inserted row
          databaseInstance._hardDelete(log.sheetName, log.rowId);
        } else if (log.operation === 'UPDATE' || log.operation === 'DELETE') {
          // Restore the original data
          const original = this.snapshotData[log.sheetName]?.[log.rowId];
          if (original) {
            databaseInstance._restoreRow(log.sheetName, log.rowId, original);
          }
        }
      } catch (e) {
        getLogger().error('TransactionManager', 'rollback', `Failed to rollback operation ${log.operation} on ${log.sheetName}:${log.rowId}`, e);
      }
    }

    getLogger().info('TransactionManager', 'rollback', `Rollback complete for transaction ${this.transactionId}`);
    this._reset();
  }

  _reset() {
    this.isActive = false;
    this.transactionId = null;
    this.writeAheadLog = [];
    this.snapshotData = {};
  }
}

let _transactionManagerInstance = null;
function getTransactionManager() {
  if (!_transactionManagerInstance) {
    _transactionManagerInstance = new TransactionManager();
  }
  return _transactionManagerInstance;
}


// ============================================================================
// DATABASE ENGINE
// ============================================================================

class Database {
  constructor() {
    // Attempt to inject Graph schemas into the global SCHEMA object
    if (typeof getGraphSchemaRegistry === 'function') {
      try {
        getGraphSchemaRegistry().injectIntoDatabaseSchema();
      } catch (e) {
        console.warn('DatabaseEngine: Could not inject GraphSchemaRegistry schemas.', e);
      }
    }

    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!this.ss) {
      throw new Error("DatabaseEngine: Active spreadsheet not found.");
    }
    this.headerCache = {}; // { sheetName: { colName: index (0-based) } }
    this.idRowCache = {};  // { sheetName: { id: rowIndex (1-based) } }
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION & DDL
  // --------------------------------------------------------------------------

  initialize() {
    getLogger().info('DatabaseEngine', 'initialize', 'Starting database initialization');
    let status = { created: [], updated: [], errors: [] };

    // Check schema version migration
    const props = PropertiesService.getScriptProperties();
    const currentVersionStr = props.getProperty('DB_SCHEMA_VERSION');
    const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 0;

    if (currentVersion < SCHEMA_VERSION) {
       getLogger().info('DatabaseEngine', 'initialize', `Migrating database schema from version ${currentVersion} to ${SCHEMA_VERSION}`);
       // Put future migration logic here (e.g. data transformations).
       // For now, ensuring columns is sufficient for adding new ones.
       props.setProperty('DB_SCHEMA_VERSION', SCHEMA_VERSION.toString());
    }

    for (const sheetName of Object.keys(SCHEMA)) {
      try {
        this._ensureSheetExists(sheetName);
        this._ensureSchemaColumns(sheetName);
        status.updated.push(sheetName);
      } catch (e) {
        status.errors.push(`Failed on ${sheetName}: ${e.message}`);
        getLogger().error('DatabaseEngine', 'initialize', `Error initializing ${sheetName}`, e);
      }
    }

    getLogger().info('DatabaseEngine', 'initialize', 'Database initialization complete', status);
    return status;
  }

  _ensureSheetExists(sheetName) {
    let sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = this.ss.insertSheet(sheetName);
      getLogger().info('DatabaseEngine', '_ensureSheetExists', `Created sheet: ${sheetName}`);
    }
    return sheet;
  }

  _ensureSchemaColumns(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return;

    const schemaFields = Object.keys(SCHEMA[sheetName] || {});
    const allRequiredFields = [...SYSTEM_COLUMNS, ...schemaFields];

    DistributedLockManager.executeWithLock(() => {
      let headers = this._getHeaders(sheetName);
      if (headers.length === 0) {
        // Brand new sheet
        sheet.appendRow(allRequiredFields);
        headers = allRequiredFields;
      } else {
        // Check for missing columns
        const missingFields = allRequiredFields.filter(f => !headers.includes(f));
        if (missingFields.length > 0) {
          const newHeaders = [...headers, ...missingFields];
          // Write headers back
          sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
          headers = newHeaders;
          getLogger().info('DatabaseEngine', '_ensureSchemaColumns', `Added missing columns to ${sheetName}: ${missingFields.join(', ')}`);
        }
      }
      SpreadsheetApp.flush();
      // Update cache
      this._updateHeaderCache(sheetName, headers);
    }, 30000, 'SCRIPT');
  }

  _getHeaders(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return [];

    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) return [];

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return headers.map(h => String(h).trim());
  }

  _updateHeaderCache(sheetName, headers) {
    this.headerCache[sheetName] = {};
    headers.forEach((h, i) => {
      if (h) this.headerCache[sheetName][h] = i;
    });
  }

  _getHeaderMap(sheetName) {
    if (!this.headerCache[sheetName]) {
      const headers = this._getHeaders(sheetName);
      this._updateHeaderCache(sheetName, headers);
    }
    return this.headerCache[sheetName];
  }

  createSheet(sheetName) {
    return this._ensureSheetExists(sheetName);
  }

  dropSheet(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (sheet) {
      this.ss.deleteSheet(sheet);
      delete this.headerCache[sheetName];
      delete this.idRowCache[sheetName];
    }
  }

  truncate(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    delete this.idRowCache[sheetName];
  }

  // --------------------------------------------------------------------------
  // CORE CRUD
  // --------------------------------------------------------------------------

  insert(sheetName, record) {
    return this.batchInsert(sheetName, [record])[0];
  }

  batchInsert(sheetName, records) {
    if (!records || records.length === 0) return [];
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`DatabaseEngine: Sheet ${sheetName} not found.`);

    const headerMap = this._getHeaderMap(sheetName);
    const numCols = Object.keys(headerMap).length;
    const rows = [];
    const insertedIds = [];
    const tx = getTransactionManager();
    const timestamp = DBUtils.getTimestamp();

    records.forEach(rec => {
      // Validate & map
      const mappedRecord = this._validateAndMap(sheetName, rec, true);
      const row = new Array(numCols).fill('');

      for (const [colName, colIndex] of Object.entries(headerMap)) {
        let val = mappedRecord[colName];
        if (val !== undefined && val !== null) {
          row[colIndex] = typeof val === 'object' ? DBUtils.safeStringify(val) : val;
        }
      }
      rows.push(row);
      insertedIds.push(mappedRecord._id);

      if (tx.isActive) {
        tx.registerMutation(sheetName, 'INSERT', mappedRecord._id, null, mappedRecord);
      }
    });

    // Automatically chunk large batches (e.g. 1000 rows max per write)
    const chunkSize = 1000;

    RetryEngine.execute(() => {
      DistributedLockManager.executeWithLock(() => {
        let startRow = sheet.getLastRow() + 1;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          sheet.getRange(startRow, 1, chunk.length, numCols).setValues(chunk);
          startRow += chunk.length;
        }
        SpreadsheetApp.flush();
      }, 30000, 'SCRIPT');
    }, { operationName: `batchInsert on ${sheetName}`, maxRetries: 3 });

    // Write to Audit Trail
    this._writeAuditTrail(sheetName, 'INSERT', records, null);

    return insertedIds;
  }

  update(sheetName, id, updates) {
    return this.batchUpdate(sheetName, { [id]: updates })[0];
  }

  batchUpdate(sheetName, updatesById) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`DatabaseEngine: Sheet ${sheetName} not found.`);

    const idsToUpdate = Object.keys(updatesById);
    if (idsToUpdate.length === 0) return [];

    const headerMap = this._getHeaderMap(sheetName);
    const numCols = Object.keys(headerMap).length;
    const tx = getTransactionManager();
    const timestamp = DBUtils.getTimestamp();
    const updatedIds = [];
    const indexMgr = getIndexManager();

    // To ensure bulk efficiency, we read everything, update in memory, then overwrite the sheet.
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const dataRange = sheet.getRange(2, 1, lastRow - 1, numCols);
    const data = dataRange.getValues();
    const schema = SCHEMA[sheetName] || {};
    let hasUpdates = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // Quick find _id index
      const idIndex = headerMap['_id'];
      if (idIndex === undefined) continue;

      const recordId = row[idIndex];
      const updates = updatesById[recordId];

      if (updates) {
        hasUpdates = true;
        // Parse original
        const originalRec = {};
        for (const [colName, colIndex] of Object.entries(headerMap)) {
          let val = row[colIndex];
          if (schema[colName]) {
            val = DBUtils.castValue(val, schema[colName].type);
          }
          originalRec[colName] = val;
        }

        if (originalRec._deleted === true) continue;

        let updatedRec = { ...originalRec, ...updates };
        updatedRec._updatedAt = timestamp;
        updatedRec._version = (Number(updatedRec._version) || 0) + 1;
        updatedRec = this._validateAndMap(sheetName, updatedRec, false);

        if (tx.isActive) {
          tx.registerMutation(sheetName, 'UPDATE', updatedRec._id, originalRec, updatedRec);
        }

        // Map back to row array
        for (const [colName, colIndex] of Object.entries(headerMap)) {
          let val = updatedRec[colName];
          if (val !== undefined && val !== null) {
            data[i][colIndex] = typeof val === 'object' ? DBUtils.safeStringify(val) : val;
          } else {
            data[i][colIndex] = '';
          }
        }
        updatedIds.push(updatedRec._id);

        // Update basic index
        indexMgr.buildIndex(sheetName, '_id', [updatedRec]);
      }
    }

    if (!hasUpdates) return [];

    // Automatically chunk large batch updates
    const chunkSize = 1000;

    RetryEngine.execute(() => {
      DistributedLockManager.executeWithLock(() => {
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const chunkRange = sheet.getRange(i + 2, 1, chunk.length, numCols);
            chunkRange.setValues(chunk);
        }
        SpreadsheetApp.flush();
      }, 30000, 'SCRIPT');
    }, { operationName: `batchUpdate on ${sheetName}`, maxRetries: 3 });

    // Assuming we have original state for audit logging, in a real scenario we'd pass it.
    // For now we just log the updates.
    this._writeAuditTrail(sheetName, 'UPDATE', updatedIds.map(id => updatesById[id]), null);

    return updatedIds;
  }

  delete(sheetName, id, hard = false) {
    if (hard) {
      this._hardDelete(sheetName, id);
    } else {
      this.update(sheetName, id, { _deleted: true, _deletedAt: DBUtils.getTimestamp() });
    }
  }

  _hardDelete(sheetName, id) {
     const sheet = this.ss.getSheetByName(sheetName);
     if (!sheet) return;

     const headerMap = this._getHeaderMap(sheetName);
     const idColIndex = headerMap['_id'];
     if (idColIndex === undefined) return;

     const lastRow = sheet.getLastRow();
     if (lastRow < 2) return;

     const idData = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();

     const rowIndex = idData.findIndex(row => row[0] === id) + 2;

     if (rowIndex > 1) {
       RetryEngine.execute(() => {
          DistributedLockManager.executeWithLock(() => {
            sheet.deleteRow(rowIndex);
            SpreadsheetApp.flush();
          }, 30000, 'SCRIPT');
       }, { operationName: `hardDelete on ${sheetName}`});
     }
  }

  _writeAuditTrail(sheetName, operation, records, previousValues) {
      // Avoid recursive audit logging
      if (sheetName === 'AuditTrail') return;

      const tx = getTransactionManager();
      if (!tx.isActive) {
          // If not in a transaction, log directly to AuditTrail sheet.
          // Note: In an enterprise setting, this might be queued or batched to avoid slowing down inserts.
          const auditRecords = [];

          let recordsArr = records;
          if (!Array.isArray(recordsArr)) {
              recordsArr = [records];
          }

          const prevValuesArr = previousValues ? (Array.isArray(previousValues) ? previousValues : [previousValues]) : [];

          for (let i = 0; i < recordsArr.length; i++) {
              const rec = recordsArr[i];
              if (!rec) continue;

              auditRecords.push({
                  operation: operation,
                  sheetName: sheetName,
                  recordId: rec._id || (rec.id ? rec.id : 'unknown'),
                  changedFields: DBUtils.safeStringify(rec),
                  previousValues: prevValuesArr[i] ? DBUtils.safeStringify(prevValuesArr[i]) : ''
              });
          }

          if (auditRecords.length > 0) {
              // Fire and forget batch insert for audit trails
              try {
                  this.batchInsert('AuditTrail', auditRecords);
              } catch(e) {
                  getLogger().warn('DatabaseEngine', '_writeAuditTrail', 'Failed to write to AuditTrail', e);
              }
          }
      }
  }

  _restoreRow(sheetName, id, originalData) {
     // Used by rollback
     const headerMap = this._getHeaderMap(sheetName);
     const idColIndex = headerMap['_id'];

     const sheet = this.ss.getSheetByName(sheetName);
     if (sheet && idColIndex !== undefined) {
         const lastRow = sheet.getLastRow();
         if (lastRow >= 2) {
             const idData = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
             const rowIndex = idData.findIndex(row => row[0] === id) + 2;

             if (rowIndex > 1) {
                 this.update(sheetName, id, originalData);
                 return;
             }
         }
     }
     this.insert(sheetName, originalData); // Re-insert if hard deleted
  }

  // --------------------------------------------------------------------------
  // QUERY & READ
  // --------------------------------------------------------------------------

  getById(sheetName, id) {
    return this.find(sheetName, { _id: id });
  }

  find(sheetName, query, includeDeleted = false) {
    const results = this.findMany(sheetName, query, includeDeleted);
    return results.length > 0 ? results[0] : null;
  }

  findMany(sheetName, query = {}, includeDeleted = false) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const headerMap = this._getHeaderMap(sheetName);
    const numCols = Object.keys(headerMap).length;
    const indexMgr = getIndexManager();
    const schema = SCHEMA[sheetName] || {};

    // Check if we can use an index for simple equality queries
    let possibleIndexedIds = null;
    let usedIndex = false;
    for (const [key, value] of Object.entries(query)) {
      if (typeof value !== 'object' && value !== null) {
        // Try looking up in cache index
        const indexResults = indexMgr.lookup(sheetName, key, value);
        if (indexResults && indexResults.length > 0) {
           if (possibleIndexedIds === null) {
              possibleIndexedIds = new Set(indexResults);
           } else {
              // Intersect
              possibleIndexedIds = new Set(indexResults.filter(id => possibleIndexedIds.has(id)));
           }
           usedIndex = true;
        }
      }
    }

    // Read all data - batch first philosophy
    const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
    const results = [];

    const idIndex = headerMap['_id'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      if (usedIndex && idIndex !== undefined) {
          const rowId = row[idIndex];
          if (!possibleIndexedIds.has(rowId)) continue;
      }

      const record = {};

      for (const [colName, colIndex] of Object.entries(headerMap)) {
        let val = row[colIndex];
        const fieldSchema = schema[colName];
        if (fieldSchema) {
          val = DBUtils.castValue(val, fieldSchema.type);
        }
        record[colName] = val;
      }

      if (!includeDeleted && record._deleted === true) {
        continue;
      }

      if (this._matchesQuery(record, query)) {
        results.push(record);
      }
    }

    return results;
  }

  exists(sheetName, query) {
    return this.find(sheetName, query) !== null;
  }

  count(sheetName, query) {
    return this.findMany(sheetName, query).length;
  }

  upsert(sheetName, query, record) {
    const existing = this.find(sheetName, query);
    if (existing) {
      return this.update(sheetName, existing._id, record);
    } else {
      return this.insert(sheetName, { ...query, ...record });
    }
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS & VALIDATION
  // --------------------------------------------------------------------------

  _validateAndMap(sheetName, record, isNew = false) {
    const schema = SCHEMA[sheetName] || {};
    const mapped = DBUtils.deepClone(record);
    const timestamp = DBUtils.getTimestamp();

    if (isNew) {
      mapped._id = mapped._id || DBUtils.generateUUID();
      mapped._createdAt = timestamp;
      mapped._updatedAt = timestamp;
      mapped._deleted = false;
      mapped._version = 1;
    }

    // Apply defaults and validate
    for (const [field, rule] of Object.entries(schema)) {
      if (mapped[field] === undefined || mapped[field] === null || mapped[field] === '') {
        if (rule.default !== undefined) {
          mapped[field] = rule.default;
        } else if (rule.required && isNew) {
          throw new Error(`DatabaseEngine: Field ${field} is required on ${sheetName}`);
        }
      }

      if (mapped[field] !== undefined && mapped[field] !== null && mapped[field] !== '') {
         if (!DBUtils.typeCheck(mapped[field], rule.type)) {
           throw new Error(`DatabaseEngine: Type mismatch on ${sheetName}.${field}. Expected ${rule.type}`);
         }

         if (rule.unique) {
           // We do a fast check for uniqueness. Since finding all rows might be slow during insert,
           // we only check if explicitly needed or if we can use an index.
           // In Phase 2, relying on a naive find() for uniqueness on every insert can be O(N^2).
           // Assuming a lightweight index check here:
           const existing = getIndexManager().lookup(sheetName, field, mapped[field]);
           if (existing && existing.length > 0 && (!mapped._id || !existing.includes(mapped._id))) {
               throw new Error(`DatabaseEngine: Unique constraint violated on ${sheetName}.${field} with value ${mapped[field]}`);
           }
         }
      }
    }

    mapped._checksum = DBUtils.generateChecksum(mapped);
    return mapped;
  }

  _matchesQuery(record, query) {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null) {
        // Complex query (e.g. { $gt: 5, $contains: 'foo' })
        for (const [op, opValue] of Object.entries(value)) {
           if (op === '$gt' && !(record[key] > opValue)) return false;
           if (op === '$lt' && !(record[key] < opValue)) return false;
           if (op === '$gte' && !(record[key] >= opValue)) return false;
           if (op === '$lte' && !(record[key] <= opValue)) return false;
           if (op === '$contains' && !(String(record[key]).includes(String(opValue)))) return false;
           if (op === '$startsWith' && !(String(record[key]).startsWith(String(opValue)))) return false;
           if (op === '$endsWith' && !(String(record[key]).endsWith(String(opValue)))) return false;
           if (op === '$regex' && !(new RegExp(opValue).test(String(record[key])))) return false;
           if (op === '$between' && Array.isArray(opValue) && !(record[key] >= opValue[0] && record[key] <= opValue[1])) return false;
        }
      } else {
        // Exact match
        if (record[key] !== value) return false;
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // EXTERNAL TRANSACTION API (Missing previously)
  // --------------------------------------------------------------------------

  beginTransaction() {
    getTransactionManager().beginTransaction();
  }

  commit() {
    getTransactionManager().commit();
  }

  rollback() {
    getTransactionManager().rollback(this);
  }

  getHeaders(sheetName) {
    const map = this._getHeaderMap(sheetName);
    return Object.keys(map);
  }

  ensureColumns(sheetName) {
    this._ensureSchemaColumns(sheetName);
  }

  // --------------------------------------------------------------------------
  // TRANSACTIONS & EXPORT
  // --------------------------------------------------------------------------

  transaction(callback) {
    const tx = getTransactionManager();
    tx.beginTransaction();
    try {
      const result = callback(this);
      tx.commit();
      return result;
    } catch (e) {
      tx.rollback(this);
      throw e;
    }
  }

  exportJSON(sheetName) {
    return JSON.stringify(this.findMany(sheetName));
  }

  importJSON(sheetName, jsonString) {
    const records = DBUtils.safeParse(jsonString);
    if (!Array.isArray(records)) throw new Error("DatabaseEngine: Invalid JSON format for import");
    return this.batchInsert(sheetName, records);
  }

  getStatistics(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return null;

    const allRecords = this.findMany(sheetName, {}, true);
    const activeRecords = allRecords.filter(r => !r._deleted);
    const deletedCount = allRecords.length - activeRecords.length;

    let lastUpdate = null;
    if (allRecords.length > 0) {
      lastUpdate = allRecords.reduce((max, r) => r._updatedAt > max ? r._updatedAt : max, allRecords[0]._updatedAt);
    }

    return {
      totalRows: allRecords.length,
      activeRows: activeRecords.length,
      deletedRows: deletedCount,
      lastUpdate: lastUpdate,
      columnCount: sheet.getLastColumn()
    };
  }
}

let _databaseInstance = null;
function getDatabase() {
  if (!_databaseInstance) {
    _databaseInstance = new Database();
  }
  return _databaseInstance;
}


/**
 * GraphSchema Registry
 *
 * Defines the Knowledge Graph taxonomy and dynamically registers it with the Database Engine.
 * Provides extensible configuration for Node Types, Relationship Types, and Indexes
 * without hardcoding them into the Database Engine.
 */

class GraphSchemaRegistry {
  constructor() {
    this.nodeTypes = {};
    this.relationshipTypes = {};
    this.indexes = [];

    this._initializeDefaults();
  }

  registerNodeType(nodeType, schemaDefinition = {}) {
    Validation.assertString(nodeType, 'Node Type');

    const baseSchema = {
      uuid: { type: 'string', required: true, unique: true },
      nodeType: { type: 'string', required: true },
      canonicalName: { type: 'string', required: true },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
      metadata: { type: 'string' }
    };

    this.nodeTypes[nodeType] = { ...baseSchema, ...schemaDefinition };
  }

  registerRelationshipType(relationshipType, schemaDefinition = {}) {
    Validation.assertString(relationshipType, 'Relationship Type');
    this.relationshipTypes[relationshipType] = schemaDefinition;
  }

  registerIndex(nodeType, field) {
    Validation.assertString(nodeType, 'Node Type for Index');
    Validation.assertString(field, 'Field for Index');
    this.indexes.push({ nodeType, field });
  }

  injectIntoDatabaseSchema() {
    if (typeof SCHEMA === 'undefined') {
      throw new Error('GraphSchemaRegistry: Global SCHEMA is not defined. Cannot inject graph schemas.');
    }

    for (const [nodeType, schemaDef] of Object.entries(this.nodeTypes)) {
      SCHEMA[nodeType] = schemaDef;
    }

    SCHEMA['Relationships'] = {
      relationshipId: { type: 'string', required: true, unique: true },
      sourceNodeId: { type: 'string', required: true },
      targetNodeId: { type: 'string', required: true },
      relationshipType: { type: 'string', required: true },
      confidence: { type: 'number', default: 1.0 },
      sourceSystem: { type: 'string' },
      evidence: { type: 'string' },
      metadata: { type: 'string' },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' }
    };

    SCHEMA['GraphAliases'] = {
      aliasId: { type: 'string', required: true, unique: true },
      alias: { type: 'string', required: true },
      canonicalName: { type: 'string', required: true },
      nodeType: { type: 'string', required: true },
      confidence: { type: 'number', default: 1.0 },
      lastUpdated: { type: 'string' }
    };

    SCHEMA['GraphLogs'] = {
      logId: { type: 'string', required: true, unique: true },
      eventType: { type: 'string', required: true },
      entityId: { type: 'string', required: true },
      details: { type: 'string' },
      timestamp: { type: 'string' }
    };

    SCHEMA['AutomationMetrics_Status'] = {
      id: { type: 'string', required: true, unique: true }, // Should be fixed ID like "CURRENT"
      healthScore: { type: 'number', default: 100 },
      queueSize: { type: 'number', default: 0 },
      currentStage: { type: 'string' },
      runningWorker: { type: 'string' },
      activeTriggerCount: { type: 'number', default: 0 },
      lastSuccessfulExecution: { type: 'string' },
      lastFailedExecution: { type: 'string' },
      pendingTasks: { type: 'number', default: 0 },
      failedTasks: { type: 'number', default: 0 },
      retryCount: { type: 'number', default: 0 },
      apiErrorCount: { type: 'number', default: 0 },
      lockContention: { type: 'number', default: 0 },
      runtimeMs: { type: 'number', default: 0 },
      remainingQuotaEstimate: { type: 'number', default: 0 },
      updatedAt: { type: 'string' }
    };

    SCHEMA['AutomationMetrics_History'] = {
      id: { type: 'string', required: true, unique: true },
      timestamp: { type: 'string', required: true },
      healthScore: { type: 'number' },
      queueSize: { type: 'number' },
      runtimeMs: { type: 'number' },
      tasksCompleted: { type: 'number' },
      tasksFailed: { type: 'number' },
      apiCalls: { type: 'number' },
      retryCount: { type: 'number' },
      memoryEstimate: { type: 'number' },
      triggerCount: { type: 'number' },
      stageCompleted: { type: 'string' }
    };
  }

  _initializeDefaults() {
    this.registerNodeType('Companies', { domain: { type: 'string' }, website: { type: 'string' } });
    this.registerNodeType('PainPoints', {});
    this.registerNodeType('Technologies', {});
    this.registerNodeType('Industries', {});
    this.registerNodeType('Executives', { linkedInUrl: { type: 'string' } });
    this.registerNodeType('Sources', {});
    this.registerNodeType('HiringSignals', {});
    this.registerNodeType('FundingSignals', {});
    this.registerNodeType('Products', {});
    this.registerNodeType('AIFrameworks', {});

    this.registerRelationshipType('COMPANY_HAS_PAIN');
    this.registerRelationshipType('COMPANY_USES_TECH');
    this.registerRelationshipType('COMPANY_HIRING_FOR');
    this.registerRelationshipType('COMPANY_FUNDED_BY');
    this.registerRelationshipType('COMPANY_LOCATED_IN');
    this.registerRelationshipType('COMPANY_OPERATES_IN');
    this.registerRelationshipType('EXECUTIVE_WORKS_AT');
    this.registerRelationshipType('PRODUCT_BUILT_ON');
    this.registerRelationshipType('TECH_RELATED_TO');
    this.registerRelationshipType('PAIN_IMPACTS');
    this.registerRelationshipType('PAIN_CAUSED_BY');
    this.registerRelationshipType('WORKFLOW_USES');
    this.registerRelationshipType('WORKFLOW_BLOCKED_BY');
    this.registerRelationshipType('SOURCE_MENTIONS');
    this.registerRelationshipType('COMPANY_USING_MODEL');
    this.registerRelationshipType('MODEL_HAS_LIMITATION');
    this.registerRelationshipType('AI_TOOL_CAUSES');
    this.registerRelationshipType('PAIN_RESOLVED_BY');
    this.registerRelationshipType('FRAMEWORK_SUPPORTS');
    this.registerRelationshipType('DEPARTMENT_USING');
    this.registerRelationshipType('COMPANY_INTERESTED_IN');
    this.registerRelationshipType('COMPANY_EVALUATING');

    this.registerIndex('Companies', 'canonicalName');
    this.registerIndex('Companies', 'domain');
    this.registerIndex('PainPoints', 'canonicalName');
    this.registerIndex('Technologies', 'canonicalName');
    this.registerIndex('GraphAliases', 'alias');
  }
}

function getGraphSchemaRegistry() {
  if (!getGraphSchemaRegistry.instance) {
    getGraphSchemaRegistry.instance = new GraphSchemaRegistry();
  }
  return getGraphSchemaRegistry.instance;
}


/**
 * Graph Index Manager
 *
 * Maintains secondary indexes for O(1) graph lookups and inbound/outbound relationship indexes.
 * Uses CacheService for fast reads. Handles chunking if the index grows beyond Cache limits.
 * Falls back to dedicated DB Sheets if Cache misses.
 */

class GraphIndexManager {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.props = PropertiesService.getScriptProperties();
    this.db = getDatabase();

    // Hard limits in GAS
    this.MAX_CACHE_SIZE = 90000;
  }

  _getIndexKey(nodeType, field) {
    return `G_IDX_${nodeType}_${field}`;
  }

  _getRelIndexKey(nodeId, direction) {
    return `G_REL_${nodeId}_${direction}`;
  }

  // ==========================================================================
  // NODE INDEXING
  // ==========================================================================

  lookup(nodeType, field, value) {
    if (!value) return [];

    const indexData = this._loadIndex(nodeType, field);
    const searchKey = String(value).toLowerCase().trim();

    return indexData[searchKey] || [];
  }

  updateIndex(nodeType, field, value, uuid) {
    if (!value || !uuid) return;

    const indexData = this._loadIndex(nodeType, field);
    const searchKey = String(value).toLowerCase().trim();

    if (!indexData[searchKey]) {
      indexData[searchKey] = [];
    }

    if (!indexData[searchKey].includes(uuid)) {
      indexData[searchKey].push(uuid);
      this._saveIndex(nodeType, field, indexData);
    }
  }

  removeFromIndex(nodeType, field, value, uuid) {
    if (!value || !uuid) return;

    const indexData = this._loadIndex(nodeType, field);
    const searchKey = String(value).toLowerCase().trim();

    if (indexData[searchKey]) {
      const idx = indexData[searchKey].indexOf(uuid);
      if (idx !== -1) {
        indexData[searchKey].splice(idx, 1);
        if (indexData[searchKey].length === 0) {
          delete indexData[searchKey];
        }
        this._saveIndex(nodeType, field, indexData);
      }
    }
  }

  rebuildIndex(nodeType, field) {
    getExecutionLogger().info('GraphIndexManager', 'rebuildIndex', `Rebuilding index for ${nodeType}.${field}`);
    try {
      const records = this.db.read(nodeType);
      const indexData = {};

      for (const record of records) {
        const val = record[field];
        const uuid = record.uuid;

        if (val && uuid) {
          const searchKey = String(val).toLowerCase().trim();
          if (!indexData[searchKey]) {
            indexData[searchKey] = [];
          }
          if (!indexData[searchKey].includes(uuid)) {
            indexData[searchKey].push(uuid);
          }
        }
      }

      this._saveIndex(nodeType, field, indexData);
      getExecutionLogger().info('GraphIndexManager', 'rebuildIndex', `Index rebuilt with ${Object.keys(indexData).length} unique keys.`);
    } catch (e) {
      getExecutionLogger().error('GraphIndexManager', 'rebuildIndex', `Failed to rebuild index for ${nodeType}.${field}`, e);
    }
  }

  // ==========================================================================
  // RELATIONSHIP INDEXING
  // ==========================================================================

  getRelationships(nodeId, direction) {
     const key = this._getRelIndexKey(nodeId, direction);
     const cached = this.cache.get(key);
     if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
     }

     const query = direction === 'IN' ? { targetNodeId: nodeId } : { sourceNodeId: nodeId };
     const edges = this.db.read('Relationships', query);
     this._safeCachePut(key, JSON.stringify(edges));
     return edges;
  }

  updateRelationshipIndex(sourceNodeId, targetNodeId, edgeRecord) {
     const outKey = this._getRelIndexKey(sourceNodeId, 'OUT');
     const cachedOut = this.cache.get(outKey);
     if (cachedOut) {
         try {
            const outEdges = JSON.parse(cachedOut);
            outEdges.push(edgeRecord);
            this._safeCachePut(outKey, JSON.stringify(outEdges));
         } catch(e) {}
     }

     const inKey = this._getRelIndexKey(targetNodeId, 'IN');
     const cachedIn = this.cache.get(inKey);
     if (cachedIn) {
         try {
            const inEdges = JSON.parse(cachedIn);
            inEdges.push(edgeRecord);
            this._safeCachePut(inKey, JSON.stringify(inEdges));
         } catch(e) {}
     }
  }

  removeRelationshipFromIndex(sourceNodeId, targetNodeId, relationshipId) {
     const outKey = this._getRelIndexKey(sourceNodeId, 'OUT');
     const cachedOut = this.cache.get(outKey);
     if (cachedOut) {
         try {
            let outEdges = JSON.parse(cachedOut);
            outEdges = outEdges.filter(e => e.relationshipId !== relationshipId);
            this._safeCachePut(outKey, JSON.stringify(outEdges));
         } catch(e) {}
     }

     const inKey = this._getRelIndexKey(targetNodeId, 'IN');
     const cachedIn = this.cache.get(inKey);
     if (cachedIn) {
         try {
            let inEdges = JSON.parse(cachedIn);
            inEdges = inEdges.filter(e => e.relationshipId !== relationshipId);
            this._safeCachePut(inKey, JSON.stringify(inEdges));
         } catch(e) {}
     }
  }

  // ==========================================================================
  // INTERNAL CACHE STORAGE
  // ==========================================================================

  _loadIndex(nodeType, field) {
    const key = this._getIndexKey(nodeType, field);
    let fullPayload = "";

    let chunk0 = this.cache.get(`${key}_0`);
    if (!chunk0) chunk0 = this.props.getProperty(`${key}_0`);

    if (chunk0) {
      try {
        const meta = JSON.parse(chunk0);
        fullPayload += meta.data;
        for (let i = 1; i < meta.totalChunks; i++) {
           let chunk = this.cache.get(`${key}_${i}`);
           if (!chunk) chunk = this.props.getProperty(`${key}_${i}`);
           if (chunk) fullPayload += chunk;
        }
        return JSON.parse(fullPayload);
      } catch (e) {}
    }

    return {};
  }

  _saveIndex(nodeType, field, indexData) {
    const key = this._getIndexKey(nodeType, field);
    const payload = JSON.stringify(indexData);

    const chunks = [];
    const MAX_CHUNK = 8000;
    for (let i = 0; i < payload.length; i += MAX_CHUNK) {
       chunks.push(payload.substring(i, i + MAX_CHUNK));
    }

    for (let i = 0; i < chunks.length; i++) {
       const chunkKey = `${key}_${i}`;
       const chunkVal = i === 0
           ? JSON.stringify({ totalChunks: chunks.length, data: chunks[i] })
           : chunks[i];

       try { this.props.setProperty(chunkKey, chunkVal); } catch(e) {}
       this._safeCachePut(chunkKey, chunkVal);
    }
  }

  _safeCachePut(key, value) {
      if (value.length < this.MAX_CACHE_SIZE) {
          try {
             this.cache.put(key, value, 21600);
          } catch(e) {}
      }
  }
}

function getGraphIndexManager() {
  if (!getGraphIndexManager.instance) {
    getGraphIndexManager.instance = new GraphIndexManager();
  }
  return getGraphIndexManager.instance;
}



/******************************************************************
CHECKPOINT ENGINE
******************************************************************/

/**
 * Execution State Manager
 *
 * Responsible for tracking the exact state of the execution engine.
 * Stores lightweight state in PropertiesService so it survives script termination.
 * States: IDLE, QUEUED, RUNNING, CHECKPOINT, SUCCESS, RETRY, FAILED, TIMEOUT, ABORTED, RESUME
 */

const ENGINE_STATES = {
  IDLE: 'IDLE',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  CHECKPOINT: 'CHECKPOINT',
  SUCCESS: 'SUCCESS',
  RETRY: 'RETRY',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  ABORTED: 'ABORTED',
  RESUME: 'RESUME',
  EXIT: 'EXIT'
};

class ExecutionStateManager {
  constructor() {
    this.props = getScriptProps();
    this.STATE_KEY = 'ENGINE_EXECUTION_STATE';
  }

  /**
   * Initializes a new execution state.
   */
  initializeState() {
    const initialState = {
      executionId: Utilities.getUuid(),
      state: ENGINE_STATES.IDLE,
      startTime: new Date().toISOString(),
      currentWorkflow: null,
      currentModule: null,
      resumeToken: null,
      lastCheckpointTime: null,
      retryCount: 0,

      // Pipeline Scheduler specific state
      currentStage: null,
      completedStages: [],
      failedStages: [],
      lastHeartbeat: new Date().toISOString(),
      currentWorker: null
    };
    this._saveState(initialState);
    return initialState;
  }

  /**
   * Transitions the engine to a new state.
   * @param {string} newState - Must be a valid ENGINE_STATES value.
   * @param {Object} [updates={}] - Additional state properties to update (e.g. currentModule).
   */
  transition(newState, updates = {}) {
    if (!Object.values(ENGINE_STATES).includes(newState)) {
      throw new ConfigurationError(`Invalid execution state: ${newState}`);
    }

    const state = this.getState();
    const oldState = state.state;
    state.state = newState;

    // Apply any additional updates
    for (const [key, value] of Object.entries(updates)) {
      state[key] = value;
    }

    this._saveState(state);

    try {
      getExecutionLogger().info('ExecutionStateManager', 'Transition', `State changed: ${oldState} -> ${newState}`, {
        executionId: state.executionId,
        workflow: state.currentWorkflow,
        module: state.currentModule
      });
    } catch(e) { /* ignore logger issues */ }

    return state;
  }

  /**
   * Retrieves the current execution state.
   * @returns {Object} The current state object, or a new initialized state if none exists.
   */
  getState() {
    const stateStr = this.props.get(this.STATE_KEY);
    if (!stateStr) {
      return this.initializeState();
    }
    try {
      return JSON.parse(stateStr);
    } catch (e) {
      getExecutionLogger().warn('ExecutionStateManager', 'getState', 'Failed to parse state, re-initializing.');
      return this.initializeState();
    }
  }

  /**
   * Updates specific fields in the current state without changing the primary state enum.
   * @param {Object} updates
   */
  updateContext(updates) {
    const state = this.getState();
    for (const [key, value] of Object.entries(updates)) {
      state[key] = value;
    }
    this._saveState(state);
    return state;
  }

  /**
   * Clears the current state (typically used on complete SUCCESS or FAILED after recovery is no longer needed).
   */
  clearState() {
    this.props.delete(this.STATE_KEY);
  }

  _saveState(stateObj) {
    this.props.set(this.STATE_KEY, JSON.stringify(stateObj));
  }
}

// Singleton getter
function getExecutionStateManager() {
  if (!getExecutionStateManager.instance) {
    getExecutionStateManager.instance = new ExecutionStateManager();
  }
  return getExecutionStateManager.instance;
}


/**
 * Checkpoint Engine
 *
 * Automatically saves and loads execution progress using PropertiesService.
 * Essential for recovering safely without duplicating work if the script terminates.
 */

class CheckpointEngine {
  constructor() {
    this.props = getScriptProps();
    this.CHECKPOINT_KEY = 'ENGINE_LATEST_CHECKPOINT';
  }

  /**
   * Saves a new checkpoint with the current execution context.
   * @param {Object} context
   * @param {string} context.currentTask
   * @param {string} context.currentModule
   * @param {Object} context.apiState
   * @param {string} context.resumeToken
   */
  saveCheckpoint(context = {}) {
    // Merge the checkpoint context with the Queue pointer (if any)
    const queueManager = getQueueManager();
    const pointer = queueManager.getPointer();

    const checkpoint = {
      timestamp: new Date().toISOString(),
      currentTask: context.currentTask || null,
      currentModule: context.currentModule || null,
      apiState: context.apiState || null,
      resumeToken: context.resumeToken || Utilities.getUuid(),
      cursor: pointer.cursorId,
      pageNumber: pointer.pageNumber,
      offset: pointer.offset
    };

    this.props.set(this.CHECKPOINT_KEY, JSON.stringify(checkpoint));

    // Also update the state manager
    const stateManager = getExecutionStateManager();
    stateManager.updateContext({
      lastCheckpointTime: checkpoint.timestamp,
      resumeToken: checkpoint.resumeToken
    });

    getExecutionLogger().info('CheckpointEngine', 'Save', 'Checkpoint saved successfully.', checkpoint);
    return checkpoint;
  }

  /**
   * Loads the latest checkpoint.
   * @returns {Object|null} The checkpoint object or null if none exists.
   */
  loadCheckpoint() {
    const cpStr = this.props.get(this.CHECKPOINT_KEY);
    if (!cpStr) {
      getExecutionLogger().debug('CheckpointEngine', 'Load', 'No checkpoint found.');
      return null;
    }

    try {
      const checkpoint = JSON.parse(cpStr);
      getExecutionLogger().info('CheckpointEngine', 'Load', 'Checkpoint loaded.', checkpoint);
      return checkpoint;
    } catch (e) {
      getExecutionLogger().error('CheckpointEngine', 'Load', 'Failed to parse checkpoint data.', e);
      return null;
    }
  }

  /**
   * Clears the current checkpoint (e.g., when a workflow completes successfully).
   */
  clearCheckpoint() {
    this.props.delete(this.CHECKPOINT_KEY);
    getExecutionLogger().info('CheckpointEngine', 'Clear', 'Checkpoint cleared.');
  }

  /**
   * Checks if a valid checkpoint exists.
   * @returns {boolean}
   */
  hasCheckpoint() {
    return this.props.get(this.CHECKPOINT_KEY) !== null;
  }
}

// Singleton getter
function getCheckpointEngine() {
  if (!getCheckpointEngine.instance) {
    getCheckpointEngine.instance = new CheckpointEngine();
  }
  return getCheckpointEngine.instance;
}



/******************************************************************
QUEUE MANAGER
******************************************************************/

/**
 * Queue Manager
 *
 * Manages the execution queue.
 * - Active tasks are pulled from the Database 'Queue' sheet or cached locally.
 * - Queue pointer/cursor is managed in PropertiesService to support thousands of tasks.
 */

class QueueManager {
  constructor() {
    this.props = getScriptProps();
    this.QUEUE_POINTER_KEY = 'ENGINE_QUEUE_POINTER';
  }

  /**
   * Enqueues a task by inserting it into the Database Engine.
   * @param {string} taskType - The module or task name (e.g. 'CRAWL', 'DISCOVER')
   * @param {Object} payload - Task specific data
   * @param {number} [priority=1] - Lower number is higher priority (currently not fully modeled in DB schema, but standard practice)
   */
  enqueue(taskType, payload, priority = 1) {
    Validation.assertString(taskType, 'Task Type');

    const db = getDatabase();
    const taskRecord = {
      taskType: taskType,
      status: 'PENDING',
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      attempts: 0
    };

    const id = db.insert('Queue', taskRecord);
    getExecutionLogger().info('QueueManager', 'Enqueue', `Queued task ${taskType}`, { id });
    return id;
  }

  /**
   * Enqueues multiple tasks efficiently.
   */
  enqueueBatch(tasks) {
    if (!tasks || tasks.length === 0) return [];
    const db = getDatabase();

    const records = tasks.map(t => ({
      taskType: t.taskType,
      status: 'PENDING',
      payload: typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload),
      attempts: 0
    }));

    const ids = db.batchInsert('Queue', records);
    getExecutionLogger().info('QueueManager', 'EnqueueBatch', `Queued ${records.length} tasks`);
    return ids;
  }

  /**
   * Reads the next available batch of tasks from the queue.
   * @param {number} limit
   */
  getNextBatch(limit = 10) {
    const db = getDatabase();
    // In Phase 3, we fetch pending tasks. A robust query might need an index on 'status'
    // but the generic DB supports filtering via findMany.
    const tasks = db.findMany('Queue', { status: 'PENDING' });

    // Sort logic could go here if we supported priority or creation time sorting explicitly.
    // Assuming chronological order by default findMany.
    return tasks.slice(0, limit);
  }

  /**
   * Marks a task as running in the database.
   */
  markRunning(taskId) {
    const db = getDatabase();
    db.update('Queue', taskId, { status: 'RUNNING' });
  }

  /**
   * Marks a task as successful.
   */
  markSuccess(taskId) {
    const db = getDatabase();
    db.update('Queue', taskId, { status: 'SUCCESS' });
  }

  /**
   * Handles a task failure, either retrying it or marking it completely failed.
   */
  markFailed(task, error, maxRetries = 3) {
    const db = getDatabase();
    const attempts = (task.attempts || 0) + 1;

    if (attempts >= maxRetries) {
      db.update('Queue', task._id, {
        status: 'FAILED',
        attempts: attempts
      });
      getExecutionLogger().error('QueueManager', 'TaskFailed', `Task permanently failed after ${attempts} attempts`, error, { taskId: task._id });
    } else {
      // Exponential backoff logic could determine nextAttemptAt here
      db.update('Queue', task._id, {
        status: 'RETRY',
        attempts: attempts
      });
      getExecutionLogger().warn('QueueManager', 'TaskRetry', `Task failed, scheduled for retry (${attempts}/${maxRetries})`, error, { taskId: task._id });
    }
  }

  /**
   * Recovers tasks that were stuck in RUNNING state (e.g. script crash).
   */
  recoverStuckTasks() {
    const db = getDatabase();
    const stuckTasks = db.findMany('Queue', { status: 'RUNNING' });

    if (stuckTasks.length > 0) {
      getExecutionLogger().warn('QueueManager', 'RecoverStuckTasks', `Found ${stuckTasks.length} stuck tasks. Resetting to PENDING.`);
      const updates = {};
      stuckTasks.forEach(t => {
        updates[t._id] = { status: 'PENDING' };
      });
      db.batchUpdate('Queue', updates);
    }
  }

  // --- Pointer Management for very large datasets (e.g. iterating over millions of Leads) ---

  setPointer(cursorId, pageNumber, offset) {
    const pointer = { cursorId, pageNumber, offset };
    this.props.set(this.QUEUE_POINTER_KEY, JSON.stringify(pointer));
  }

  getPointer() {
    const pStr = this.props.get(this.QUEUE_POINTER_KEY);
    if (!pStr) return { cursorId: null, pageNumber: 0, offset: 0 };
    try {
      return JSON.parse(pStr);
    } catch (e) {
      return { cursorId: null, pageNumber: 0, offset: 0 };
    }
  }

  clearPointer() {
    this.props.delete(this.QUEUE_POINTER_KEY);
  }
}

// Singleton getter
function getQueueManager() {
  if (!getQueueManager.instance) {
    getQueueManager.instance = new QueueManager();
  }
  return getQueueManager.instance;
}



/******************************************************************
EXECUTION ENGINE
******************************************************************/

/**
 * Automation Engine
 *
 * The top-level orchestrator for Phase 11.
 * Coordinates the TriggerManager, PipelineScheduler, RecoveryEngine,
 * HealthMonitor, QueueManager, ExecutionEngine, and SelfHealingEngine.
 * Contains orchestration logic only (no business logic).
 */

class AutomationEngine {
  constructor() {
    this.logger = getSystemLog();
    this.triggerManager = getTriggerManager();
    this.pipelineScheduler = getPipelineScheduler();
    this.recoveryEngine = getRecoveryEngine();
    this.healthMonitor = getHealthMonitor();
    this.selfHealingEngine = getSelfHealingEngine();
  }

  /**
   * Initializes the automation system (called during setup/deployment).
   */
  initialize() {
    this.logger.info('AutomationEngine', 'Initializing Automation Engine.');
    this.triggerManager.initializeSystemTriggers();
    this.logger.info('AutomationEngine', 'Initialization complete.');
  }

  /**
   * Primary entry point for the Daily Pipeline.
   */
  runDailyPipeline() {
    this.logger.info('AutomationEngine', 'Starting Daily Pipeline.');

    // Safety check - self healing before a major run
    this.selfHealingEngine.heal();

    // Reset pipeline state
    this.pipelineScheduler.resetPipeline();

    // Start the scheduler
    this.pipelineScheduler.startPipeline();
  }

  /**
   * Entry point for resuming an interrupted pipeline.
   */
  resumePipeline() {
    this.logger.info('AutomationEngine', 'Resuming Pipeline.');

    // Let the recovery engine handle crashed states
    this.recoveryEngine.recoverAndResume();

    // After execution engine runs via recovery, check if pipeline stage needs advancing
    const stateManager = getExecutionStateManager();
    const state = stateManager.getState();

    if (state.state === 'SUCCESS') {
       // If queue is completely empty, the stage is done
       const queueManager = getQueueManager();
       const pending = queueManager.getNextBatch(1);
       if (pending.length === 0 && state.currentStage) {
          this.pipelineScheduler.markStageComplete(state.currentStage);
       }
    }
  }

  /**
   * Entry point for standard health checks.
   */
  runHealthCheck() {
    this.logger.info('AutomationEngine', 'Running Scheduled Health Check.');
    const report = this.healthMonitor.generateReport();

    // If the score is critically low, trigger self-healing
    if (report.score < 80) {
      this.logger.warn('AutomationEngine', 'Health score below threshold, triggering self-healing.');
      this.selfHealingEngine.heal();
    }
  }
}

// -----------------------------------------------------------------------------
// Global Trigger Handlers mapped to AutomationEngine
// -----------------------------------------------------------------------------




// Note: TarkaX_System_Resume is still used internally by TimeoutManager for 1-minute resumes,
// while TarkaX_Automation_QueueResume is a constant 15-minute cron backup.


// Singleton getter
function getAutomationEngine() {
  if (!getAutomationEngine.instance) {
    getAutomationEngine.instance = new AutomationEngine();
  }
  return getAutomationEngine.instance;
}



/**
 * Task Dispatcher
 *
 * Dynamically routes execution to registered task modules.
 * Ensures the core engine does not need to know implementation details of future modules.
 */

class TaskDispatcher {
  constructor() {
    this.registry = {};
  }

  /**
   * Registers a handler function for a specific task type.
   * @param {string} taskType - The name of the task (e.g. 'CRAWL', 'DISCOVER').
   * @param {Function} handler - The function to execute. Must accept a payload parameter.
   */
  registerTask(taskType, handler) {
    Validation.assertString(taskType, 'Task Type');
    Validation.assertFunction(handler, 'Task Handler');

    const normalizedTaskType = taskType.toUpperCase();

    if (this.registry[normalizedTaskType]) {
      getExecutionLogger().warn('TaskDispatcher', 'RegisterTask', `Overwriting existing handler for task: ${normalizedTaskType}`);
    }

    this.registry[normalizedTaskType] = handler;
    getExecutionLogger().info('TaskDispatcher', 'RegisterTask', `Task registered: ${normalizedTaskType}`);
  }

  /**
   * Unregisters a task.
   * @param {string} taskType
   */
  unregisterTask(taskType) {
    const normalizedTaskType = taskType.toUpperCase();
    delete this.registry[normalizedTaskType];
  }

  /**
   * Checks if a task is registered.
   * @param {string} taskType
   * @returns {boolean}
   */
  taskExists(taskType) {
    return !!this.registry[taskType.toUpperCase()];
  }

  /**
   * Gets a list of all currently registered tasks.
   * @returns {string[]}
   */
  getRegisteredTasks() {
    return Object.keys(this.registry);
  }

  /**
   * Executes a registered task with the given payload.
   * @param {string} taskType
   * @param {Object} payload
   * @returns {*} The result of the task handler.
   */
  executeTask(taskType, payload) {
    const normalizedTaskType = taskType.toUpperCase();
    const handler = this.registry[normalizedTaskType];

    if (!handler) {
      throw new ConfigurationError(`TaskDispatcher: No handler registered for task type: ${normalizedTaskType}`);
    }

    try {
      getExecutionLogger().debug('TaskDispatcher', 'ExecuteTask', `Executing task: ${normalizedTaskType}`, payload);
      const result = handler(payload);
      return result;
    } catch (error) {
      getExecutionLogger().error('TaskDispatcher', 'ExecuteTask', `Error executing task: ${normalizedTaskType}`, error);
      throw error;
    }
  }
}

// Singleton getter
function getTaskDispatcher() {
  if (!getTaskDispatcher.instance) {
    getTaskDispatcher.instance = new TaskDispatcher();


    // Auto-register known engines
    if (typeof registerEnrichmentEngine === 'function') {
       registerEnrichmentEngine();
    }

    // Auto-register Graph Tasks
    if (typeof registerGraphTasks === 'function') {
       registerGraphTasks();
    }

    // Maintenance Tasks
    getTaskDispatcher.instance.registerTask('MAINTENANCE_CACHE_PURGE', () => getSelfHealingEngine()._repairCache());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_LOG_COMPRESSION', () => getMaintenanceEngine().compressLogs());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_STALE_CHECKPOINT_REMOVAL', () => getMaintenanceEngine().removeStaleCheckpoints());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_TEMP_DATA_CLEANUP', () => getMaintenanceEngine().cleanupTempData());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REBUILD_INDEXES', () => getGraphIndexManager().buildIndexes());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REFRESH_DASHBOARD', () => { getDashboardEngine().updateDashboard(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_GRAPH_OPTIMIZATION', () => { if (typeof getGraphAnalytics === 'function') getGraphAnalytics().optimizeGraph(); else getSystemLog().warn('Maintenance', 'Graph optimization not available'); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_DUPLICATE_REEVALUATION', () => { if (typeof getEntityResolver === 'function') getEntityResolver().resolveAliases(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_SCORE_RECALCULATION', () => { if (typeof getScoringEngine === 'function') getScoringEngine().recalculateAll(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_ONTOLOGY_REFRESH', () => { if (typeof getPainOntologyEngine === 'function') getPainOntologyEngine().initializeNodes(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_CRAWLER_STATS_CLEANUP', () => { getSystemLog().info('Maintenance', 'Crawler Stats cleanup omitted.'); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_ARCHIVE_LEADS', () => getMaintenanceEngine().archiveOldLeads());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_ARCHIVE_LOGS', () => getMaintenanceEngine().archiveMetrics());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REBUILD_SUMMARY_TABLES', () => { getDashboardEngine().updateDashboard(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_OPTIMIZE_METRICS', () => getSystemLog().info('Maintenance', 'Optimize Metrics omitted.'));
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REFRESH_CONFIG_CACHE', () => { getAppConfig().clear(); getAppConfig(); });

  }
  return getTaskDispatcher.instance;
}


/**
 * Pipeline Scheduler
 *
 * Orchestrates the high-level stages of the pipeline.
 * Decides which module should execute next and tracks progress across executions.
 * Ensures only unfinished stages are executed.
 */

class PipelineScheduler {
  constructor() {
    this.stateManager = getExecutionStateManager();
    this.queueManager = getQueueManager();
    this.logger = getSystemLog();

    // The ordered list of pipeline stages
    this.PIPELINE_STAGES = [
      'DISCOVERY',
      'CRAWLER_RSS',
      'CRAWLER_GITHUB',
      'CRAWLER_REDDIT',
      'CRAWLER_JOBS',
      'CRAWLER_FUNDING',
      'ENRICHMENT',
      'PAIN_DETECTION',
      'BUYING_INTENT',
      'DEDUPLICATION',
      'DASHBOARD_UPDATE',
      'MAINTENANCE',
      'COMPLETE'
    ];
  }

  /**
   * Starts or resumes the pipeline.
   * Finds the first unfinished stage and kicks off the corresponding worker.
   */
  startPipeline() {
    this.logger.info('PipelineScheduler', 'Evaluating pipeline stages to start/resume.');

    const state = this.stateManager.getState();
    const completedStages = state.completedStages || [];

    // Find next stage
    let nextStage = null;
    for (const stage of this.PIPELINE_STAGES) {
      if (!completedStages.includes(stage)) {
        nextStage = stage;
        break;
      }
    }

    if (!nextStage || nextStage === 'COMPLETE') {
       this.logger.info('PipelineScheduler', 'Pipeline is fully complete for this cycle.');
       return;
    }

    this.logger.info('PipelineScheduler', `Next unfinished stage is: ${nextStage}.`);

    // Update state to active stage
    this.stateManager.updateContext({
       currentStage: nextStage,
       lastHeartbeat: new Date().toISOString()
    });

    this._dispatchStage(nextStage);
  }

  /**
   * Dispatches the correct payload to the queue for a given stage.
   */
  _dispatchStage(stage) {
    this.logger.info('PipelineScheduler', `Dispatching stage: ${stage}`);

    // For many stages, we just inject an initial task into the queue to start that engine
    switch (stage) {
      case 'DISCOVERY':
        this.queueManager.enqueue('DISCOVER', { category: 'ALL' }, 1);
        break;
      case 'CRAWL': // Generic Crawl
        this.queueManager.enqueue('CRAWL', { type: 'ALL' }, 2);
        break;
      case 'CRAWLER_RSS':
        this.queueManager.enqueue('CRAWL_RSS', {}, 2);
        break;
      case 'CRAWLER_GITHUB':
        this.queueManager.enqueue('CRAWL_GITHUB', {}, 2);
        break;
      case 'CRAWLER_REDDIT':
        this.queueManager.enqueue('CRAWL_REDDIT', {}, 2);
        break;
      case 'CRAWLER_JOBS':
        this.queueManager.enqueue('CRAWL_JOBS', {}, 2);
        break;
      case 'CRAWLER_FUNDING':
        this.queueManager.enqueue('CRAWL_FUNDING', {}, 2);
        break;
      case 'ENRICHMENT':
      case 'PAIN_DETECTION':
      case 'BUYING_INTENT':
      case 'DEDUPLICATION':
        // These typically run continuously on queued items,
        // but we can enqueue a specific batch trigger or let ExecutionEngine process pending queue
        // For simplicity of orchestration, we ensure queue processing runs
        break;
      case 'DASHBOARD_UPDATE':
        this.queueManager.enqueue('DASHBOARD_UPDATE', {}, 3);
        break;
      case 'MAINTENANCE':
        getMaintenanceEngine().planDailyMaintenance();
        break;
      default:
        this.logger.warn('PipelineScheduler', `Unknown stage: ${stage}`);
        break;
    }

    // After queueing, transition state and kick off the execution engine
    this.stateManager.transition('QUEUED');
    getExecutionEngine().start();
  }

  /**
   * Marks a stage as complete and moves to the next stage.
   */
  markStageComplete(stage) {
    this.logger.info('PipelineScheduler', `Marking stage complete: ${stage}`);

    const state = this.stateManager.getState();
    const completedStages = state.completedStages || [];

    if (!completedStages.includes(stage)) {
       completedStages.push(stage);
    }

    this.stateManager.updateContext({
       completedStages: completedStages,
       currentStage: null
    });

    // Immediately start next stage if not checking timeouts
    this.startPipeline();
  }

  /**
   * Resets the pipeline completely (e.g., for a new daily run).
   */
  resetPipeline() {
    this.logger.info('PipelineScheduler', 'Resetting pipeline for new cycle.');
    this.stateManager.updateContext({
       currentStage: null,
       completedStages: [],
       failedStages: [],
       executionId: Utilities.getUuid(),
       startTime: new Date().toISOString()
    });
  }
}

// Singleton getter
function getPipelineScheduler() {
  if (!getPipelineScheduler.instance) {
    getPipelineScheduler.instance = new PipelineScheduler();
  }
  return getPipelineScheduler.instance;
}


/**
 * Maintenance Engine
 *
 * Acts as a planner to generate and enqueue maintenance tasks.
 * Performs Daily, Weekly, and Monthly scheduling.
 * Does NOT execute maintenance synchronously to avoid timeouts.
 */

class MaintenanceEngine {
  constructor() {
    this.queueManager = getQueueManager();
    this.logger = getSystemLog();
  }

  /**
   * Plans and enqueues daily maintenance jobs.
   */
  planDailyMaintenance() {
    this.logger.info('MaintenanceEngine', 'Planning Daily Maintenance.');

    this.queueManager.enqueue('MAINTENANCE_CACHE_PURGE', {}, 5); // Low priority
    this.queueManager.enqueue('MAINTENANCE_LOG_COMPRESSION', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_STALE_CHECKPOINT_REMOVAL', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_TEMP_DATA_CLEANUP', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_REBUILD_INDEXES', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_REFRESH_DASHBOARD', {}, 5);

    this.logger.info('MaintenanceEngine', 'Daily Maintenance planning complete.');
  }

  /**
   * Plans and enqueues weekly optimization jobs.
   */
  planWeeklyOptimization() {
    this.logger.info('MaintenanceEngine', 'Planning Weekly Optimization.');

    this.queueManager.enqueue('MAINTENANCE_GRAPH_OPTIMIZATION', {}, 6); // Lower priority
    this.queueManager.enqueue('MAINTENANCE_DUPLICATE_REEVALUATION', {}, 6);
    this.queueManager.enqueue('MAINTENANCE_SCORE_RECALCULATION', {}, 6);
    this.queueManager.enqueue('MAINTENANCE_ONTOLOGY_REFRESH', {}, 6);
    this.queueManager.enqueue('MAINTENANCE_CRAWLER_STATS_CLEANUP', {}, 6);

    this.logger.info('MaintenanceEngine', 'Weekly Optimization planning complete.');
  }

  /**
   * Plans and enqueues monthly maintenance jobs.
   */
  planMonthlyMaintenance() {
    this.logger.info('MaintenanceEngine', 'Planning Monthly Maintenance.');

    this.queueManager.enqueue('MAINTENANCE_ARCHIVE_LEADS', {}, 7); // Lowest priority
    this.queueManager.enqueue('MAINTENANCE_ARCHIVE_LOGS', {}, 7);
    this.queueManager.enqueue('MAINTENANCE_REBUILD_SUMMARY_TABLES', {}, 7);
    this.queueManager.enqueue('MAINTENANCE_OPTIMIZE_METRICS', {}, 7);
    this.queueManager.enqueue('MAINTENANCE_REFRESH_CONFIG_CACHE', {}, 7);

    this.logger.info('MaintenanceEngine', 'Monthly Maintenance planning complete.');
  }

  // --- Worker Functions for Maintenance Tasks ---

  /**
   * Executes log compression (removes logs older than config days).
   */
  compressLogs() {
    this.logger.info('MaintenanceEngine', 'Executing Log Compression');
    const db = getDatabase();
    const days = getAppConfig().getNumber('MAINTENANCE.CLEANUP_LOGS_DAYS', 30);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const logs = db.findMany('SystemLogs', {});
      const toDelete = logs.filter(log => new Date(log.timestamp) < cutoffDate).map(log => log._id);

      let deleted = 0;
      for (const id of toDelete) {
         db.delete('SystemLogs', id);
         deleted++;
      }
      this.logger.info('MaintenanceEngine', `Compressed/deleted ${deleted} old log entries.`);
    } catch(e) {
      this.logger.error('MaintenanceEngine', 'Failed to compress logs', { error: e.message });
    }
  }

  /**
   * Removes stale checkpoints.
   */
  removeStaleCheckpoints() {
    this.logger.info('MaintenanceEngine', 'Executing Stale Checkpoint Removal');
    const checkpointEngine = getCheckpointEngine();
    const cp = checkpointEngine.loadCheckpoint();
    if (cp) {
       const cpTime = new Date(cp.timestamp).getTime();
       const hoursOld = (new Date().getTime() - cpTime) / (1000 * 60 * 60);
       if (hoursOld > 24) {
          checkpointEngine.clearCheckpoint();
          this.logger.info('MaintenanceEngine', 'Cleared checkpoint older than 24 hours.');
       }
    }
  }

  /**
   * Cleans up temporary data (e.g. Properties cache that isn't standard CacheService).
   */
  cleanupTempData() {
    this.logger.info('MaintenanceEngine', 'Executing Temp Data Cleanup');
    // Implement based on what TarkaX actually uses. Properties cleanup might be risky if we don't know keys.
    // For now, clear any properties that look like temporary chunks.
    const props = PropertiesService.getScriptProperties();
    const keys = props.getKeys();
    let count = 0;
    for (const key of keys) {
      if (key.startsWith('TEMP_CHUNK_') || key.startsWith('LOCK_')) {
         props.deleteProperty(key);
         count++;
      }
    }
    this.logger.info('MaintenanceEngine', `Cleaned ${count} temporary properties.`);
  }

  /**
   * Archives old leads (moves to another sheet or deletes if too old, depending on policy).
   */
  archiveOldLeads() {
    this.logger.info('MaintenanceEngine', 'Executing Lead Archival');
    const db = getDatabase();
    const days = getAppConfig().getNumber('MAINTENANCE.ARCHIVE_LEADS_DAYS', 90);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Simplest implementation: Just mark them as ARCHIVED state or delete
    try {
       const leads = db.findMany('Leads', {});
       const toArchive = leads.filter(lead => new Date(lead.lastUpdated || lead._createdAt) < cutoffDate);

       let count = 0;
       for (const lead of toArchive) {
          // If we had an archive sheet we would move it. For now, we update state if field exists.
          if (lead.state !== 'ARCHIVED') {
             db.update('Leads', lead._id, { state: 'ARCHIVED' });
             count++;
          }
       }
       this.logger.info('MaintenanceEngine', `Archived ${count} old leads.`);
    } catch(e) {
       this.logger.error('MaintenanceEngine', 'Failed to archive leads', { error: e.message });
    }
  }

  /**
   * Archives historical metrics.
   */
  archiveMetrics() {
     this.logger.info('MaintenanceEngine', 'Executing Metrics Archival');
     const db = getDatabase();
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days of metrics history max
     try {
       const history = db.findMany('AutomationMetrics_History', {});
       const toDelete = history.filter(row => new Date(row.timestamp) < cutoffDate).map(row => row.id || row._id);

       let count = 0;
       for (const id of toDelete) {
         db.delete('AutomationMetrics_History', id);
         count++;
       }
       this.logger.info('MaintenanceEngine', `Deleted ${count} old metric records.`);
     } catch (e) {
       this.logger.error('MaintenanceEngine', 'Failed to archive metrics', { error: e.message });
     }
  }

}

// Global Triggers mapping



// Singleton Getter
function getMaintenanceEngine() {
  if (!getMaintenanceEngine.instance) {
    getMaintenanceEngine.instance = new MaintenanceEngine();
  }
  return getMaintenanceEngine.instance;
}


/**
 * Recovery Engine
 *
 * Responsible for restoring execution deterministicly after an expected timeout,
 * or unexpected script crash.
 */

class RecoveryEngine {
  constructor() {
    this.stateManager = getExecutionStateManager();
    this.checkpointEngine = getCheckpointEngine();
    this.queueManager = getQueueManager();
  }

  /**
   * Entry point for resuming an execution from a previous state.
   */
  recoverAndResume() {
    getExecutionLogger().info('RecoveryEngine', 'Start', 'Initiating system recovery.');

    const state = this.stateManager.getState();
    const currentState = state.state;

    // Check if recovery is actually needed
    if (currentState === ENGINE_STATES.IDLE || currentState === ENGINE_STATES.SUCCESS) {
      getExecutionLogger().info('RecoveryEngine', 'Status', `No recovery needed. Current state: ${currentState}`);
      return;
    }

    // Recover stuck RUNNING tasks (script crash)
    if (currentState === ENGINE_STATES.RUNNING) {
      getExecutionLogger().warn('RecoveryEngine', 'CrashDetect', 'Detected unexpected crash (State was RUNNING). Resetting state and recovering stuck tasks.');
      this.queueManager.recoverStuckTasks();
      this.stateManager.transition(ENGINE_STATES.QUEUED);
    }

    // Load checkpoint
    const checkpoint = this.checkpointEngine.loadCheckpoint();
    if (checkpoint) {
      getExecutionLogger().info('RecoveryEngine', 'CheckpointLoaded', `Restoring cursor: Page ${checkpoint.pageNumber}, Offset ${checkpoint.offset}`);
      this.queueManager.setPointer(checkpoint.cursor, checkpoint.pageNumber, checkpoint.offset);
    } else {
      getExecutionLogger().warn('RecoveryEngine', 'NoCheckpoint', 'No checkpoint found during recovery. Restarting queue from beginning.');
      this.queueManager.clearPointer();
    }

    // Transition state and hand off to the main execution engine
    this.stateManager.transition(ENGINE_STATES.RESUME);

    // Call the main engine loop (will be defined in ExecutionEngine.gs)
    const engine = getExecutionEngine();
    engine.start();
  }
}

// Singleton getter
function getRecoveryEngine() {
  if (!getRecoveryEngine.instance) {
    getRecoveryEngine.instance = new RecoveryEngine();
  }
  return getRecoveryEngine.instance;
}


/**
 * Self-Healing Engine
 *
 * Automatically repairs systemic issues detected by the Health Monitor
 * or execution exceptions. Resolves missing sheets, missing triggers,
 * stuck queues, retry storms, and manages the Watchdog.
 */

class SelfHealingEngine {
  constructor() {
    this.logger = getSystemLog();
    this.db = getDatabase();
    this.config = getAppConfig();
  }

  /**
   * Executes a full self-healing scan and repair cycle.
   */
  heal() {
    this.logger.info('SelfHealingEngine', 'Starting self-healing cycle.');

    try {
      this._repairTriggers();
      this._repairSheets();
      this._repairCache();
      this._repairIndexes();
      this._repairQueue();
      this.logger.info('SelfHealingEngine', 'Self-healing cycle completed.');
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Failed to complete self-healing cycle.', { error: e.message });
    }
  }

  /**
   * Rebuilds any missing essential triggers.
   */
  _repairTriggers() {
    const triggerManager = getTriggerManager();
    triggerManager.rebuildMissingTriggers();
  }

  /**
   * Re-initializes core database schemas if missing.
   */
  _repairSheets() {
    try {
      // getDatabase automatically triggers initialization if sheets are missing
      const db = getDatabase();
      db.initialize();
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Failed to repair sheets.', { error: e.message });
    }
  }

  /**
   * Clears completely corrupted cache or performs basic tests.
   */
  _repairCache() {
    try {
      const cache = CacheService.getScriptCache();
      cache.put('HealthTest', 'OK', 60);
      const result = cache.get('HealthTest');
      if (result !== 'OK') {
        this.logger.warn('SelfHealingEngine', 'Cache validation failed. Waiting for Google Apps Script to auto-recover cache.');
      }
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Error during cache repair test.', { error: e.message });
    }
  }

  /**
   * Requests Graph Index rebuild if corrupted.
   */
  _repairIndexes() {
    try {
       const indexManager = getGraphIndexManager();
       // This will rebuild cache from sheets if memory is empty
       indexManager.buildIndexes();
    } catch (e) {
       this.logger.error('SelfHealingEngine', 'Failed to repair indexes.', { error: e.message });
    }
  }

  /**
   * Fixes stuck running tasks or excessive retry storms.
   */
  _repairQueue() {
    try {
      const queueManager = getQueueManager();
      queueManager.recoverStuckTasks();

      const retryStormThreshold = this.config.getNumber('AUTOMATION.RETRY_STORM_THRESHOLD', 50);
      const retryTasks = this.db.findMany('Queue', { status: 'RETRY' });

      if (retryTasks.length > retryStormThreshold) {
         this.logger.warn('SelfHealingEngine', `Detected retry storm (${retryTasks.length} tasks). Downgrading priorities.`);
         // Optionally lower priority of failing tasks to let new work pass
      }
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Failed to repair queue.', { error: e.message });
    }
  }
}

/**
 * Execution Watchdog
 *
 * Supervisor that runs alongside or around execution cycles to detect
 * runaway loops, high failure rates, and forced timeouts.
 */
class ExecutionWatchdog {
  constructor() {
    this.logger = getSystemLog();
    this.stateManager = getExecutionStateManager();
    this.timeoutManager = getTimeoutManager();
  }

  /**
   * Inspects the current execution state and context.
   * If limits are exceeded, forces a safe termination.
   */
  monitorAndEnforce() {
    const state = this.stateManager.getState();

    // 1. Check for Stuck State
    if (state.state === 'RUNNING') {
      const startTime = new Date(state.startTime).getTime();
      const now = new Date().getTime();
      const runDurationMins = (now - startTime) / (1000 * 60);

      const maxExecMins = getAppConfig().getNumber('AUTOMATION.MAX_EXECUTION_TIME_MINUTES', 5);

      if (runDurationMins > maxExecMins + 1) { // 1 min buffer over max
         this.logger.error('ExecutionWatchdog', `Runaway execution detected. Module ${state.currentModule} running for ${runDurationMins.toFixed(1)} mins.`);
         this.forceTermination('Runaway execution limit exceeded.');
      }
    }

    // 2. Check Timeout Safety (rely on TimeoutManager primarily, but watchdog acts as a safety net)
    this.timeoutManager.checkAndHaltIfNeeded(10000); // Tighter buffer for watchdog
  }

  /**
   * Forcibly halts the current execution and saves a checkpoint.
   */
  forceTermination(reason) {
    this.logger.warn('ExecutionWatchdog', `Forcing termination. Reason: ${reason}`);

    // Transition state
    this.stateManager.transition('CHECKPOINT');

    // Attempt standard timeout manager continuation
    try {
      this.timeoutManager.checkAndHaltIfNeeded(60000); // force a trigger creation
    } catch (e) {
      if (e.name === 'TimeoutError') {
        throw e; // expected
      }
    }

    // Hard throw if timeout manager didn't
    throw new Error(`ExecutionWatchdog Termination: ${reason}`);
  }
}

// Singleton getters
function getSelfHealingEngine() {
  if (!getSelfHealingEngine.instance) {
    getSelfHealingEngine.instance = new SelfHealingEngine();
  }
  return getSelfHealingEngine.instance;
}

function getExecutionWatchdog() {
  if (!getExecutionWatchdog.instance) {
    getExecutionWatchdog.instance = new ExecutionWatchdog();
  }
  return getExecutionWatchdog.instance;
}


/**
 * Main Execution Engine
 *
 * Acts as the lightweight operating system for TarkaX.
 * Orchestrates the execution loop:
 * Queue -> Dispatcher -> Task -> Checkpoint -> Timeout Check -> Loop
 */

class ExecutionEngine {
  constructor() {
    this.stateManager = getExecutionStateManager();
    this.queueManager = getQueueManager();
    this.dispatcher = getTaskDispatcher();
    this.checkpointEngine = getCheckpointEngine();
    this.timeoutManager = getTimeoutManager();
  }

  /**
   * Starts the main execution loop.
   */
  start() {
    getExecutionLogger().info('ExecutionEngine', 'Start', 'Starting execution engine loop.');

    // Distributed Lock: Prevent duplicate concurrent runs of the engine
    const lock = DistributedLockManager.acquire(30000, 'SCRIPT');
    if (!lock) {
      getExecutionLogger().warn('ExecutionEngine', 'Start', 'Failed to acquire script lock. Another execution is likely running. Exiting.');
      return;
    }

    try {
      this.stateManager.transition(ENGINE_STATES.RUNNING);

      let hasMoreTasks = true;
      while (hasMoreTasks) {
        // 1. Check Timeout before starting a new batch
        this.timeoutManager.checkAndHaltIfNeeded(15000); // Need at least 15s to safely process a task

        // Watchdog enforcement
        try {
           if (typeof getExecutionWatchdog === 'function') {
              getExecutionWatchdog().monitorAndEnforce();
           }
        } catch (e) {
           // If watchdog throws, it means it's forcing termination
           throw e;
        }

        // 2. Fetch Tasks
        const tasks = this.queueManager.getNextBatch(5); // Process in small batches
        if (tasks.length === 0) {
          getExecutionLogger().info('ExecutionEngine', 'Loop', 'No more tasks in queue.');
          hasMoreTasks = false;
          break;
        }

        // 3. Process Batch
        for (const task of tasks) {
          this.timeoutManager.checkAndHaltIfNeeded(10000);
          this._processTask(task);
        }

        // 4. Batch Checkpoint
        // Save progress after every batch to survive a crash during the next batch
        this.checkpointEngine.saveCheckpoint({
            currentModule: 'ExecutionEngine',
            currentTask: 'BATCH_COMPLETE'
        });
      }

      // Execution finished successfully
      this._handleSuccess();

    } catch (e) {
      if (e instanceof TimeoutError) {
        // Expected halt, state is already managed by TimeoutManager
        getExecutionLogger().info('ExecutionEngine', 'Halt', 'Execution engine paused for continuation.');
      } else {
        // Unexpected crash
        this.stateManager.transition(ENGINE_STATES.FAILED);
        getExecutionLogger().error('ExecutionEngine', 'Crash', 'Engine crashed unexpectedly.', e);
      }
    } finally {
      DistributedLockManager.release(lock);
      getExecutionLogger().info('ExecutionEngine', 'End', 'Execution engine loop ended.');
    }
  }

  /**
   * Processes a single task from the queue.
   */
  _processTask(task) {
    getExecutionLogger().debug('ExecutionEngine', 'ProcessTask', `Processing task ID: ${task._id}`, { type: task.taskType });

    try {
      this.queueManager.markRunning(task._id);

      // Setup dynamic context for timeout manager
      this.timeoutManager.updateContext({
        currentTask: task._id,
        currentModule: task.taskType
      });

      // Execute via dispatcher wrapped in RetryEngine
      const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;

      let result = null;
      RetryEngine.execute(() => {
         result = this.dispatcher.executeTask(task.taskType, payload);
      }, { operationName: `Task Execution: ${task.taskType}` });

      // Handle structured results from modular engines (e.g., DiscoveryEngine)
      if (result && typeof result === 'object' && result.status) {
        if (result.status === 'CONTINUE') {
           getExecutionLogger().info('ExecutionEngine', 'ProcessTask', `Task ${task._id} returning CONTINUE for next state: ${result.nextState}`);

           // Allow the specific engine to handle its own checkpoint if it exports a global getter, otherwise fallback
           if (result.payload) {
              const engineGetterName = 'get' + task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1).toLowerCase() + 'Engine';
              try {
                if (typeof globalThis[engineGetterName] === 'function') {
                   const engineInstance = globalThis[engineGetterName]();
                   if (typeof engineInstance.checkpoint === 'function') {
                      engineInstance.checkpoint(result.payload);
                   }
                }
              } catch (ignored) {}

              // Fallback central checkpoint just in case
              this.checkpointEngine.saveCheckpoint({
                 currentTask: result.nextState,
                 currentModule: task.taskType,
                 apiState: result.payload
              });
           }

           // Re-queue the continuation
           this.queueManager.enqueue(task.taskType, result.payload || {}, task.priority || 1);

           // Mark the original slice as success since we queued the continuation
           this.queueManager.markSuccess(task._id);

           // Check timeout immediately after a state transition since some states are heavy
           this.timeoutManager.checkAndHaltIfNeeded(15000);

        } else if (result.status === 'FAILED') {
           getExecutionLogger().error('ExecutionEngine', 'ProcessTask', `Task ${task._id} returned FAILED`, result.reason);
           this.queueManager.markFailed(task, new Error(result.reason || 'Task returned FAILED status'));
        } else {
           // COMPLETED or unknown success status
           this.queueManager.markSuccess(task._id);
           getExecutionLogger().info('ExecutionEngine', 'ProcessTask', `Task ${task._id} completed successfully with status: ${result.status}`);
        }
      } else {
        // Legacy/unstructured task response
        this.queueManager.markSuccess(task._id);
        getExecutionLogger().info('ExecutionEngine', 'ProcessTask', `Task ${task._id} completed successfully.`);
      }

    } catch (error) {
      getExecutionLogger().error('ExecutionEngine', 'ProcessTask', `Error processing task ${task._id}`, error);
      // Let the QueueManager handle retries vs permanent failure marking
      this.queueManager.markFailed(task, error);
    }
  }

  /**
   * Handles a clean finish of the queue.
   */
  _handleSuccess() {
    this.stateManager.transition(ENGINE_STATES.SUCCESS);
    this.stateManager.clearState();
    this.checkpointEngine.clearCheckpoint();
    this.queueManager.clearPointer();
    getExecutionLogger().info('ExecutionEngine', 'Success', 'All tasks completed. Engine state cleared.');
  }
}

// Global Entry point for daily scheduled runs (Legacy, now mapped to AutomationEngine)

// Singleton getter
function getExecutionEngine() {
  if (!getExecutionEngine.instance) {
    getExecutionEngine.instance = new ExecutionEngine();
  }
  return getExecutionEngine.instance;
}



/******************************************************************
DISCOVERY ENGINE
******************************************************************/

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



/******************************************************************
AI PROVIDER
******************************************************************/

/**
 * AI Provider Abstraction
 *
 * Defines the contract for all AI interactions within the system.
 * This guarantees the system is not hard-coupled to any specific LLM provider.
 */

class AIProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generates a single text completion or structured output based on a prompt.
   * @param {string} prompt - The prompt to send to the LLM.
   * @param {Object} [options={}] - Provider-specific options (temperature, max_tokens, etc.).
   * @returns {string} The generated response text.
   */
  generate(prompt, options = {}) {
    throw new Error('Method "generate()" must be implemented by the subclass.');
  }

  /**
   * Engages in a multi-turn conversation.
   * @param {Array<Object>} messages - Array of message objects (e.g., {role: 'user', content: '...'}).
   * @param {Object} [options={}] - Options.
   * @returns {string} The assistant's response.
   */
  chat(messages, options = {}) {
    throw new Error('Method "chat()" must be implemented by the subclass.');
  }

  /**
   * Simpler completion method, potentially used for fast inline completions.
   * @param {string} text - Input text.
   * @returns {string} Completed text.
   */
  complete(text) {
    throw new Error('Method "complete()" must be implemented by the subclass.');
  }

  /**
   * Embeds text into vector representation if supported.
   * @param {string} text - Text to embed.
   * @returns {Array<number>} Vector embedding.
   */
  embed(text) {
     throw new Error('Method "embed()" must be implemented by the subclass.');
  }

  /**
   * Verifies the provider is reachable and credentials are valid.
   * @returns {boolean} True if healthy.
   */
  health() {
    throw new Error('Method "health()" must be implemented by the subclass.');
  }

  /**
   * Generates a matrix of enterprise search concepts.
   * Designed specifically for the Discovery Engine.
   * @param {Object} context - The context for generation (e.g., industry, role).
   * @returns {Array<Object>} Array of search concepts.
   */
  generateSearchMatrix(context = {}) {
    throw new Error('Method "generateSearchMatrix()" must be implemented by the subclass.');
  }

  /**
   * Generates raw boolean search queries based on concepts.
   * Designed specifically for the Discovery Engine.
   * @param {Array<string>} concepts - Concepts to turn into queries.
   * @param {Object} parameters - Parameters for boolean generation.
   * @returns {Array<string>} Array of boolean strings.
   */
  generateBooleanQueries(concepts, parameters = {}) {
    throw new Error('Method "generateBooleanQueries()" must be implemented by the subclass.');
  }
}


/**
 * Gemini Provider Implementation
 *
 * Implements the AIProvider contract for Google's Gemini models.
 * Uses the standard REST API via UrlFetchApp (HttpClient).
 */

class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.logger = AppLogger.getLogger('GeminiProvider');
    this.httpClient = new HttpClient();

    // Resolve configuration with fallbacks
    this.apiKey = config.API_KEY || getAppConfig().get('AI.API_KEY');
    this.baseUrl = config.BASE_URL || getAppConfig().get('AI.BASE_URL', 'https://generativelanguage.googleapis.com/v1beta');
    this.model = config.MODEL || getAppConfig().get('AI.MODEL', 'gemini-2.5-flash');
    this.temperature = config.TEMPERATURE !== undefined ? config.TEMPERATURE : getAppConfig().getNumber('AI.TEMPERATURE', 0.2);
    this.maxTokens = config.MAX_TOKENS || getAppConfig().getNumber('AI.MAX_TOKENS', 4096);
    this.timeoutMs = config.TIMEOUT_MS || getAppConfig().getNumber('AI.TIMEOUT_MS', 30000);

    if (!this.apiKey) {
      throw new ConfigurationError('Gemini API Key is missing.');
    }
  }

  /**
   * Helper to construct the full API URL for a given operation
   */
  _buildUrl(operation) {
    return `${this.baseUrl}/models/${this.model}:${operation}?key=${this.apiKey}`;
  }

  /**
   * Cleans backticks and markdown formatting from JSON output
   */
  _extractJson(text) {
    if (!text) return "";
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  generate(prompt, options = {}) {
    Validation.assertString(prompt, 'Prompt');

    const url = this._buildUrl('generateContent');
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature !== undefined ? options.temperature : this.temperature,
        maxOutputTokens: options.maxTokens !== undefined ? options.maxTokens : this.maxTokens
      }
    };

    if (options.responseMimeType) {
        payload.generationConfig.responseMimeType = options.responseMimeType;
    }

    try {
      const response = this.httpClient.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });

      const data = JSON.parse(response.text);
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      return '';
    } catch (e) {
      this.logger.error('GeminiProvider', 'Generate', 'Failed to generate content', e);
      throw e;
    }
  }

  chat(messages, options = {}) {
    Validation.assertArray(messages, 'Messages');

    const url = this._buildUrl('generateContent');

    // Map abstract role to Gemini role
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: options.temperature !== undefined ? options.temperature : this.temperature,
        maxOutputTokens: options.maxTokens !== undefined ? options.maxTokens : this.maxTokens
      }
    };

    try {
      const response = this.httpClient.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });

      const data = JSON.parse(response.text);
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      return '';
    } catch (e) {
      this.logger.error('GeminiProvider', 'Chat', 'Failed to chat', e);
      throw e;
    }
  }

  complete(text) {
    return this.generate(text);
  }

  embed(text) {
    // Basic embedding if needed later (uses text-embedding-004 generally)
    throw new Error('Method "embed()" not implemented in this version of GeminiProvider.');
  }

  health() {
    try {
      // Just request a tiny completion to check API key and reachability
      const url = this._buildUrl('generateContent');
      const payload = {
        contents: [{ parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 5 }
      };
      const response = this.httpClient.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });
      return response.status === 200;
    } catch (e) {
      this.logger.warn('GeminiProvider', 'Health', 'Health check failed', e);
      return false;
    }
  }

  generateSearchMatrix(context = {}) {
    const prompt = `
      You are an expert Enterprise AI Search Specialist.
      Generate a matrix of high-value search concepts to discover companies struggling with AI implementation or showing strong buying intent for AI transformation.

      Context parameters:
      Industry: ${context.industry || 'Any'}
      Target Roles: ${context.roles ? context.roles.join(', ') : 'Any Executive'}
      Focus: ${context.focus || 'AI pain points and adoption'}

      Respond strictly in JSON format matching this structure:
      [
        {
          "concept": "Name of concept",
          "category": "Pain Point | Transformation | Hiring | Tooling",
          "keywords": ["keyword 1", "keyword 2"]
        }
      ]
    `;

    const rawResponse = this.generate(prompt, { responseMimeType: 'application/json' });
    const jsonString = this._extractJson(rawResponse);

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      this.logger.error('GeminiProvider', 'GenerateSearchMatrix', 'Failed to parse JSON', e);
      return [];
    }
  }

  generateBooleanQueries(concepts, parameters = {}) {
    const prompt = `
      You are an expert in Boolean search strings for enterprise sales prospecting and OSINT.
      Create complex, precise Boolean queries using the provided concepts.
      Include operators like AND, OR, site:, intitle:, intext: where appropriate.

      Concepts:
      ${concepts.join(', ')}

      Requirements:
      - Max ${parameters.count || 5} queries.
      - Return ONLY a JSON array of strings. No markdown, no explanation.

      Example output:
      ["(AI OR LLM) AND \\"failed project\\" site:linkedin.com/in", "intitle:\\"Director of AI\\" (compliance OR risk)"]
    `;

    const rawResponse = this.generate(prompt, { responseMimeType: 'application/json' });
    const jsonString = this._extractJson(rawResponse);

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      this.logger.error('GeminiProvider', 'GenerateBooleanQueries', 'Failed to parse JSON', e);
      return [];
    }
  }
}

// Global factory for standard DI pattern
function getAIProvider() {
  if (!getAIProvider.instance) {
    const providerName = getAppConfig().get('AI.PROVIDER', 'gemini').toLowerCase();

    if (providerName === 'gemini') {
      getAIProvider.instance = new GeminiProvider();
    } else {
      throw new ConfigurationError(`Unknown AI Provider specified: ${providerName}`);
    }
  }
  return getAIProvider.instance;
}


/**
 * AI Pain Ontology Engine
 *
 * Provides a highly structured, hierarchical ontology of enterprise AI adoption pain points.
 * Includes a semantic matching engine to identify these signals from unstructured text.
 */

class AIPainOntologyEngine {
  constructor() {
    this.ontology = [
    {
        "id": "PAIN-001",
        "canonicalName": "Lack of AI Vision",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Stalled Growth",
        "synonyms": [
            "no ai vision",
            "lack of ai strategy",
            "missing ai roadmap",
            "without ai plan",
            "don't have an ai strategy"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no ai vision",
            "lack of ai strategy",
            "missing ai roadmap",
            "without ai plan",
            "don't have an ai strategy"
        ],
        "negativeKeywords": [
            "have a vision",
            "vision is clear"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-002",
        "canonicalName": "Misaligned AI Goals",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Resources",
        "synonyms": [
            "goals don't align",
            "misaligned objectives",
            "not aligned with business",
            "ai projects disjointed"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "goals don't align",
            "misaligned objectives",
            "not aligned with business",
            "ai projects disjointed"
        ],
        "negativeKeywords": [
            "perfectly aligned"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-003",
        "canonicalName": "No AI Roadmap",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Delayed Adoption",
        "synonyms": [
            "no roadmap",
            "missing roadmap",
            "lack of roadmap",
            "don't have a roadmap",
            "roadmap is undefined"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no roadmap",
            "missing roadmap",
            "lack of roadmap",
            "don't have a roadmap",
            "roadmap is undefined"
        ],
        "negativeKeywords": [
            "roadmap in place",
            "clear roadmap"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-004",
        "canonicalName": "Unclear AI Value Proposition",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Low Investment",
        "synonyms": [
            "unclear value",
            "struggle to see value",
            "roi is unclear",
            "what is the value of ai"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unclear value",
            "struggle to see value",
            "roi is unclear",
            "what is the value of ai"
        ],
        "negativeKeywords": [
            "value is obvious",
            "clear roi"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-005",
        "canonicalName": "No AI Committee",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Fragmented Decision Making",
        "synonyms": [
            "no ai committee",
            "lack of steering committee",
            "no governance board"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no ai committee",
            "lack of steering committee",
            "no governance board"
        ],
        "negativeKeywords": [
            "committee established"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-006",
        "canonicalName": "Unclear AI Ownership",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Accountability Gap",
        "synonyms": [
            "who owns ai",
            "unclear ownership",
            "nobody owns ai",
            "lack of owner"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "who owns ai",
            "unclear ownership",
            "nobody owns ai",
            "lack of owner"
        ],
        "negativeKeywords": [
            "clear owner",
            "ownership established"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-007",
        "canonicalName": "Missing AI Policies",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Compliance Risk",
        "synonyms": [
            "no ai policy",
            "missing policies",
            "lack of guidelines",
            "no ai rules"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no ai policy",
            "missing policies",
            "lack of guidelines",
            "no ai rules"
        ],
        "negativeKeywords": [
            "policies in place",
            "strict policies"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-008",
        "canonicalName": "Inconsistent AI Guidelines",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Confusion",
        "synonyms": [
            "inconsistent guidelines",
            "conflicting rules",
            "unclear guidelines",
            "vagueness in ai policy"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inconsistent guidelines",
            "conflicting rules",
            "unclear guidelines",
            "vagueness in ai policy"
        ],
        "negativeKeywords": [
            "clear guidelines"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-009",
        "canonicalName": "Data Leakage to LLMs",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "Data Breach",
        "synonyms": [
            "data leakage",
            "leaking data",
            "sensitive data exposed",
            "pii in chatgpt",
            "sending pii to llm"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "data leakage",
            "leaking data",
            "sensitive data exposed",
            "pii in chatgpt",
            "sending pii to llm"
        ],
        "negativeKeywords": [
            "secured data",
            "no leakage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-010",
        "canonicalName": "Prompt Injection Vulnerability",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Security Breach",
        "synonyms": [
            "prompt injection",
            "jailbreak",
            "injection attack",
            "malicious prompt"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "prompt injection",
            "jailbreak",
            "injection attack",
            "malicious prompt"
        ],
        "negativeKeywords": [
            "protected against injection",
            "injection blocked"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-011",
        "canonicalName": "Unsecured AI Endpoints",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Unauthorized Access",
        "synonyms": [
            "unsecured endpoint",
            "open ai api",
            "exposed api keys",
            "no auth on model"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unsecured endpoint",
            "open ai api",
            "exposed api keys",
            "no auth on model"
        ],
        "negativeKeywords": [
            "secured endpoints",
            "auth in place"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-012",
        "canonicalName": "Model Poisoning Risk",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Compromised AI",
        "synonyms": [
            "model poisoning",
            "data poisoning",
            "corrupted training data",
            "adversarial attack"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "model poisoning",
            "data poisoning",
            "corrupted training data",
            "adversarial attack"
        ],
        "negativeKeywords": [
            "poisoning defense"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-013",
        "canonicalName": "GDPR Violations via AI",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "Fines",
        "synonyms": [
            "gdpr violation",
            "violating gdpr",
            "not gdpr compliant",
            "ai privacy issues",
            "breaching gdpr"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "gdpr violation",
            "violating gdpr",
            "not gdpr compliant",
            "ai privacy issues",
            "breaching gdpr"
        ],
        "negativeKeywords": [
            "gdpr compliant"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-014",
        "canonicalName": "Copyright Infringement Risk",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Legal Action",
        "synonyms": [
            "copyright infringement",
            "ip theft",
            "plagiarized content",
            "using copyrighted data"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "copyright infringement",
            "ip theft",
            "plagiarized content",
            "using copyrighted data"
        ],
        "negativeKeywords": [
            "ip cleared",
            "no copyright issues"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-015",
        "canonicalName": "Lack of AI Auditability",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Regulatory Failure",
        "synonyms": [
            "cannot audit ai",
            "black box",
            "no audit trail",
            "unexplainable ai"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "cannot audit ai",
            "black box",
            "no audit trail",
            "unexplainable ai"
        ],
        "negativeKeywords": [
            "fully auditable",
            "audit trail exists"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-016",
        "canonicalName": "Regulatory Non-compliance",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Legal Fines",
        "synonyms": [
            "non-compliant",
            "regulatory issues",
            "failing compliance",
            "eu ai act violation"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "non-compliant",
            "regulatory issues",
            "failing compliance",
            "eu ai act violation"
        ],
        "negativeKeywords": [
            "fully compliant"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-017",
        "canonicalName": "Stalled AI PoCs",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Wasted Investment",
        "synonyms": [
            "stalled poc",
            "poc stuck",
            "proof of concept going nowhere",
            "pilot stuck"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stalled poc",
            "poc stuck",
            "proof of concept going nowhere",
            "pilot stuck"
        ],
        "negativeKeywords": [
            "poc successful",
            "pilot completed"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-018",
        "canonicalName": "Low AI Usage Rates",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor ROI",
        "synonyms": [
            "low usage",
            "nobody is using",
            "low adoption",
            "poor adoption metrics"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low usage",
            "nobody is using",
            "low adoption",
            "poor adoption metrics"
        ],
        "negativeKeywords": [
            "high usage",
            "wide adoption"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-019",
        "canonicalName": "Resistance to AI Tools",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Cultural Friction",
        "synonyms": [
            "pushback",
            "resistance to ai",
            "employees hate ai",
            "refusing to use"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "pushback",
            "resistance to ai",
            "employees hate ai",
            "refusing to use"
        ],
        "negativeKeywords": [
            "embracing ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-020",
        "canonicalName": "Failed AI Rollouts",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Lost Credibility",
        "synonyms": [
            "failed rollout",
            "botched launch",
            "unsuccessful deployment",
            "disastrous rollout"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "failed rollout",
            "botched launch",
            "unsuccessful deployment",
            "disastrous rollout"
        ],
        "negativeKeywords": [
            "successful rollout"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-021",
        "canonicalName": "Fear of AI Job Loss",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Low Morale",
        "synonyms": [
            "fear of job loss",
            "ai taking jobs",
            "job security fears",
            "anxious about ai"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "fear of job loss",
            "ai taking jobs",
            "job security fears",
            "anxious about ai"
        ],
        "negativeKeywords": [
            "excited about ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-022",
        "canonicalName": "AI Skepticism",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Slow Adoption",
        "synonyms": [
            "ai skeptic",
            "don't trust ai",
            "skeptical of results",
            "ai is hype"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ai skeptic",
            "don't trust ai",
            "skeptical of results",
            "ai is hype"
        ],
        "negativeKeywords": [
            "believe in ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-023",
        "canonicalName": "Lack of AI Trust",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Manual Workarounds",
        "synonyms": [
            "don't trust the model",
            "lack of trust",
            "distrust ai",
            "no confidence in ai"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "don't trust the model",
            "lack of trust",
            "distrust ai",
            "no confidence in ai"
        ],
        "negativeKeywords": [
            "fully trust"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-024",
        "canonicalName": "Siloed AI Knowledge",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "siloed knowledge",
            "only one guy knows",
            "bottlenecked knowledge",
            "knowledge hoarding"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed knowledge",
            "only one guy knows",
            "bottlenecked knowledge",
            "knowledge hoarding"
        ],
        "negativeKeywords": [
            "shared knowledge"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-025",
        "canonicalName": "Unsanctioned ChatGPT Usage",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Data Risk",
        "synonyms": [
            "unsanctioned chatgpt",
            "using chatgpt on personal",
            "shadow ai",
            "rogue chatgpt"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unsanctioned chatgpt",
            "using chatgpt on personal",
            "shadow ai",
            "rogue chatgpt"
        ],
        "negativeKeywords": [
            "banned shadow ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-026",
        "canonicalName": "Hidden AI SaaS Costs",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Overrun",
        "synonyms": [
            "hidden costs",
            "surprise bills",
            "shadow spend",
            "untracked saas"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hidden costs",
            "surprise bills",
            "shadow spend",
            "untracked saas"
        ],
        "negativeKeywords": [
            "costs optimized"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-027",
        "canonicalName": "Untracked AI Workloads",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Resource Waste",
        "synonyms": [
            "untracked workloads",
            "hidden compute",
            "rogue servers",
            "unknown models"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "untracked workloads",
            "hidden compute",
            "rogue servers",
            "unknown models"
        ],
        "negativeKeywords": [
            "fully tracked"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-028",
        "canonicalName": "Rogue AI Deployments",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Security Risk",
        "synonyms": [
            "rogue deployment",
            "unapproved models",
            "shadow deployments"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rogue deployment",
            "unapproved models",
            "shadow deployments"
        ],
        "negativeKeywords": [
            "approved only"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-029",
        "canonicalName": "Broken AI Workflows",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Process Failure",
        "synonyms": [
            "broken workflow",
            "ai workflow failing",
            "automation stopped",
            "workflow breaks"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "broken workflow",
            "ai workflow failing",
            "automation stopped",
            "workflow breaks"
        ],
        "negativeKeywords": [
            "seamless workflow"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-030",
        "canonicalName": "Manual Handoffs",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "manual handoff",
            "human in the loop bottleneck",
            "swivel chair integration",
            "manual copy paste"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual handoff",
            "human in the loop bottleneck",
            "swivel chair integration",
            "manual copy paste"
        ],
        "negativeKeywords": [
            "fully automated"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-031",
        "canonicalName": "Brittle RPA Integration",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "High Maintenance",
        "synonyms": [
            "brittle rpa",
            "bot breaks",
            "fragile bots",
            "rpa failing"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "brittle rpa",
            "bot breaks",
            "fragile bots",
            "rpa failing"
        ],
        "negativeKeywords": [
            "robust automation"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-032",
        "canonicalName": "Inefficient Task Routing",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Slow Processing",
        "synonyms": [
            "inefficient routing",
            "poor routing",
            "tasks sent to wrong person"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inefficient routing",
            "poor routing",
            "tasks sent to wrong person"
        ],
        "negativeKeywords": [
            "smart routing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-033",
        "canonicalName": "Poor Prompt Quality",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Low Output Quality",
        "synonyms": [
            "poor prompt",
            "bad prompt",
            "garbage prompt",
            "ineffective prompt"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor prompt",
            "bad prompt",
            "garbage prompt",
            "ineffective prompt"
        ],
        "negativeKeywords": [
            "great prompt"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-034",
        "canonicalName": "Inconsistent Prompt Results",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Unreliable Output",
        "synonyms": [
            "inconsistent results",
            "flaky output",
            "random responses",
            "non-deterministic"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inconsistent results",
            "flaky output",
            "random responses",
            "non-deterministic"
        ],
        "negativeKeywords": [
            "consistent results"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-035",
        "canonicalName": "Lack of Prompt Standards",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Confusion",
        "synonyms": [
            "no prompt standards",
            "everyone prompts differently",
            "missing best practices"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no prompt standards",
            "everyone prompts differently",
            "missing best practices"
        ],
        "negativeKeywords": [
            "standardized prompts"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-036",
        "canonicalName": "High Prompt Iteration Time",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lost Productivity",
        "synonyms": [
            "takes forever to prompt",
            "too much time prompting",
            "endless tweaking",
            "prompt hacking"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "takes forever to prompt",
            "too much time prompting",
            "endless tweaking",
            "prompt hacking"
        ],
        "negativeKeywords": [
            "quick prompting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-037",
        "canonicalName": "Lost Prompts",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Lost IP",
        "synonyms": [
            "lost prompts",
            "where did the prompt go",
            "forgot the prompt",
            "cannot find prompt"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lost prompts",
            "where did the prompt go",
            "forgot the prompt",
            "cannot find prompt"
        ],
        "negativeKeywords": [
            "prompt library"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-038",
        "canonicalName": "No Prompt Versioning",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Regression",
        "synonyms": [
            "no versioning",
            "overwrote prompt",
            "lost previous prompt",
            "prompt regression"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no versioning",
            "overwrote prompt",
            "lost previous prompt",
            "prompt regression"
        ],
        "negativeKeywords": [
            "version controlled"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-039",
        "canonicalName": "Hardcoded Prompts",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Brittle Code",
        "synonyms": [
            "hardcoded prompt",
            "prompts in code",
            "difficult to update prompt",
            "baked in prompt"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hardcoded prompt",
            "prompts in code",
            "difficult to update prompt",
            "baked in prompt"
        ],
        "negativeKeywords": [
            "dynamic prompts"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-040",
        "canonicalName": "Unshared Prompt Libraries",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Duplication",
        "synonyms": [
            "unshared prompts",
            "personal prompt library",
            "can't access prompts",
            "siloed prompts"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unshared prompts",
            "personal prompt library",
            "can't access prompts",
            "siloed prompts"
        ],
        "negativeKeywords": [
            "shared library"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-041",
        "canonicalName": "Lack of MLOps",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Slow Deployment",
        "synonyms": [
            "no mlops",
            "missing mlops",
            "lack of model ops",
            "poor ops practices"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no mlops",
            "missing mlops",
            "lack of model ops",
            "poor ops practices"
        ],
        "negativeKeywords": [
            "mature mlops"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-042",
        "canonicalName": "Manual Model Deployment",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "High Risk",
        "synonyms": [
            "manual deployment",
            "deploying by hand",
            "no ci/cd for models",
            "painful deployments"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual deployment",
            "deploying by hand",
            "no ci/cd for models",
            "painful deployments"
        ],
        "negativeKeywords": [
            "automated deployment"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-043",
        "canonicalName": "No AI Pipeline Automation",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "no pipeline",
            "manual pipeline",
            "broken pipeline",
            "lack of automation"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no pipeline",
            "manual pipeline",
            "broken pipeline",
            "lack of automation"
        ],
        "negativeKeywords": [
            "automated pipeline"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-044",
        "canonicalName": "Operational Silos",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Friction",
        "synonyms": [
            "operational silos",
            "dev throws over wall",
            "data science vs engineering",
            "ops silos"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "operational silos",
            "dev throws over wall",
            "data science vs engineering",
            "ops silos"
        ],
        "negativeKeywords": [
            "devops aligned"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-045",
        "canonicalName": "High Token Latency",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Poor UX",
        "synonyms": [
            "high latency",
            "slow response",
            "takes too long to generate",
            "laggy llm"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high latency",
            "slow response",
            "takes too long to generate",
            "laggy llm"
        ],
        "negativeKeywords": [
            "low latency",
            "fast response"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-046",
        "canonicalName": "GPU Scarcity",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Stalled Dev",
        "synonyms": [
            "gpu scarcity",
            "can't get gpus",
            "no h100s",
            "waiting for compute",
            "gpu shortage"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "gpu scarcity",
            "can't get gpus",
            "no h100s",
            "waiting for compute",
            "gpu shortage"
        ],
        "negativeKeywords": [
            "plenty of gpus"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-047",
        "canonicalName": "Inflexible LLM Hosting",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Vendor Lock-in",
        "synonyms": [
            "inflexible hosting",
            "stuck on one cloud",
            "can't move models",
            "hosting challenges"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inflexible hosting",
            "stuck on one cloud",
            "can't move models",
            "hosting challenges"
        ],
        "negativeKeywords": [
            "multi-cloud"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-048",
        "canonicalName": "Compute Cost Overruns",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "Budget Crisis",
        "synonyms": [
            "cost overrun",
            "insane cloud bill",
            "gpu costs out of control",
            "burning cash on compute"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "cost overrun",
            "insane cloud bill",
            "gpu costs out of control",
            "burning cash on compute"
        ],
        "negativeKeywords": [
            "costs controlled"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-049",
        "canonicalName": "AI Hallucinations",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Lost Trust",
        "synonyms": [
            "hallucination",
            "making things up",
            "spitting out garbage",
            "fake facts",
            "model lies"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hallucination",
            "making things up",
            "spitting out garbage",
            "fake facts",
            "model lies"
        ],
        "negativeKeywords": [
            "grounded",
            "factually accurate"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-050",
        "canonicalName": "Low AI Accuracy",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Useless Output",
        "synonyms": [
            "low accuracy",
            "inaccurate",
            "wrong answers",
            "poor performance"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low accuracy",
            "inaccurate",
            "wrong answers",
            "poor performance"
        ],
        "negativeKeywords": [
            "high accuracy"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-051",
        "canonicalName": "Biased AI Outputs",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Brand Damage",
        "synonyms": [
            "biased output",
            "racist model",
            "sexist model",
            "unfair ai"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "biased output",
            "racist model",
            "sexist model",
            "unfair ai"
        ],
        "negativeKeywords": [
            "unbiased"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-052",
        "canonicalName": "Incoherent AI Responses",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Frustration",
        "synonyms": [
            "incoherent",
            "rambling",
            "doesn't make sense",
            "word salad"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "incoherent",
            "rambling",
            "doesn't make sense",
            "word salad"
        ],
        "negativeKeywords": [
            "coherent"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-053",
        "canonicalName": "Degrading AI Performance",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Lost Value",
        "synonyms": [
            "degrading performance",
            "model getting worse",
            "used to work better",
            "decaying"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "degrading performance",
            "model getting worse",
            "used to work better",
            "decaying"
        ],
        "negativeKeywords": [
            "stable performance"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-054",
        "canonicalName": "Concept Drift",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Irrelevance",
        "synonyms": [
            "concept drift",
            "world changed",
            "assumptions broken",
            "model drift"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "concept drift",
            "world changed",
            "assumptions broken",
            "model drift"
        ],
        "negativeKeywords": [
            "drift mitigated"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-055",
        "canonicalName": "Data Distribution Shifts",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Errors",
        "synonyms": [
            "distribution shift",
            "data changed",
            "input is different now"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "distribution shift",
            "data changed",
            "input is different now"
        ],
        "negativeKeywords": [
            "stable distribution"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-056",
        "canonicalName": "Stale AI Models",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Outdated Answers",
        "synonyms": [
            "stale model",
            "outdated model",
            "old weights",
            "needs retraining"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stale model",
            "outdated model",
            "old weights",
            "needs retraining"
        ],
        "negativeKeywords": [
            "fresh models"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-057",
        "canonicalName": "Garbage In Garbage Out",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Poor Models",
        "synonyms": [
            "gigo",
            "garbage in",
            "bad data",
            "poor data quality",
            "dirty data"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "gigo",
            "garbage in",
            "bad data",
            "poor data quality",
            "dirty data"
        ],
        "negativeKeywords": [
            "clean data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-058",
        "canonicalName": "Unstructured Data Mess",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Unusable Assets",
        "synonyms": [
            "unstructured mess",
            "data swamp",
            "can't parse data",
            "messy documents"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unstructured mess",
            "data swamp",
            "can't parse data",
            "messy documents"
        ],
        "negativeKeywords": [
            "structured data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-059",
        "canonicalName": "Missing Training Data",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Stalled Training",
        "synonyms": [
            "missing data",
            "not enough data",
            "lack of training data",
            "data scarcity"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "missing data",
            "not enough data",
            "lack of training data",
            "data scarcity"
        ],
        "negativeKeywords": [
            "abundant data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-060",
        "canonicalName": "Inaccurate RAG Context",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Hallucinations",
        "synonyms": [
            "inaccurate context",
            "wrong documents retrieved",
            "bad context",
            "irrelevant rag context"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inaccurate context",
            "wrong documents retrieved",
            "bad context",
            "irrelevant rag context"
        ],
        "negativeKeywords": [
            "perfect context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-061",
        "canonicalName": "Unclassified AI Data",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Security Risk",
        "synonyms": [
            "unclassified data",
            "don't know what data is",
            "unknown sensitivity",
            "unlabeled data"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unclassified data",
            "don't know what data is",
            "unknown sensitivity",
            "unlabeled data"
        ],
        "negativeKeywords": [
            "classified data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-062",
        "canonicalName": "Poor Data Access Controls",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Data Leakage",
        "synonyms": [
            "poor access controls",
            "anyone can access",
            "no rbac",
            "missing acls"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor access controls",
            "anyone can access",
            "no rbac",
            "missing acls"
        ],
        "negativeKeywords": [
            "strict access"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-063",
        "canonicalName": "Siloed AI Data Sources",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Incomplete Context",
        "synonyms": [
            "siloed data",
            "data in different systems",
            "fragmented data",
            "disconnected databases"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed data",
            "data in different systems",
            "fragmented data",
            "disconnected databases"
        ],
        "negativeKeywords": [
            "unified data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-064",
        "canonicalName": "No Data Lineage",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Compliance Failure",
        "synonyms": [
            "no data lineage",
            "where did this data come from",
            "unknown origin",
            "untraceable data"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no data lineage",
            "where did this data come from",
            "unknown origin",
            "untraceable data"
        ],
        "negativeKeywords": [
            "clear lineage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-065",
        "canonicalName": "Lost Context in Chat",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Frustrating UX",
        "synonyms": [
            "lost context",
            "bot forgot",
            "short memory",
            "forgets previous messages"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lost context",
            "bot forgot",
            "short memory",
            "forgets previous messages"
        ],
        "negativeKeywords": [
            "retains context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-066",
        "canonicalName": "Token Limit Truncation",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Incomplete Analysis",
        "synonyms": [
            "token limit",
            "exceeded tokens",
            "truncated context",
            "cut off"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "token limit",
            "exceeded tokens",
            "truncated context",
            "cut off"
        ],
        "negativeKeywords": [
            "infinite context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-067",
        "canonicalName": "Poor Context Relevance",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Bad Answers",
        "synonyms": [
            "poor relevance",
            "irrelevant context",
            "fetching wrong info",
            "bad retrieved context"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor relevance",
            "irrelevant context",
            "fetching wrong info",
            "bad retrieved context"
        ],
        "negativeKeywords": [
            "highly relevant context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-068",
        "canonicalName": "Ineffective Chunking",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Missed Information",
        "synonyms": [
            "bad chunking",
            "split mid sentence",
            "ineffective chunking",
            "poor chunks"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "bad chunking",
            "split mid sentence",
            "ineffective chunking",
            "poor chunks"
        ],
        "negativeKeywords": [
            "semantic chunking"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-069",
        "canonicalName": "Slow Vector Search",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Latency",
        "synonyms": [
            "slow vector search",
            "pinecone is slow",
            "vector db lag",
            "ann search slow"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow vector search",
            "pinecone is slow",
            "vector db lag",
            "ann search slow"
        ],
        "negativeKeywords": [
            "fast vector search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-070",
        "canonicalName": "Irrelevant Search Results",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Useless RAG",
        "synonyms": [
            "irrelevant results",
            "bad search",
            "poor recall",
            "low precision"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "irrelevant results",
            "bad search",
            "poor recall",
            "low precision"
        ],
        "negativeKeywords": [
            "highly relevant results"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-071",
        "canonicalName": "Poor Embeddings",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Semantic Mismatch",
        "synonyms": [
            "poor embeddings",
            "bad embeddings",
            "weak representation",
            "embeddings don't capture meaning"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor embeddings",
            "bad embeddings",
            "weak representation",
            "embeddings don't capture meaning"
        ],
        "negativeKeywords": [
            "strong embeddings"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-072",
        "canonicalName": "Missing Vector DB Indexes",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Performance Hit",
        "synonyms": [
            "missing index",
            "no vector index",
            "full scan",
            "unindexed db"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "missing index",
            "no vector index",
            "full scan",
            "unindexed db"
        ],
        "negativeKeywords": [
            "indexed db"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-073",
        "canonicalName": "RAG Hallucinations",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Lost Trust",
        "synonyms": [
            "rag hallucination",
            "making up facts from context",
            "hallucinating with context"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rag hallucination",
            "making up facts from context",
            "hallucinating with context"
        ],
        "negativeKeywords": [
            "grounded rag"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-074",
        "canonicalName": "Complex RAG Pipelines",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Maintenance Nightmare",
        "synonyms": [
            "complex rag",
            "convoluted pipeline",
            "too many rag steps",
            "overengineered rag"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "complex rag",
            "convoluted pipeline",
            "too many rag steps",
            "overengineered rag"
        ],
        "negativeKeywords": [
            "simple rag"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-075",
        "canonicalName": "Inaccurate RAG Grounding",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Errors",
        "synonyms": [
            "poor grounding",
            "not grounded in facts",
            "ungrounded responses",
            "fails grounding test"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor grounding",
            "not grounded in facts",
            "ungrounded responses",
            "fails grounding test"
        ],
        "negativeKeywords": [
            "solid grounding"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-076",
        "canonicalName": "RAG Pipeline Latency",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Slow UX",
        "synonyms": [
            "rag latency",
            "slow rag",
            "pipeline takes too long",
            "slow retrieval"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rag latency",
            "slow rag",
            "pipeline takes too long",
            "slow retrieval"
        ],
        "negativeKeywords": [
            "fast rag"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-077",
        "canonicalName": "Runaway AI Agents",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "System Damage",
        "synonyms": [
            "runaway agent",
            "agent out of control",
            "infinite loop agent",
            "uncontrollable agent"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "runaway agent",
            "agent out of control",
            "infinite loop agent",
            "uncontrollable agent"
        ],
        "negativeKeywords": [
            "controlled agent"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-078",
        "canonicalName": "Agent Infinite Loops",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Compute Waste",
        "synonyms": [
            "infinite loop",
            "stuck in loop",
            "agent looping",
            "repetitive agent actions"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "infinite loop",
            "stuck in loop",
            "agent looping",
            "repetitive agent actions"
        ],
        "negativeKeywords": [
            "loop prevention"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-079",
        "canonicalName": "Poor Agent Tool Use",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Task Failure",
        "synonyms": [
            "poor tool use",
            "hallucinating tools",
            "wrong api call",
            "failed to use tool"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor tool use",
            "hallucinating tools",
            "wrong api call",
            "failed to use tool"
        ],
        "negativeKeywords": [
            "perfect tool use"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-080",
        "canonicalName": "Lack of Agent Oversight",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Compliance Risk",
        "synonyms": [
            "no oversight",
            "unsupervised agent",
            "agent running wild",
            "no human in loop"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no oversight",
            "unsupervised agent",
            "agent running wild",
            "no human in loop"
        ],
        "negativeKeywords": [
            "supervised agent"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-081",
        "canonicalName": "Unpredictable Token Costs",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Volatility",
        "synonyms": [
            "unpredictable cost",
            "volatile bill",
            "token cost spikes",
            "don't know how much it will cost"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unpredictable cost",
            "volatile bill",
            "token cost spikes",
            "don't know how much it will cost"
        ],
        "negativeKeywords": [
            "predictable costs"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-082",
        "canonicalName": "High API Bills",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Budget Crisis",
        "synonyms": [
            "high api bill",
            "openai bill is huge",
            "expensive api",
            "too much spent on anthropic"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high api bill",
            "openai bill is huge",
            "expensive api",
            "too much spent on anthropic"
        ],
        "negativeKeywords": [
            "low api bills"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-083",
        "canonicalName": "Inefficient Model Usage",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Money",
        "synonyms": [
            "inefficient usage",
            "using gpt4 for everything",
            "overpowered model",
            "wasteful prompts"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inefficient usage",
            "using gpt4 for everything",
            "overpowered model",
            "wasteful prompts"
        ],
        "negativeKeywords": [
            "efficient usage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-084",
        "canonicalName": "Wasted GPU Idle Time",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Sunk Cost",
        "synonyms": [
            "idle gpus",
            "wasted compute",
            "gpus doing nothing",
            "low utilization"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "idle gpus",
            "wasted compute",
            "gpus doing nothing",
            "low utilization"
        ],
        "negativeKeywords": [
            "high utilization"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-085",
        "canonicalName": "Unproven AI Value",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Cuts",
        "synonyms": [
            "unproven value",
            "where is the roi",
            "ai is just hype",
            "no real value"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unproven value",
            "where is the roi",
            "ai is just hype",
            "no real value"
        ],
        "negativeKeywords": [
            "proven value"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-086",
        "canonicalName": "High AI TCO",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Unsustainable",
        "synonyms": [
            "high tco",
            "total cost of ownership too high",
            "too expensive to maintain",
            "ai costs too much"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high tco",
            "total cost of ownership too high",
            "too expensive to maintain",
            "ai costs too much"
        ],
        "negativeKeywords": [
            "low tco"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-087",
        "canonicalName": "Unmeasurable AI Impact",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Lost Funding",
        "synonyms": [
            "unmeasurable impact",
            "can't measure roi",
            "hard to quantify",
            "intangible benefits"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unmeasurable impact",
            "can't measure roi",
            "hard to quantify",
            "intangible benefits"
        ],
        "negativeKeywords": [
            "measurable impact"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-088",
        "canonicalName": "Failed Business Case",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Project Cancellation",
        "synonyms": [
            "failed business case",
            "roi is negative",
            "doesn't make financial sense",
            "business case rejected"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "failed business case",
            "roi is negative",
            "doesn't make financial sense",
            "business case rejected"
        ],
        "negativeKeywords": [
            "strong business case"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-089",
        "canonicalName": "AI Slowing Users Down",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Lost Time",
        "synonyms": [
            "slowing users down",
            "takes longer with ai",
            "ai makes it harder",
            "distracting ai"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slowing users down",
            "takes longer with ai",
            "ai makes it harder",
            "distracting ai"
        ],
        "negativeKeywords": [
            "speeding users up"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-090",
        "canonicalName": "Context Switching",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "context switching",
            "jumping between tools",
            "too many tabs",
            "switching apps"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "context switching",
            "jumping between tools",
            "too many tabs",
            "switching apps"
        ],
        "negativeKeywords": [
            "integrated workflow"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-091",
        "canonicalName": "Steep AI Learning Curve",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Low Adoption",
        "synonyms": [
            "steep learning curve",
            "hard to learn",
            "too complex to use",
            "difficult to master"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "steep learning curve",
            "hard to learn",
            "too complex to use",
            "difficult to master"
        ],
        "negativeKeywords": [
            "easy to learn"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-092",
        "canonicalName": "Unproductive AI Tinkering",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Wasted Time",
        "synonyms": [
            "playing with ai",
            "wasting time prompting",
            "tinkering not working",
            "endless tweaking"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "playing with ai",
            "wasting time prompting",
            "tinkering not working",
            "endless tweaking"
        ],
        "negativeKeywords": [
            "productive usage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-093",
        "canonicalName": "Lack of AI Training",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Low Skill",
        "synonyms": [
            "lack of training",
            "no training provided",
            "employees don't know how to use",
            "untrained staff"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lack of training",
            "no training provided",
            "employees don't know how to use",
            "untrained staff"
        ],
        "negativeKeywords": [
            "comprehensive training"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-094",
        "canonicalName": "Low Tool Utilization",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Licenses",
        "synonyms": [
            "low utilization",
            "nobody logs in",
            "unused licenses",
            "shelfware"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low utilization",
            "nobody logs in",
            "unused licenses",
            "shelfware"
        ],
        "negativeKeywords": [
            "high utilization"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-095",
        "canonicalName": "Employee AI Frustration",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor Morale",
        "synonyms": [
            "employee frustration",
            "hates using ai",
            "annoyed by ai",
            "ai is frustrating"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "employee frustration",
            "hates using ai",
            "annoyed by ai",
            "ai is frustrating"
        ],
        "negativeKeywords": [
            "delighted employees"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-096",
        "canonicalName": "Ignored AI Features",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lost Value",
        "synonyms": [
            "ignored features",
            "no one uses the ai button",
            "blindness to ai",
            "overlooked features"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ignored features",
            "no one uses the ai button",
            "blindness to ai",
            "overlooked features"
        ],
        "negativeKeywords": [
            "highly used features"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-097",
        "canonicalName": "Poor AI Communication",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Confusion",
        "synonyms": [
            "poor communication",
            "unclear rollout plan",
            "bad messaging",
            "lack of comms"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor communication",
            "unclear rollout plan",
            "bad messaging",
            "lack of comms"
        ],
        "negativeKeywords": [
            "clear communication"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-098",
        "canonicalName": "Lack of Executive Sponsorship",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Stalled Initiatives",
        "synonyms": [
            "no exec sponsor",
            "lack of leadership support",
            "no champion",
            "c-suite doesn't care"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no exec sponsor",
            "lack of leadership support",
            "no champion",
            "c-suite doesn't care"
        ],
        "negativeKeywords": [
            "strong exec sponsorship"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-099",
        "canonicalName": "Ignored Process Changes",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "ignored process",
            "still doing it old way",
            "refusing to change",
            "stubborn habits"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ignored process",
            "still doing it old way",
            "refusing to change",
            "stubborn habits"
        ],
        "negativeKeywords": [
            "adopted new process"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-100",
        "canonicalName": "Resistance from Middle Management",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Blockers",
        "synonyms": [
            "middle management resistance",
            "managers blocking",
            "frozen middle",
            "managers afraid"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "middle management resistance",
            "managers blocking",
            "frozen middle",
            "managers afraid"
        ],
        "negativeKeywords": [
            "manager support"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-101",
        "canonicalName": "Slow AI Vendor Vetting",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Delayed Adoption",
        "synonyms": [
            "slow vetting",
            "procurement takes forever",
            "compliance bottleneck",
            "stuck in legal"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow vetting",
            "procurement takes forever",
            "compliance bottleneck",
            "stuck in legal"
        ],
        "negativeKeywords": [
            "fast vetting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-102",
        "canonicalName": "Unclear AI Vendor Terms",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Legal Risk",
        "synonyms": [
            "unclear terms",
            "bad terms of service",
            "data usage rights unclear",
            "vendor t&cs"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unclear terms",
            "bad terms of service",
            "data usage rights unclear",
            "vendor t&cs"
        ],
        "negativeKeywords": [
            "clear terms"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-103",
        "canonicalName": "Duplicative AI Licenses",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Wasted Spend",
        "synonyms": [
            "duplicate licenses",
            "paying twice",
            "overlapping tools",
            "too many ai tools"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "duplicate licenses",
            "paying twice",
            "overlapping tools",
            "too many ai tools"
        ],
        "negativeKeywords": [
            "consolidated licenses"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-104",
        "canonicalName": "Vendor Lock-in",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Inflexibility",
        "synonyms": [
            "vendor lock-in",
            "stuck with openai",
            "can't switch models",
            "locked in"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "vendor lock-in",
            "stuck with openai",
            "can't switch models",
            "locked in"
        ],
        "negativeKeywords": [
            "vendor agnostic"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-105",
        "canonicalName": "Unresponsive AI Support",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Downtime",
        "synonyms": [
            "unresponsive support",
            "bad vendor support",
            "openai won't reply",
            "no sla"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unresponsive support",
            "bad vendor support",
            "openai won't reply",
            "no sla"
        ],
        "negativeKeywords": [
            "great support"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-106",
        "canonicalName": "SaaS Price Hikes",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Overrun",
        "synonyms": [
            "price hike",
            "vendor raised prices",
            "api got more expensive",
            "subscription increased"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "price hike",
            "vendor raised prices",
            "api got more expensive",
            "subscription increased"
        ],
        "negativeKeywords": [
            "stable pricing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-107",
        "canonicalName": "Hidden Vendor Fees",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Unexpected Cost",
        "synonyms": [
            "hidden fees",
            "surprise charges",
            "overage fees",
            "hidden limits"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hidden fees",
            "surprise charges",
            "overage fees",
            "hidden limits"
        ],
        "negativeKeywords": [
            "transparent pricing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-108",
        "canonicalName": "Poor Vendor SLAs",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Reliability Issues",
        "synonyms": [
            "poor sla",
            "missed sla",
            "vendor downtime",
            "unreliable vendor"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor sla",
            "missed sla",
            "vendor downtime",
            "unreliable vendor"
        ],
        "negativeKeywords": [
            "strict slas"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-109",
        "canonicalName": "Broken Semantic Search",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Information Hiding",
        "synonyms": [
            "broken semantic search",
            "semantic search fails",
            "vector search sucks",
            "meaning search broken"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "broken semantic search",
            "semantic search fails",
            "vector search sucks",
            "meaning search broken"
        ],
        "negativeKeywords": [
            "working semantic search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-110",
        "canonicalName": "Keyword Search Limitations",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Poor Results",
        "synonyms": [
            "keyword search limitations",
            "exact match only",
            "synonyms fail",
            "lexical search failing"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "keyword search limitations",
            "exact match only",
            "synonyms fail",
            "lexical search failing"
        ],
        "negativeKeywords": [
            "hybrid search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-111",
        "canonicalName": "Siloed Search Indexes",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Fragmented Knowledge",
        "synonyms": [
            "siloed search",
            "can't search across apps",
            "fragmented search",
            "disconnected search"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed search",
            "can't search across apps",
            "fragmented search",
            "disconnected search"
        ],
        "negativeKeywords": [
            "unified search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-112",
        "canonicalName": "Low Search Click-through",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Poor UX",
        "synonyms": [
            "low ctr",
            "no one clicks results",
            "search abandoned",
            "users give up searching"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low ctr",
            "no one clicks results",
            "search abandoned",
            "users give up searching"
        ],
        "negativeKeywords": [
            "high ctr"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-113",
        "canonicalName": "Stale Knowledge Bases",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Bad AI Answers",
        "synonyms": [
            "stale knowledge",
            "outdated wiki",
            "old confluence pages",
            "documentation is wrong"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stale knowledge",
            "outdated wiki",
            "old confluence pages",
            "documentation is wrong"
        ],
        "negativeKeywords": [
            "fresh knowledge"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-114",
        "canonicalName": "Undiscoverable Documents",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Lost Productivity",
        "synonyms": [
            "undiscoverable docs",
            "can't find documents",
            "buried files",
            "lost sharepoint"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "undiscoverable docs",
            "can't find documents",
            "buried files",
            "lost sharepoint"
        ],
        "negativeKeywords": [
            "discoverable docs"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-115",
        "canonicalName": "Fragmented Knowledge",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inconsistency",
        "synonyms": [
            "fragmented knowledge",
            "scattered information",
            "knowledge everywhere",
            "no single source of truth"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "fragmented knowledge",
            "scattered information",
            "knowledge everywhere",
            "no single source of truth"
        ],
        "negativeKeywords": [
            "centralized knowledge"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-116",
        "canonicalName": "Manual Knowledge Updates",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Maintenance Overhead",
        "synonyms": [
            "manual updates",
            "updating wiki by hand",
            "laborious documentation",
            "painful to document"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual updates",
            "updating wiki by hand",
            "laborious documentation",
            "painful to document"
        ],
        "negativeKeywords": [
            "automated updates"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-117",
        "canonicalName": "No AI Upskilling",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Skill Gap",
        "synonyms": [
            "no upskilling",
            "lack of upskilling",
            "not teaching ai",
            "falling behind in skills"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no upskilling",
            "lack of upskilling",
            "not teaching ai",
            "falling behind in skills"
        ],
        "negativeKeywords": [
            "continuous upskilling"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-118",
        "canonicalName": "Outdated Training Materials",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Ineffectiveness",
        "synonyms": [
            "outdated training",
            "old tutorials",
            "training is stale",
            "learning old models"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "outdated training",
            "old tutorials",
            "training is stale",
            "learning old models"
        ],
        "negativeKeywords": [
            "up to date training"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-119",
        "canonicalName": "Lack of Hands-on Practice",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Low Confidence",
        "synonyms": [
            "no hands on",
            "all theory",
            "no sandbox",
            "can't practice ai"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no hands on",
            "all theory",
            "no sandbox",
            "can't practice ai"
        ],
        "negativeKeywords": [
            "sandbox environment"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-120",
        "canonicalName": "No AI Best Practices",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Errors",
        "synonyms": [
            "no best practices",
            "no standards",
            "winging it",
            "lack of guardrails"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no best practices",
            "no standards",
            "winging it",
            "lack of guardrails"
        ],
        "negativeKeywords": [
            "established best practices"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-121",
        "canonicalName": "Blind AI Deployments",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Unknown Risks",
        "synonyms": [
            "blind deployment",
            "no visibility",
            "don't know what ai is doing",
            "black box ops"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "blind deployment",
            "no visibility",
            "don't know what ai is doing",
            "black box ops"
        ],
        "negativeKeywords": [
            "full observability"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-122",
        "canonicalName": "No Token Tracking",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Uncontrolled Spend",
        "synonyms": [
            "no token tracking",
            "can't track usage",
            "untracked tokens",
            "who is using tokens"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no token tracking",
            "can't track usage",
            "untracked tokens",
            "who is using tokens"
        ],
        "negativeKeywords": [
            "detailed token tracking"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-123",
        "canonicalName": "Missing Error Alerts",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Silent Failures",
        "synonyms": [
            "missing alerts",
            "no alerts",
            "silent failure",
            "didn't know it was down"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "missing alerts",
            "no alerts",
            "silent failure",
            "didn't know it was down"
        ],
        "negativeKeywords": [
            "robust alerting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-124",
        "canonicalName": "Unmonitored AI Chatbots",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Brand Risk",
        "synonyms": [
            "unmonitored chatbot",
            "rogue bot",
            "bot saying crazy things",
            "no oversight on bot"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unmonitored chatbot",
            "rogue bot",
            "bot saying crazy things",
            "no oversight on bot"
        ],
        "negativeKeywords": [
            "monitored bots"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-125",
        "canonicalName": "API Downtime",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Service Outage",
        "synonyms": [
            "api downtime",
            "openai is down",
            "anthropic outage",
            "llm api broken"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "api downtime",
            "openai is down",
            "anthropic outage",
            "llm api broken"
        ],
        "negativeKeywords": [
            "high availability"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-126",
        "canonicalName": "Inconsistent LLM Latency",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor UX",
        "synonyms": [
            "inconsistent latency",
            "sometimes fast sometimes slow",
            "latency spikes",
            "unpredictable speed"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inconsistent latency",
            "sometimes fast sometimes slow",
            "latency spikes",
            "unpredictable speed"
        ],
        "negativeKeywords": [
            "consistent low latency"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-127",
        "canonicalName": "Model Rate Limits",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Throttling",
        "synonyms": [
            "rate limit",
            "hit rate limit",
            "throttled",
            "too many requests 429"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rate limit",
            "hit rate limit",
            "throttled",
            "too many requests 429"
        ],
        "negativeKeywords": [
            "rate limits managed"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-128",
        "canonicalName": "Fragile AI Pipelines",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Brittle Systems",
        "synonyms": [
            "fragile pipeline",
            "pipeline breaks often",
            "brittle architecture",
            "failing jobs"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "fragile pipeline",
            "pipeline breaks often",
            "brittle architecture",
            "failing jobs"
        ],
        "negativeKeywords": [
            "resilient pipelines"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-129",
        "canonicalName": "Slow Time to First Token",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor UX",
        "synonyms": [
            "ttft",
            "slow time to first token",
            "takes forever to start typing",
            "laggy start"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ttft",
            "slow time to first token",
            "takes forever to start typing",
            "laggy start"
        ],
        "negativeKeywords": [
            "fast ttft"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-130",
        "canonicalName": "Lagging AI Interfaces",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Frustration",
        "synonyms": [
            "lagging interface",
            "ui freeze",
            "slow chat ui",
            "janky interface"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lagging interface",
            "ui freeze",
            "slow chat ui",
            "janky interface"
        ],
        "negativeKeywords": [
            "snappy ui"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-131",
        "canonicalName": "High Processing Overhead",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "high overhead",
            "cpu bound",
            "too much processing",
            "heavy compute"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high overhead",
            "cpu bound",
            "too much processing",
            "heavy compute"
        ],
        "negativeKeywords": [
            "optimized processing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-132",
        "canonicalName": "Unoptimized Models",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Wasted Compute",
        "synonyms": [
            "unoptimized model",
            "bloated model",
            "not quantized",
            "too large model"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unoptimized model",
            "bloated model",
            "not quantized",
            "too large model"
        ],
        "negativeKeywords": [
            "optimized models"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-133",
        "canonicalName": "Inability to Scale AI",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Growth Cap",
        "synonyms": [
            "inability to scale",
            "can't scale ai",
            "stuck in poc",
            "fails at scale"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inability to scale",
            "can't scale ai",
            "stuck in poc",
            "fails at scale"
        ],
        "negativeKeywords": [
            "infinitely scalable"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-134",
        "canonicalName": "Bottlenecked Endpoints",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Throttling",
        "synonyms": [
            "bottlenecked endpoint",
            "api bottleneck",
            "proxy bottleneck",
            "chokepoint"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "bottlenecked endpoint",
            "api bottleneck",
            "proxy bottleneck",
            "chokepoint"
        ],
        "negativeKeywords": [
            "load balanced"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-135",
        "canonicalName": "Concurrency Issues",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Dropped Requests",
        "synonyms": [
            "concurrency issue",
            "can't handle concurrent",
            "fails under load",
            "drops requests"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "concurrency issue",
            "can't handle concurrent",
            "fails under load",
            "drops requests"
        ],
        "negativeKeywords": [
            "high concurrency"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-136",
        "canonicalName": "Database Overload",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "System Crash",
        "synonyms": [
            "database overload",
            "vector db crashed",
            "db connection limit",
            "overwhelmed db"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "database overload",
            "vector db crashed",
            "db connection limit",
            "overwhelmed db"
        ],
        "negativeKeywords": [
            "scalable database"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-137",
        "canonicalName": "Legacy System Incompatibility",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Integration Failure",
        "synonyms": [
            "legacy incompatibility",
            "doesn't work with mainframe",
            "old system integration",
            "legacy API issues"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "legacy incompatibility",
            "doesn't work with mainframe",
            "old system integration",
            "legacy API issues"
        ],
        "negativeKeywords": [
            "seamless integration"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-138",
        "canonicalName": "Brittle API Connections",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Frequent Breakages",
        "synonyms": [
            "brittle api",
            "connections break",
            "flaky webhooks",
            "api changes break integration"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "brittle api",
            "connections break",
            "flaky webhooks",
            "api changes break integration"
        ],
        "negativeKeywords": [
            "robust apis"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-139",
        "canonicalName": "Complex Auth Workflows",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Delayed Implementation",
        "synonyms": [
            "complex auth",
            "oauth hell",
            "authentication nightmare",
            "hard to authenticate"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "complex auth",
            "oauth hell",
            "authentication nightmare",
            "hard to authenticate"
        ],
        "negativeKeywords": [
            "easy auth"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-140",
        "canonicalName": "Data Silos",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Incomplete Context",
        "synonyms": [
            "data silos",
            "can't access other data",
            "isolated databases",
            "walled gardens"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "data silos",
            "can't access other data",
            "isolated databases",
            "walled gardens"
        ],
        "negativeKeywords": [
            "unified data graph"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-141",
        "canonicalName": "Siloed Prompt Engineering",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Duplication",
        "synonyms": [
            "siloed prompting",
            "not sharing prompts",
            "working in isolation"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed prompting",
            "not sharing prompts",
            "working in isolation"
        ],
        "negativeKeywords": [
            "collaborative prompting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-142",
        "canonicalName": "No Shared AI Workspaces",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Friction",
        "synonyms": [
            "no shared workspace",
            "individual accounts",
            "can't collaborate on chat",
            "single player mode"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no shared workspace",
            "individual accounts",
            "can't collaborate on chat",
            "single player mode"
        ],
        "negativeKeywords": [
            "multiplayer ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-143",
        "canonicalName": "Duplicated AI Efforts",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Resources",
        "synonyms": [
            "duplicated effort",
            "building the same thing twice",
            "reinventing the wheel",
            "redundant ai projects"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "duplicated effort",
            "building the same thing twice",
            "reinventing the wheel",
            "redundant ai projects"
        ],
        "negativeKeywords": [
            "coordinated efforts"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-144",
        "canonicalName": "Poor Team Alignment",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Conflicting Goals",
        "synonyms": [
            "poor alignment",
            "teams not aligned",
            "disjointed ai strategy",
            "working at cross purposes"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor alignment",
            "teams not aligned",
            "disjointed ai strategy",
            "working at cross purposes"
        ],
        "negativeKeywords": [
            "aligned teams"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-145",
        "canonicalName": "No Exec AI Champion",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Stalled Progress",
        "synonyms": [
            "no exec champion",
            "no c-level support",
            "leadership doesn't care",
            "lacking sponsorship"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no exec champion",
            "no c-level support",
            "leadership doesn't care",
            "lacking sponsorship"
        ],
        "negativeKeywords": [
            "strong exec champion"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-146",
        "canonicalName": "Conflicting AI Priorities",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Confusion",
        "synonyms": [
            "conflicting priorities",
            "mixed signals from leadership",
            "c-suite disagrees",
            "no clear priority"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "conflicting priorities",
            "mixed signals from leadership",
            "c-suite disagrees",
            "no clear priority"
        ],
        "negativeKeywords": [
            "clear priorities"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-147",
        "canonicalName": "Unrealistic AI Expectations",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Disappointment",
        "synonyms": [
            "unrealistic expectations",
            "execs think it's magic",
            "hype driven expectations",
            "expecting agi"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unrealistic expectations",
            "execs think it's magic",
            "hype driven expectations",
            "expecting agi"
        ],
        "negativeKeywords": [
            "grounded expectations"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-148",
        "canonicalName": "Lack of Budget",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Stalled Initiatives",
        "synonyms": [
            "no budget",
            "zero budget",
            "denied funding",
            "can't afford ai"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no budget",
            "zero budget",
            "denied funding",
            "can't afford ai"
        ],
        "negativeKeywords": [
            "fully funded"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-149",
        "canonicalName": "Stalled Digital Initiatives",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Lost Competitiveness",
        "synonyms": [
            "stalled transformation",
            "digital transformation failed",
            "stuck in old ways"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stalled transformation",
            "digital transformation failed",
            "stuck in old ways"
        ],
        "negativeKeywords": [
            "accelerated transformation"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-150",
        "canonicalName": "Outdated Tech Stack",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Technical Debt",
        "synonyms": [
            "outdated tech",
            "legacy stack",
            "tech debt",
            "archaic systems"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "outdated tech",
            "legacy stack",
            "tech debt",
            "archaic systems"
        ],
        "negativeKeywords": [
            "modern stack"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-151",
        "canonicalName": "Manual Legacy Processes",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "manual legacy",
            "paper processes",
            "still using excel for everything",
            "manual routing"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual legacy",
            "paper processes",
            "still using excel for everything",
            "manual routing"
        ],
        "negativeKeywords": [
            "digital workflows"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-152",
        "canonicalName": "Slow Modernization",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lagging Behind",
        "synonyms": [
            "slow modernization",
            "moving too slowly",
            "takes years to upgrade",
            "snail pace"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow modernization",
            "moving too slowly",
            "takes years to upgrade",
            "snail pace"
        ],
        "negativeKeywords": [
            "agile modernization"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-153",
        "canonicalName": "Slow AI Prototyping",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lost Opportunities",
        "synonyms": [
            "slow prototyping",
            "takes too long to build poc",
            "can't iterate fast",
            "slow dev cycle"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow prototyping",
            "takes too long to build poc",
            "can't iterate fast",
            "slow dev cycle"
        ],
        "negativeKeywords": [
            "rapid prototyping"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-154",
        "canonicalName": "Lack of AI Experimentation",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Stagnation",
        "synonyms": [
            "no experimentation",
            "afraid to try ai",
            "no sandbox culture",
            "stifled innovation"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no experimentation",
            "afraid to try ai",
            "no sandbox culture",
            "stifled innovation"
        ],
        "negativeKeywords": [
            "culture of experimentation"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-155",
        "canonicalName": "Competitor Outpacing",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Market Share Loss",
        "synonyms": [
            "competitor outpacing",
            "falling behind competitors",
            "rivals using ai better",
            "losing edge"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "competitor outpacing",
            "falling behind competitors",
            "rivals using ai better",
            "losing edge"
        ],
        "negativeKeywords": [
            "market leadership"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-156",
        "canonicalName": "Stifled Creativity",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Status Quo",
        "synonyms": [
            "stifled creativity",
            "not allowed to innovate",
            "rigid culture",
            "no outside the box"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stifled creativity",
            "not allowed to innovate",
            "rigid culture",
            "no outside the box"
        ],
        "negativeKeywords": [
            "creative freedom"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-157",
        "canonicalName": "Unquantified AI Risks",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Unknown Liabilities",
        "synonyms": [
            "unquantified risks",
            "don't know the risks",
            "blind to ai risk",
            "unmeasured risk"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unquantified risks",
            "don't know the risks",
            "blind to ai risk",
            "unmeasured risk"
        ],
        "negativeKeywords": [
            "quantified risks"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    },
    {
        "id": "PAIN-158",
        "canonicalName": "No AI Contingency Plan",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Unpreparedness",
        "synonyms": [
            "no contingency plan",
            "no backup plan",
            "if ai goes down we fail",
            "single point of failure"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no contingency plan",
            "no backup plan",
            "if ai goes down we fail",
            "single point of failure"
        ],
        "negativeKeywords": [
            "solid contingency"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    },
    {
        "id": "PAIN-159",
        "canonicalName": "Lack of Red Teaming",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Security Blindspots",
        "synonyms": [
            "no red teaming",
            "untested models",
            "didn't jailbreak test",
            "no adversarial testing"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no red teaming",
            "untested models",
            "didn't jailbreak test",
            "no adversarial testing"
        ],
        "negativeKeywords": [
            "continuous red teaming"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    },
    {
        "id": "PAIN-160",
        "canonicalName": "Uninsured AI Liabilities",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Financial Exposure",
        "synonyms": [
            "uninsured liability",
            "no cyber insurance for ai",
            "exposed to lawsuits",
            "legal liability"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "uninsured liability",
            "no cyber insurance for ai",
            "exposed to lawsuits",
            "legal liability"
        ],
        "negativeKeywords": [
            "fully insured"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    }
];
    this.initialized = false;
    this.lookupMap = new Map();
    this.triggerPhrases = []; // Optimized structure for regex building
  }

  /**
   * Initializes the ontology and builds optimized search structures.
   * Caches reusable structures to avoid unnecessary loops during execution.
   */
  initializeOntology() {
    if (this.initialized) return;

    this.ontology.forEach(pain => {
      // Map for O(1) lookups by ID
      this.lookupMap.set(pain.id, pain);

      // Build trigger phrase lookup
      pain.triggerPhrases.forEach(phrase => {
         this.triggerPhrases.push({
             phrase: phrase.toLowerCase(),
             regex: new RegExp('\\b' + this._escapeRegExp(phrase) + '\\b', 'gi'),
             painId: pain.id,
             weight: pain.buyingIntentWeight
         });
      });

      // Add canonical name and synonyms to triggers
      const allTerms = [pain.canonicalName.toLowerCase(), ...(pain.synonyms || [])];
      allTerms.forEach(term => {
          this.triggerPhrases.push({
             phrase: term,
             regex: new RegExp('\\b' + this._escapeRegExp(term) + '\\b', 'gi'),
             painId: pain.id,
             weight: pain.buyingIntentWeight
          });
      });
    });

    // Sort by phrase length descending to match longest phrases first (exact phrase matching)
    this.triggerPhrases.sort((a, b) => b.phrase.length - a.phrase.length);

    this.initialized = true;
  }

  /**
   * Detects pain signals from unstructured text.
   * @param {string} text - Raw unstructured text to process.
   * @returns {Array} Array of normalized pain results.
   */
  detectPainSignals(text) {
    this.initializeOntology();
    if (!text || typeof text !== 'string') return [];

    const normalizedText = this._normalizeText(text);
    const rawMatches = [];

    // Semantic matching using optimized regex
    for (const trigger of this.triggerPhrases) {
        let match;
        // Reset regex state since it's global
        trigger.regex.lastIndex = 0;
        while ((match = trigger.regex.exec(normalizedText)) !== null) {
            rawMatches.push({
                painId: trigger.painId,
                matchedTerm: match[0],
                position: match.index,
                triggerContext: this._extractContext(normalizedText, match.index, match[0].length),
                weight: trigger.weight
            });
        }
    }

    // Filter false positives and calculate confidence
    const validatedMatches = this._validateAndScoreMatches(rawMatches);

    // Merge duplicates
    const mergedSignals = this.mergeDuplicateSignals(validatedMatches);

    // Normalize format
    return this.normalizePainResults(mergedSignals);
  }

  /**
   * Identifies all distinct categories represented in a text.
   * @param {string} text - Raw text to process.
   * @returns {Array} Array of unique category names.
   */
  detectCategories(text) {
      const signals = this.detectPainSignals(text);
      const categories = new Set();
      signals.forEach(s => categories.add(s.Category));
      return Array.from(categories);
  }

  /**
   * Calculates confidence score for a specific match, incorporating context and penalties.
   * @param {Object} match - Raw match object.
   * @param {Object} painDef - The ontology definition for the pain.
   * @returns {number} Confidence score (0.0 to 1.0).
   */
  calculatePainConfidence(match, painDef) {
      let confidence = 0.8; // Base confidence

      // False positive reduction: Check negative keywords in context
      if (painDef.negativeKeywords && painDef.negativeKeywords.length > 0) {
          const contextLower = match.triggerContext.toLowerCase();
          for (const neg of painDef.negativeKeywords) {
              if (contextLower.includes(neg.toLowerCase())) {
                  // Strong penalty for negative context (e.g. "no problem", "resolved")
                  confidence *= 0.1;
                  break;
              }
          }
      }

      // Confidence modifiers
      confidence *= (painDef.confidenceModifier || 1.0);

      // Exact phrase match length bonus (longer phrases are less likely to be accidental)
      if (match.matchedTerm.length > 20) confidence *= 1.1;

      // Stopword proximity check (basic handling) - penalize if surrounded by negation
      const negationWords = ["not", "never", "without", "lacking", "resolved", "fixed", "avoided"];
      const prefix = match.triggerContext.substring(0, 30).toLowerCase();
      if (negationWords.some(w => prefix.includes(w + " "))) {
           // If the preceding text has negations that aren't part of the trigger
           // e.g. "we are not experiencing [trigger]"
           // However, some triggers are "lack of...", so we must be careful.
           // Only penalize if the trigger itself doesn't contain a negation.
           const triggerHasNegation = negationWords.some(w => match.matchedTerm.toLowerCase().includes(w));
           if (!triggerHasNegation) {
               confidence *= 0.3;
           }
      }

      return Math.min(Math.max(confidence, 0), 1.0);
  }

  /**
   * Merges duplicate signals for the same pain ID found in the text.
   * @param {Array} signals - Array of validated match objects.
   * @returns {Array} Deduplicated and aggregated signals.
   */
  mergeDuplicateSignals(signals) {
      const merged = new Map();

      signals.forEach(sig => {
          if (!merged.has(sig.painId)) {
              merged.set(sig.painId, { ...sig, matchCount: 1, matchedTerms: new Set([sig.matchedTerm]) });
          } else {
              const existing = merged.get(sig.painId);
              existing.matchCount += 1;
              existing.matchedTerms.add(sig.matchedTerm);
              // Take highest confidence
              existing.confidence = Math.max(existing.confidence, sig.confidence);
              // Combine context if different
              if (existing.triggerContext !== sig.triggerContext) {
                  existing.triggerContext = existing.triggerContext + " | " + sig.triggerContext;
              }
          }
      });

      return Array.from(merged.values()).map(sig => ({
          ...sig,
          matchedTerms: Array.from(sig.matchedTerms)
      }));
  }

  /**
   * Normalizes the merged signals into the final required output structure.
   * @param {Array} signals - Deduplicated signals.
   * @returns {Array} Normalized output format.
   */
  normalizePainResults(signals) {
      return signals
          // Filter out low confidence matches after penalties
          .filter(sig => sig.confidence >= 0.5)
          .map(sig => {
              const painDef = this.lookupMap.get(sig.painId);

              return {
                  PainID: painDef.id,
                  PainName: painDef.canonicalName,
                  Category: painDef.category,
                  Subcategory: painDef.parentCategory,
                  Confidence: Math.round(sig.confidence * 100), // Normalize to 0-100
                  Severity: painDef.severity,
                  IntentWeight: painDef.buyingIntentWeight,
                  BusinessImpact: painDef.businessImpact,
                  Evidence: sig.triggerContext.substring(0, 200), // Cap evidence length
                  MatchedTerms: sig.matchedTerms,
                  Position: sig.position,
                  SuggestedResolution: painDef.suggestedResolutionCategory
              };
          })
          .sort((a, b) => b.Confidence - a.Confidence); // Sort by highest confidence
  }

  /**
   * Summarizes the distribution of pain categories from normalized results.
   * @param {Array} normalizedSignals - Output from normalizePainResults.
   * @returns {Object} Summary object mapping categories to count and max severity.
   */
  summarizePainDistribution(normalizedSignals) {
      const summary = {};

      normalizedSignals.forEach(sig => {
          if (!summary[sig.Category]) {
              summary[sig.Category] = {
                  count: 0,
                  highestSeverity: 'LOW',
                  totalIntentWeight: 0
              };
          }

          summary[sig.Category].count += 1;
          summary[sig.Category].totalIntentWeight += sig.IntentWeight;

          const severities = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
          const currentMax = severities[summary[sig.Category].highestSeverity];
          const sigSev = severities[sig.Severity];

          if (sigSev > currentMax) {
              summary[sig.Category].highestSeverity = sig.Severity;
          }
      });

      return summary;
  }

  // --- Private Helper Methods ---

  _normalizeText(text) {
      return text.replace(/\s+/g, ' ').toLowerCase().trim();
  }

  _escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _extractContext(text, position, length) {
      const contextWindow = 60; // characters before and after
      const start = Math.max(0, position - contextWindow);
      const end = Math.min(text.length, position + length + contextWindow);
      return text.substring(start, end).trim();
  }

  _validateAndScoreMatches(rawMatches) {
      const validated = [];

      rawMatches.forEach(match => {
          const painDef = this.lookupMap.get(match.painId);
          if (!painDef) return;

          const confidence = this.calculatePainConfidence(match, painDef);

          validated.push({
              ...match,
              confidence: confidence
          });
      });

      return validated;
  }
}

/**
 * Global getter for the singleton instance of AIPainOntologyEngine.
 * Complies with project rule: Global singleton exports must use getter functions (lazy evaluation).
 * @returns {AIPainOntologyEngine}
 */
let _aiPainOntologyEngineInstance = null;
function getAIPainOntologyEngine() {
  if (!_aiPainOntologyEngineInstance) {
    _aiPainOntologyEngineInstance = new AIPainOntologyEngine();
    _aiPainOntologyEngineInstance.initializeOntology();
  }
  return _aiPainOntologyEngineInstance;
}



/******************************************************************
CRAWLERS
******************************************************************/

/**
 * Base Crawler Plugin
 *
 * Provides standard boilerplate and lifecycle methods for all crawlers.
 * Plugins extend this to implement source-specific fetching and parsing.
 */

class BaseCrawler {
  constructor(name) {
    this.name = name;
    this.logger = AppLogger.getLogger(this.name);
    this.config = getAppConfig();
    this.httpClient = new HttpClient();
    this.checkpointEngine = getCheckpointEngine();
    this.queueManager = getQueueManager();
    this.state = {};
  }

  /**
   * Initializes the crawler.
   * Loads the saved checkpoint to resume processing.
   */
  initialize() {
    this.logger.info(this.name, 'Initialize', `Initializing ${this.name}`);
    const savedState = this.resume();
    this.state = savedState || this._getDefaultState();
  }

  /**
   * Defines the default state for a fresh execution.
   * Should be overridden by subclasses if they need more properties.
   */
  _getDefaultState() {
    return {
      currentUrl: null,
      cursor: null,
      page: 1,
      processed: 0,
      timestamp: Date.now()
    };
  }

  /**
   * The core fetching logic. Must be implemented by the subclass.
   * Should return raw items.
   */
  crawl() {
    throw new Error(`${this.name} must implement crawl()`);
  }

  /**
   * Normalizes raw items into the standard schema.
   * Must be implemented by subclass.
   * @param {Object} rawItem
   * @returns {Object} Normalized item.
   */
  normalize(rawItem) {
    throw new Error(`${this.name} must implement normalize()`);
  }

  /**
   * Base normalization wrapper ensuring common structure.
   */
  _createNormalizedRecord(data) {
    return {
      id: data.id || Utils.generateId(),
      source: data.source || this.name,
      sourceType: data.sourceType || 'Unknown',
      company: data.company || null,
      organization: data.organization || null,
      title: data.title || null,
      description: data.description || null,
      content: data.content || null,
      url: data.url || null,
      author: data.author || null,
      publishedAt: data.publishedAt || new Date().toISOString(),
      collectedAt: new Date().toISOString(),
      language: data.language || 'en',
      country: data.country || null,
      technologyTags: data.technologyTags || [],
      rawJson: data.rawJson ? JSON.stringify(data.rawJson) : null,
      crawlerName: this.name,
      confidence: data.confidence || 0.8
    };
  }

  /**
   * Validates a normalized record.
   * Drops duplicates, short content, broken URLs, etc.
   */
  validate(normalizedItem) {
    if (!normalizedItem) return false;
    if (!normalizedItem.url || !normalizedItem.title) return false;

    // Very short content rejection
    const textToCheck = normalizedItem.content || normalizedItem.description || '';
    if (textToCheck.length < 20) return false;

    // Validations like duplicate URLs are managed by the ValidationEngine down the line.

    return true;
  }

  /**
   * Persists the current cursor/state via the Checkpoint Engine.
   */
  checkpoint() {
    this.checkpointEngine.saveCheckpoint({
      currentModule: 'CrawlerEngine',
      currentTask: this.name,
      apiState: this.state
    });
    this.logger.debug(this.name, 'Checkpoint', `Saved checkpoint for ${this.name}`, this.state);
  }

  /**
   * Loads the previous state to resume execution.
   */
  resume() {
    const cp = this.checkpointEngine.loadCheckpoint();
    if (cp && cp.currentTask === this.name && cp.apiState) {
       this.logger.info(this.name, 'Resume', `Resuming ${this.name} from checkpoint`);
       return cp.apiState;
    }
    return null;
  }

  /**
   * Cleans up after the crawler is fully complete (e.g., reached the end of all feeds).
   */
  cleanup() {
    this.state = this._getDefaultState();
    this.checkpoint();
    this.logger.info(this.name, 'Cleanup', `${this.name} completed and cleaned up.`);
  }

  /**
   * Executes an HTTP request using shared client and configuration headers.
   */
  fetch(url, options = {}) {
    // Inject default Crawler headers
    const headers = options.headers || {};
    if (!headers['User-Agent']) {
      headers['User-Agent'] = this.config.get('CRAWLER.USER_AGENT', 'TarkaX/1.0');
    }
    options.headers = headers;

    // Automatic retry and backoff is handled by HttpClient / RetryEngine
    return this.httpClient.request(url, options);
  }
}


/**
 * Data Validation Engine for Crawler Payload
 * Assures only valid, non-duplicate, meaningful data reaches enrichment.
 */
class CrawlerValidationEngine {
  constructor() {
    this.logger = AppLogger.getLogger('CrawlerValidationEngine');
    this.db = getDatabase();
    this.cache = CacheService.getScriptCache();
  }

  /**
   * Validates a normalized record against standard rules.
   * @param {Object} item Normalized Crawler output
   * @returns {Object} Validation result { isValid: boolean, reason: string|null }
   */
  validate(item) {
    if (!item || typeof item !== 'object') {
       return { isValid: false, reason: 'Malformed object' };
    }

    if (!item.url || item.url.trim() === '') {
       return { isValid: false, reason: 'Empty or missing URL' };
    }

    if (!item.title || item.title.trim() === '') {
       return { isValid: false, reason: 'Empty title' };
    }

    const textContent = `${item.title || ''} ${item.description || ''} ${item.content || ''}`;
    if (textContent.trim().length < 50) {
       return { isValid: false, reason: 'Very short content' };
    }

    // Check language config if available (Naive check)
    // Complex check uses NLP/AI in Enrichment phase. We just allow pass through here if not trivially spam.

    if (this._isDuplicate(item.url, item.title)) {
       return { isValid: false, reason: 'Duplicate URL or Title' };
    }

    return { isValid: true, reason: null };
  }

  /**
   * Checks if URL was recently crawled.
   * Leverages CacheService for fast lookups.
   */
  _isDuplicate(url, title) {
    const urlHash = Utils.generateHash(url);

    // 1. Check cache
    const cacheHit = this.cache.get(`crawl_url_${urlHash}`);
    if (cacheHit) return true;

    // 2. Check Database directly (if not in cache)
    // To minimize API calls in loop, we rely mostly on DB indices or batch checking if implemented.
    // For now we check the Sources/Leads table if needed, though DiscoveryHistory is active.
    // Assumption: we append to a Staging Table or rely purely on fast cache.
    // Let's implement a dummy query against standard DB table "Sources" (as per Phase 5 prompt spec)
    try {
      const records = this.db.findMany('Sources', { url: url });
      if (records && records.length > 0) {
         // Add to cache for next time
         this.cache.put(`crawl_url_${urlHash}`, '1', 21600); // 6 hours
         return true;
      }
    } catch (e) {
      // Table might not exist yet or no rows
    }

    // Mark as seen for immediate next iterations
    this.cache.put(`crawl_url_${urlHash}`, '1', 21600);
    return false;
  }
}

function getCrawlerValidationEngine() {
  if (!getCrawlerValidationEngine.instance) {
    getCrawlerValidationEngine.instance = new CrawlerValidationEngine();
  }
  return getCrawlerValidationEngine.instance;
}


/**
 * RSS Crawler Base
 * Fetches and parses RSS/Atom feeds to discover organization content.
 */
class RSSCrawler extends BaseCrawler {
  constructor() {
    super('RSSCrawler');
  }

  _getDefaultState() {
    return {
      feedIndex: 0,
      processedUrls: [],
      timestamp: Date.now()
    };
  }

  /**
   * Overridable config key for getting feeds so child classes can use different lists.
   */
  _getFeedsConfigKey() {
    return 'CRAWLER.DEFAULT_RSS_FEEDS';
  }

  crawl() {
    const feeds = this.config.get(this._getFeedsConfigKey(), []);
    if (feeds.length === 0 || this.state.feedIndex >= feeds.length) {
       return null; // Signals exhausted
    }

    const feedUrl = feeds[this.state.feedIndex];
    this.logger.debug(this.name, 'Crawl', `Fetching RSS feed: ${feedUrl}`);

    const response = this.fetch(feedUrl);
    if (!response.isSuccess) {
      this.logger.error(this.name, 'Crawl', `Failed to fetch RSS: ${feedUrl}`, response.statusCode);
      this.state.feedIndex++; // skip on fail
      return []; // Return empty but not exhausted since there might be more feeds
    }

    try {
      const document = XmlService.parse(response.text);
      const root = document.getRootElement();
      let entries = [];

      const atomNs = XmlService.getNamespace('http://www.w3.org/2005/Atom');

      // Determine if ATOM or RSS
      if (root.getName() === 'feed') {
        entries = root.getChildren('entry', atomNs);
      } else {
        const channel = root.getChild('channel');
        if (channel) entries = channel.getChildren('item');
      }

      const rawItems = [];
      for (const entry of entries) {
        let link = '';
        if (root.getName() === 'feed') {
           const linkEl = entry.getChild('link', atomNs);
           if (linkEl) link = linkEl.getAttribute('href').getValue();
        } else {
           const linkEl = entry.getChild('link');
           if (linkEl) link = linkEl.getText();
        }

        if (!link || this.state.processedUrls.includes(link)) continue;

        rawItems.push({
          xmlEntry: entry,
          link: link,
          feedType: root.getName()
        });

        this.state.processedUrls.push(link);
      }

      // keep array manageable
      if (this.state.processedUrls.length > 500) {
          this.state.processedUrls = this.state.processedUrls.slice(-200);
      }

      this.state.feedIndex++;
      return rawItems;
    } catch (e) {
      this.logger.error(this.name, 'Crawl', `Failed to parse XML for feed: ${feedUrl}`, e);
      this.state.feedIndex++;
      return [];
    }
  }

  normalize(rawItem) {
    const entry = rawItem.xmlEntry;
    const atomNs = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    const isAtom = rawItem.feedType === 'feed';

    let title = '', description = '', pubDate = '', author = '';

    if (isAtom) {
      title = entry.getChild('title', atomNs) ? entry.getChild('title', atomNs).getText() : '';
      description = entry.getChild('content', atomNs) ? entry.getChild('content', atomNs).getText() : '';
      if (!description) {
         description = entry.getChild('summary', atomNs) ? entry.getChild('summary', atomNs).getText() : '';
      }
      pubDate = entry.getChild('published', atomNs) ? entry.getChild('published', atomNs).getText() : '';
      const authNode = entry.getChild('author', atomNs);
      if (authNode) author = authNode.getChild('name', atomNs) ? authNode.getChild('name', atomNs).getText() : '';
    } else {
      title = entry.getChild('title') ? entry.getChild('title').getText() : '';
      description = entry.getChild('description') ? entry.getChild('description').getText() : '';
      const encodedNs = XmlService.getNamespace('content', 'http://purl.org/rss/1.0/modules/content/');
      if (entry.getChild('encoded', encodedNs)) {
         description = entry.getChild('encoded', encodedNs).getText();
      }
      pubDate = entry.getChild('pubDate') ? entry.getChild('pubDate').getText() : '';
      author = entry.getChild('creator', XmlService.getNamespace('dc', 'http://purl.org/dc/elements/1.1/'))
               ? entry.getChild('creator', XmlService.getNamespace('dc', 'http://purl.org/dc/elements/1.1/')).getText()
               : '';
    }

    return this._createNormalizedRecord({
      source: this.name,
      sourceType: 'News/Blog',
      title: title,
      description: description,
      content: description, // RSS usually has summary or full text
      url: rawItem.link,
      author: author,
      publishedAt: pubDate || new Date().toISOString()
    });
  }
}

class GenericRSSCrawler extends RSSCrawler {
  constructor() {
    super();
    this.name = 'GenericRSSCrawler';
  }
  _getFeedsConfigKey() {
    return 'CRAWLER.GENERIC_RSS_FEEDS';
  }
}

class EngineeringBlogCrawler extends RSSCrawler {
  constructor() {
    super();
    this.name = 'EngineeringBlogCrawler';
  }
  _getFeedsConfigKey() {
    return 'CRAWLER.ENGINEERING_RSS_FEEDS';
  }
}

class AIBlogCrawler extends RSSCrawler {
  constructor() {
    super();
    this.name = 'AIBlogCrawler';
  }
  _getFeedsConfigKey() {
    return 'CRAWLER.AI_RSS_FEEDS';
  }
}


/**
 * Reddit Crawler
 * Fetches JSON payload from Reddit
 */
class RedditCrawler extends BaseCrawler {
  constructor() {
    super('RedditCrawler');
  }

  _getDefaultState() {
    return {
      subredditIndex: 0,
      after: null,
      timestamp: Date.now()
    };
  }

  crawl() {
    const subs = this.config.get('CRAWLER.DEFAULT_SUBREDDITS', []);
    if (subs.length === 0 || this.state.subredditIndex >= subs.length) {
      return null;
    }

    const sub = subs[this.state.subredditIndex];
    let url = `https://www.reddit.com/r/${sub}/new.json?limit=25`;
    if (this.state.after) {
       url += `&after=${this.state.after}`;
    }

    // Rate Limit Pause
    const delay = this.config.get('CRAWLER.REDDIT_RATE_LIMIT_MS', 2000);
    Utilities.sleep(delay);

    const response = this.fetch(url);
    if (!response.isSuccess || !response.json) {
       this.logger.error(this.name, 'Crawl', `Reddit API failed for r/${sub}`, response.statusCode);
       this.state.subredditIndex++;
       this.state.after = null;
       return [];
    }

    const data = response.json.data;
    if (!data || !data.children || data.children.length === 0) {
       this.state.subredditIndex++;
       this.state.after = null;
       return [];
    }

    this.state.after = data.after;
    if (!this.state.after) {
       this.state.subredditIndex++;
    }

    return data.children;
  }

  normalize(rawItem) {
    const data = rawItem.data;
    return this._createNormalizedRecord({
      source: 'Reddit',
      sourceType: 'Community',
      title: data.title,
      description: data.selftext.substring(0, 500),
      content: data.selftext,
      url: `https://reddit.com${data.permalink}`,
      author: data.author,
      publishedAt: new Date(data.created_utc * 1000).toISOString(),
      rawJson: { score: data.score, num_comments: data.num_comments, subreddit: data.subreddit }
    });
  }
}


/**
 * GitHub Crawler
 * Searches public repositories for issues.
 */
class GitHubCrawler extends BaseCrawler {
  constructor() {
    super('GitHubCrawler');
  }

  _getDefaultState() {
    return {
      queryIndex: 0,
      searchTypeIndex: 0, // 0 = issues, 1 = repositories
      page: 1,
      timestamp: Date.now()
    };
  }

  crawl() {
    const queries = this.config.get('CRAWLER.GITHUB_QUERIES', []);
    const searchTypes = ['issues', 'repositories'];

    if (queries.length === 0 || this.state.queryIndex >= queries.length) {
        return null;
    }

    const query = queries[this.state.queryIndex];
    const searchType = searchTypes[this.state.searchTypeIndex];

    const url = `https://api.github.com/search/${searchType}?q=${encodeURIComponent(query)}&page=${this.state.page}&per_page=30`;

    Utilities.sleep(this.config.get('CRAWLER.GITHUB_RATE_LIMIT_MS', 1000));

    const response = this.fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (!response.isSuccess || !response.json) {
       this._advanceState(searchTypes);
       return [];
    }

    const items = response.json.items || [];

    // Attach type for normalizer
    const rawItems = items.map(item => ({ ...item, githubSearchType: searchType }));

    if (items.length < 30) {
       this._advanceState(searchTypes);
    } else {
       this.state.page++;
    }

    return rawItems;
  }

  _advanceState(searchTypes) {
    this.state.page = 1;
    this.state.searchTypeIndex++;
    if (this.state.searchTypeIndex >= searchTypes.length) {
       this.state.searchTypeIndex = 0;
       this.state.queryIndex++;
    }
  }

  normalize(rawItem) {
    if (rawItem.githubSearchType === 'repositories') {
       return this._createNormalizedRecord({
         source: 'GitHub',
         sourceType: 'CodeRepository',
         organization: rawItem.owner ? rawItem.owner.login : null,
         title: rawItem.full_name || rawItem.name,
         description: rawItem.description ? rawItem.description.substring(0, 500) : '',
         content: rawItem.description,
         url: rawItem.html_url,
         author: rawItem.owner ? rawItem.owner.login : null,
         publishedAt: rawItem.created_at,
         rawJson: { language: rawItem.language, topics: rawItem.topics, forks: rawItem.forks, stars: rawItem.stargazers_count }
       });
    }

    return this._createNormalizedRecord({
      source: 'GitHub',
      sourceType: 'CodeRepository',
      organization: rawItem.repository_url ? rawItem.repository_url.split('/').slice(-2, -1)[0] : null,
      title: rawItem.title,
      description: rawItem.body ? rawItem.body.substring(0, 500) : '',
      content: rawItem.body,
      url: rawItem.html_url,
      author: rawItem.user ? rawItem.user.login : null,
      publishedAt: rawItem.created_at,
      rawJson: { state: rawItem.state, labels: rawItem.labels }
    });
  }
}


/**
 * HackerNews Crawler
 */
class HackerNewsCrawler extends BaseCrawler {
  constructor() {
    super('HackerNewsCrawler');
  }

  _getDefaultState() {
    return {
      categoryIndex: 0,
      itemIds: [],
      processedIndex: 0
    };
  }

  crawl() {
    const categories = ['topstories', 'newstories', 'beststories', 'askstories', 'showstories'];
    if (this.state.categoryIndex >= categories.length) return null;

    const category = categories[this.state.categoryIndex];

    if (!this.state.itemIds || this.state.itemIds.length === 0) {
      const url = `https://hacker-news.firebaseio.com/v0/${category}.json`;
      const response = this.fetch(url);
      if (response.isSuccess && response.json) {
         this.state.itemIds = response.json;
         this.state.processedIndex = 0;
      } else {
         this.state.categoryIndex++;
         return [];
      }
    }

    const batch = this.state.itemIds.slice(this.state.processedIndex, this.state.processedIndex + 10);
    this.state.processedIndex += batch.length;

    if (this.state.processedIndex >= this.state.itemIds.length) {
      this.state.categoryIndex++;
      this.state.itemIds = [];
    }

    const items = [];
    for (const id of batch) {
       const url = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
       const res = this.fetch(url);
       if (res.isSuccess && res.json) {
          items.push(res.json);
       }
    }

    return items;
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'HackerNews',
      sourceType: 'Community',
      title: rawItem.title,
      description: rawItem.text || '',
      content: rawItem.text || '',
      url: rawItem.url || `https://news.ycombinator.com/item?id=${rawItem.id}`,
      author: rawItem.by,
      publishedAt: new Date(rawItem.time * 1000).toISOString(),
      rawJson: { score: rawItem.score, descendants: rawItem.descendants }
    });
  }
}


/**
 * Greenhouse ATS Crawler
 * Scrapes Greenhouse board API
 */
class GreenhouseCrawler extends BaseCrawler {
  constructor() {
    super('GreenhouseCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.GREENHOUSE_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    const url = `https://boards-api.greenhouse.io/v1/boards/${companyToken}/jobs?content=true`;

    const response = this.fetch(url);
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json || !response.json.jobs) {
       return [];
    }

    return response.json.jobs.map(job => ({ ...job, companyToken }));
  }

  normalize(rawItem) {
    // Greenhouse returns full html in content. We do a naive strip or just pass it to AI later.
    let cleanDescription = rawItem.content ? rawItem.content.replace(/<[^>]*>?/gm, ' ') : '';
    cleanDescription = cleanDescription.substring(0, 1000);

    return this._createNormalizedRecord({
      source: 'Greenhouse',
      sourceType: 'JobBoard',
      company: rawItem.companyToken, // approximate
      title: rawItem.title,
      description: cleanDescription,
      content: rawItem.content,
      url: rawItem.absolute_url,
      publishedAt: rawItem.updated_at || new Date().toISOString(),
      rawJson: { location: rawItem.location, department: rawItem.departments }
    });
  }
}

/**
 * Lever ATS Crawler
 */
class LeverCrawler extends BaseCrawler {
  constructor() {
    super('LeverCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.LEVER_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    const url = `https://api.lever.co/v0/postings/${companyToken}?mode=json`;

    const response = this.fetch(url);
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json) {
       return [];
    }

    // Response is an array of jobs
    return Array.isArray(response.json) ? response.json.map(job => ({ ...job, companyToken })) : [];
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'Lever',
      sourceType: 'JobBoard',
      company: rawItem.companyToken,
      title: rawItem.text,
      description: rawItem.descriptionPlain || '',
      content: rawItem.description || '',
      url: rawItem.hostedUrl,
      publishedAt: new Date(rawItem.createdAt).toISOString(),
      rawJson: { location: rawItem.categories }
    });
  }
}


/**
 * Ashby ATS Crawler
 */
class AshbyCrawler extends BaseCrawler {
  constructor() {
    super('AshbyCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.ASHBY_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    const url = `https://api.ashbyhq.com/posting-api/job-board/${companyToken}`;

    const response = this.fetch(url);
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json || !response.json.jobs) {
       return [];
    }

    return response.json.jobs.map(job => ({ ...job, companyToken }));
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'Ashby',
      sourceType: 'JobBoard',
      company: rawItem.companyToken,
      title: rawItem.title,
      description: rawItem.descriptionHtml ? rawItem.descriptionHtml.replace(/<[^>]*>?/gm, ' ').substring(0, 500) : '',
      content: rawItem.descriptionHtml || '',
      url: rawItem.jobUrl,
      publishedAt: rawItem.publishedAt || new Date().toISOString(),
      rawJson: { location: rawItem.location, department: rawItem.department }
    });
  }
}


/**
 * Workable ATS Crawler
 */
class WorkableCrawler extends BaseCrawler {
  constructor() {
    super('WorkableCrawler');
  }

  _getDefaultState() {
    return {
      companyIndex: 0,
      timestamp: Date.now()
    };
  }

  crawl() {
    const companies = this.config.get('CRAWLER.WORKABLE_COMPANIES', []);
    if (companies.length === 0 || this.state.companyIndex >= companies.length) {
       return null;
    }

    const companyToken = companies[this.state.companyIndex];
    // Workable uses an old JSONP endpoint but occasionally exposes RSS, let's use the known RSS/JSON schema
    const url = `https://apply.workable.com/api/v3/accounts/${companyToken}/jobs`;

    const response = this.fetch(url, { method: 'POST', payload: { limit: 50 } });
    this.state.companyIndex++;

    if (!response.isSuccess || !response.json || !response.json.results) {
       return [];
    }

    return response.json.results.map(job => ({ ...job, companyToken }));
  }

  normalize(rawItem) {
    return this._createNormalizedRecord({
      source: 'Workable',
      sourceType: 'JobBoard',
      company: rawItem.companyToken,
      title: rawItem.title,
      description: rawItem.description || '',
      content: rawItem.description || '',
      url: `https://apply.workable.com/${rawItem.companyToken}/j/${rawItem.shortcode}/`,
      publishedAt: rawItem.published_on || new Date().toISOString(),
      rawJson: { location: rawItem.location, department: rawItem.department }
    });
  }
}


// Global Factory
function getCrawlerPlugins() {
  return {
    RSSCrawler: new RSSCrawler(),
    GenericRSSCrawler: new GenericRSSCrawler(),
    EngineeringBlogCrawler: new EngineeringBlogCrawler(),
    AIBlogCrawler: new AIBlogCrawler(),
    RedditCrawler: new RedditCrawler(),
    GitHubCrawler: new GitHubCrawler(),
    HackerNewsCrawler: new HackerNewsCrawler(),
    GreenhouseCrawler: new GreenhouseCrawler(),
    LeverCrawler: new LeverCrawler(),
    AshbyCrawler: new AshbyCrawler(),
    WorkableCrawler: new WorkableCrawler()
  };
}


/**
 * Crawler Engine
 *
 * Orchestrates the execution of configured Crawler Plugins.
 * Pulls from CrawlerQueue or uses built-in default crawls depending on setup.
 * Normalizes, Validates, and places results into the ENRICHMENT Queue.
 */

class CrawlerEngine {
  constructor() {
    this.logger = AppLogger.getLogger('CrawlerEngine');
    this.config = getAppConfig();
    this.queueManager = getQueueManager();
    this.validator = getCrawlerValidationEngine();
    this.checkpointEngine = getCheckpointEngine();
    this.timeoutManager = getTimeoutManager();
  }

  /**
   * Main Execution Entry from Task Dispatcher.
   * payload may contain instructions like { plugin: 'RSSCrawler', target: '...' }
   */
  execute(payload) {
    this.logger.info('CrawlerEngine', 'Execute', 'Starting Crawler Engine execution.', payload);

    // We can be triggered generically or specifically for a plugin.
    // If specific, run it. Otherwise, loop enabled plugins.
    const specificPluginName = payload && payload.plugin ? payload.plugin : null;

    const enabledPlugins = this.config.get('CRAWLER.ENABLED_PLUGINS', []);
    const pluginsToRun = specificPluginName
                         ? enabledPlugins.filter(p => p === specificPluginName)
                         : enabledPlugins;

    if (pluginsToRun.length === 0) {
      this.logger.warn('CrawlerEngine', 'Execute', 'No crawler plugins are enabled or matched.');
      return { status: 'COMPLETED', payload: {} };
    }

    const availablePlugins = getCrawlerPlugins();

    let totalProcessed = 0;

    for (const pluginName of pluginsToRun) {
      this.timeoutManager.checkAndHaltIfNeeded(15000);

      const pluginInstance = availablePlugins[pluginName];
      if (!pluginInstance) {
         this.logger.error('CrawlerEngine', 'Execute', `Plugin ${pluginName} not found in factory.`);
         continue;
      }

      try {
        pluginInstance.initialize();

        let hasMore = true;
        let pluginBatchCount = 0;
        const BATCH_LIMIT = this.config.get('CRAWLER.BATCH_SIZE', 50);

        while (hasMore && pluginBatchCount < BATCH_LIMIT) {
           this.timeoutManager.checkAndHaltIfNeeded(5000);

           const rawItems = pluginInstance.crawl();

           // If rawItems is explicitly null, the crawler asserts it is exhausted (e.g., all feeds processed).
           // If it is simply an empty array [], it means it found nothing on this pass or rate-limited.
           if (rawItems === null) {
             hasMore = false;
             break;
           }

           if (Array.isArray(rawItems) && rawItems.length === 0) {
              // Empty array means no results this page/feed, but there might be more later or next feed.
              // Just break out of the while loop to yield time, but DO NOT mark as exhausted.
              pluginInstance.checkpoint();
              break;
           }

           const acceptedRecords = [];
           const rejectedRecords = [];

           for (const raw of rawItems) {
              try {
                 const normalized = pluginInstance.normalize(raw);
                 const validResult = this.validator.validate(normalized);

                 if (validResult.isValid) {
                    acceptedRecords.push(normalized);
                 } else {
                    rejectedRecords.push({ url: normalized.url, title: normalized.title, reason: validResult.reason });
                 }
              } catch (e) {
                 this.logger.error('CrawlerEngine', 'Normalization', `Error normalizing item in ${pluginName}`, e);
                 rejectedRecords.push({ error: e.message });
              }
           }

           // Queue accepted records for Enrichment
           if (acceptedRecords.length > 0) {
              const queueItems = acceptedRecords.map(r => ({
                 taskType: 'ENRICHMENT',
                 payload: r
              }));
              this.queueManager.enqueueBatch(queueItems);
              totalProcessed += acceptedRecords.length;
           }

           // Log rejected stats and save to a RejectionDB table
           if (rejectedRecords.length > 0) {
              this.logger.info('CrawlerEngine', 'Validation', `${pluginName} rejected ${rejectedRecords.length} records.`, { sample: rejectedRecords[0] });
              try {
                  const db = getDatabase();
                  db.batchInsert('RejectedCrawls', rejectedRecords.map(r => ({
                     crawlerName: pluginName,
                     url: r.url || 'Unknown',
                     title: r.title || 'Unknown',
                     reason: r.reason || r.error || 'Unknown Validation Failure',
                     rejectedAt: new Date().toISOString()
                  })));
              } catch (dbError) {
                  this.logger.warn('CrawlerEngine', 'Validation', 'Could not save rejected records to DB. Table may not exist yet.');
              }
           }

           pluginBatchCount += rawItems.length;
           pluginInstance.checkpoint(); // save state inside plugin
        }

        // Cleanup if source naturally exhausted
        if (!hasMore) {
           pluginInstance.cleanup();
        }

      } catch (pluginError) {
        this.logger.error('CrawlerEngine', 'PluginExecution', `${pluginName} failed execution`, pluginError);
        // We do not rethrow. Let other plugins run.
      }
    }

    return { status: 'COMPLETED', payload: { recordsProcessed: totalProcessed } };
  }
}

function getCrawlerEngine() {
  if (!getCrawlerEngine.instance) {
    getCrawlerEngine.instance = new CrawlerEngine();
  }
  return getCrawlerEngine.instance;
}



/******************************************************************
ENRICHMENT
******************************************************************/

/**
 * Knowledge Graph Engine
 *
 * Core engine for Knowledge Graph (Phase 9).
 * Transforms independent lead records into an enterprise-wide relational graph.
 */

class KnowledgeGraphEngine {
  constructor() {
    this.db = getDatabase();
    this.resolver = getEntityResolver();
    this.indexManager = getGraphIndexManager();
  }

  // ==========================================================================
  // NODE OPERATIONS
  // ==========================================================================

  createNode(nodeType, rawName, properties = {}) {
    Validation.assertString(nodeType, 'Node Type');
    Validation.assertString(rawName, 'Raw Name');

    const resolution = this.resolver.resolveEntity(rawName, nodeType);
    const canonicalName = resolution ? resolution.canonicalName : rawName;

    // First consult EntityResolver's rigorous duplicate detection
    const existingIds = this.resolver.findDuplicates(nodeType, { canonicalName: canonicalName, ...properties });

    if (existingIds.length > 0) {
      this._emitEvent('NODE_MERGED', existingIds[0], { canonicalName, originalName: rawName });
      return existingIds[0];
    }

    const uuid = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    const record = {
      uuid: uuid,
      nodeType: nodeType,
      canonicalName: canonicalName,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: JSON.stringify(properties)
    };

    for (const [key, val] of Object.entries(properties)) {
      if (key !== 'metadata') record[key] = val;
    }

    this.db.withLock(() => {
      this.db.beginTransaction();
      this.db.create(nodeType, record);
      this.db.commitTransaction();
    });

    this.indexManager.updateIndex(nodeType, 'canonicalName', canonicalName, uuid);
    if (properties.domain) this.indexManager.updateIndex(nodeType, 'domain', properties.domain, uuid);
    if (properties.linkedInUrl) this.indexManager.updateIndex(nodeType, 'linkedInUrl', properties.linkedInUrl, uuid);
    if (properties.website) this.indexManager.updateIndex(nodeType, 'website', properties.website, uuid);

    this._emitEvent('NODE_CREATED', uuid, { nodeType, canonicalName });
    return uuid;
  }

  updateNode(nodeType, uuid, properties) {
    Validation.assertString(nodeType, 'Node Type');
    Validation.assertString(uuid, 'UUID');

    this.db.withLock(() => {
      this.db.beginTransaction();

      const records = this.db.read(nodeType, { uuid: uuid });
      if (records.length === 0) throw new Error(`KnowledgeGraphEngine: Node ${uuid} not found in ${nodeType}`);

      const existingRecord = records[0];
      const updatedMetadata = { ...JSON.parse(existingRecord.metadata || '{}'), ...properties };

      this.db.update(nodeType, existingRecord._id, {
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(updatedMetadata),
        ...properties
      });

      this.db.commitTransaction();
    });

    this._emitEvent('NODE_UPDATED', uuid, properties);
  }

  deleteNode(nodeType, uuid) {
    Validation.assertString(nodeType, 'Node Type');
    Validation.assertString(uuid, 'UUID');

    this.db.withLock(() => {
      this.db.beginTransaction();

      const records = this.db.read(nodeType, { uuid: uuid });
      if (records.length > 0) {
        this.db.delete(nodeType, records[0]._id);

        // Invalidate Node Indexes
        if (records[0].canonicalName) this.indexManager.removeFromIndex(nodeType, 'canonicalName', records[0].canonicalName, uuid);
        if (records[0].domain) this.indexManager.removeFromIndex(nodeType, 'domain', records[0].domain, uuid);
      }

      const edges = this.findRelationships(uuid);
      for (const edge of edges) {
        this.db.delete('Relationships', edge._id);
        // Invalidate Rel Index
        this.indexManager.removeRelationshipFromIndex(edge.sourceNodeId, edge.targetNodeId, edge.relationshipId);
      }

      this.db.commitTransaction();
    });

    this._emitEvent('NODE_DELETED', uuid, { nodeType });
  }

  findNode(nodeType, uuid) {
    const records = this.db.read(nodeType, { uuid: uuid });
    return records.length > 0 ? records[0] : null;
  }

  nodeExists(nodeType, uuid) {
    return this.findNode(nodeType, uuid) !== null;
  }

  // ==========================================================================
  // RELATIONSHIP OPERATIONS
  // ==========================================================================

  createRelationship(sourceNodeId, targetNodeId, relationshipType, metadata = {}) {
    Validation.assertString(sourceNodeId, 'Source Node ID');
    Validation.assertString(targetNodeId, 'Target Node ID');
    Validation.assertString(relationshipType, 'Relationship Type');

    const outEdges = this.indexManager.getRelationships(sourceNodeId, 'OUT');
    const existingEdges = outEdges.filter(e => e.targetNodeId === targetNodeId && e.relationshipType === relationshipType);

    if (existingEdges.length > 0) {
      const edge = existingEdges[0];
      this.db.withLock(() => {
         const dbEdges = this.db.read('Relationships', { relationshipId: edge.relationshipId });
         if (dbEdges.length > 0) {
            this.db.update('Relationships', dbEdges[0]._id, {
               updatedAt: new Date().toISOString(),
               confidence: Math.min((dbEdges[0].confidence || 1) + 0.1, 1.0),
               metadata: JSON.stringify({ ...JSON.parse(dbEdges[0].metadata || '{}'), ...metadata })
            });
         }
      });
      this._emitEvent('RELATIONSHIP_UPDATED', edge.relationshipId, { sourceNodeId, targetNodeId });
      return edge.relationshipId;
    }

    const relId = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    const record = {
      relationshipId: relId,
      sourceNodeId: sourceNodeId,
      targetNodeId: targetNodeId,
      relationshipType: relationshipType,
      confidence: metadata.confidence || 1.0,
      sourceSystem: metadata.sourceSystem || 'Unknown',
      evidence: metadata.evidence || '',
      metadata: JSON.stringify(metadata),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.db.withLock(() => {
      this.db.beginTransaction();
      this.db.create('Relationships', record);
      this.db.commitTransaction();
    });

    // Update indexes dynamically
    this.indexManager.updateRelationshipIndex(sourceNodeId, targetNodeId, record);

    this._emitEvent('RELATIONSHIP_CREATED', relId, { sourceNodeId, targetNodeId, relationshipType });
    return relId;
  }

  deleteRelationship(relationshipId) {
    Validation.assertString(relationshipId, 'Relationship ID');

    this.db.withLock(() => {
      this.db.beginTransaction();
      const records = this.db.read('Relationships', { relationshipId: relationshipId });
      if (records.length > 0) {
         this.db.delete('Relationships', records[0]._id);

         // Invalidate Rel Index
         this.indexManager.removeRelationshipFromIndex(records[0].sourceNodeId, records[0].targetNodeId, relationshipId);
      }
      this.db.commitTransaction();
    });
    this._emitEvent('RELATIONSHIP_DELETED', relationshipId);
  }

  relationshipExists(sourceNodeId, targetNodeId, relationshipType) {
    const outEdges = this.indexManager.getRelationships(sourceNodeId, 'OUT');
    return outEdges.some(e => e.targetNodeId === targetNodeId && e.relationshipType === relationshipType);
  }

  findRelationships(nodeId) {
    const inEdges = this.indexManager.getRelationships(nodeId, 'IN');
    const outEdges = this.indexManager.getRelationships(nodeId, 'OUT');
    return [...inEdges, ...outEdges];
  }

  // ==========================================================================
  // TRAVERSAL AND ALGORITHMS
  // ==========================================================================

  findNeighbors(nodeId, relationshipType = null, direction = 'BOTH') {
    let edges = [];
    if (direction === 'OUT' || direction === 'BOTH') {
        edges = edges.concat(this.indexManager.getRelationships(nodeId, 'OUT'));
    }
    if (direction === 'IN' || direction === 'BOTH') {
        edges = edges.concat(this.indexManager.getRelationships(nodeId, 'IN'));
    }

    if (relationshipType) {
        edges = edges.filter(e => e.relationshipType === relationshipType);
    }

    const neighbors = [];
    for (const edge of edges) {
      if (edge.sourceNodeId === nodeId) {
        neighbors.push({ edge, neighborId: edge.targetNodeId, dir: 'OUT' });
      } else if (edge.targetNodeId === nodeId) {
        neighbors.push({ edge, neighborId: edge.sourceNodeId, dir: 'IN' });
      }
    }
    return neighbors;
  }

  graphTraversal(startNodeId, maxDepth = 2) {
    const visited = new Set();
    const queue = [{ id: startNodeId, depth: 0 }];
    const subgraph = { nodes: [], edges: [] };

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id)) continue;

      visited.add(id);
      subgraph.nodes.push(id);

      if (depth < maxDepth) {
        const neighbors = this.findNeighbors(id);
        for (const n of neighbors) {
          subgraph.edges.push(n.edge);
          if (!visited.has(n.neighborId)) {
            queue.push({ id: n.neighborId, depth: depth + 1 });
          }
        }
      }
    }
    return subgraph;
  }

  exportSubgraph(startNodeId, maxDepth = 2) {
    const subgraph = this.graphTraversal(startNodeId, maxDepth);
    const nodeDetails = [];

    for (const nodeId of subgraph.nodes) {
       let nodeFound = false;
       for (const type of Object.keys(getGraphSchemaRegistry().nodeTypes)) {
          const node = this.findNode(type, nodeId);
          if (node) {
             nodeDetails.push(node);
             nodeFound = true;
             break;
          }
       }
       if (!nodeFound) {
          nodeDetails.push({ uuid: nodeId, unknown: true });
       }
    }
    return { nodes: nodeDetails, edges: subgraph.edges };
  }

  expandGraph(payload) {
    const companyId = this.createNode('Companies', payload.company, { domain: payload.domain, website: payload.website });

    if (payload.industry) {
      const industryId = this.createNode('Industries', payload.industry);
      this.createRelationship(companyId, industryId, 'COMPANY_OPERATES_IN');
    }

    if (payload.aiPainCategories) {
      const pains = payload.aiPainCategories.split(',').map(s => s.trim());
      pains.forEach(pain => {
         if(pain) {
            const painId = this.createNode('PainPoints', pain);
            this.createRelationship(companyId, painId, 'COMPANY_HAS_PAIN', { sourceSystem: payload.sourceType || 'Crawler' });
         }
      });
    }

    if (payload.technologiesMentioned) {
      const techs = payload.technologiesMentioned.split(',').map(s => s.trim());
      techs.forEach(tech => {
         if(tech) {
            const techId = this.createNode('Technologies', tech);
            this.createRelationship(companyId, techId, 'COMPANY_USES_TECH');
         }
      });
    }

    this._emitEvent('GRAPH_EXPANDED', companyId, { nodesAdded: true });
    return companyId;
  }

  mergeNodes(targetNodeId, sourceNodeId) {
     if (targetNodeId === sourceNodeId) return;

     this.db.withLock(() => {
        this.db.beginTransaction();

        const inEdges = this.indexManager.getRelationships(sourceNodeId, 'IN');
        const outEdges = this.indexManager.getRelationships(sourceNodeId, 'OUT');
        const edges = [...inEdges, ...outEdges];

        for (const edge of edges) {
           const dbEdges = this.db.read('Relationships', { relationshipId: edge.relationshipId });
           if (dbEdges.length > 0) {
              if (edge.sourceNodeId === sourceNodeId) {
                 this.db.update('Relationships', dbEdges[0]._id, { sourceNodeId: targetNodeId });
              } else {
                 this.db.update('Relationships', dbEdges[0]._id, { targetNodeId: targetNodeId });
              }
              // Invalidate rel index for updated relationships
              this.indexManager.removeRelationshipFromIndex(edge.sourceNodeId, edge.targetNodeId, edge.relationshipId);
           }
        }

        for (const type of Object.keys(getGraphSchemaRegistry().nodeTypes)) {
           const records = this.db.read(type, { uuid: sourceNodeId });
           if (records.length > 0) {
              this.db.delete(type, records[0]._id);
              if (records[0].canonicalName) this.indexManager.removeFromIndex(type, 'canonicalName', records[0].canonicalName, sourceNodeId);
              break;
           }
        }

        this.db.commitTransaction();
     });
     this._emitEvent('NODE_MERGED', targetNodeId, { mergedFrom: sourceNodeId });
  }

  // ==========================================================================
  // SPECIFIC BUSINESS QUERIES
  // ==========================================================================

  findCompaniesByPain(canonicalPainName) {
    const painIds = this._resolveNodeIdsSafe('PainPoints', 'canonicalName', canonicalPainName);
    if (painIds.length === 0) return [];

    const companies = new Set();
    for (const painId of painIds) {
      const neighbors = this.findNeighbors(painId, 'COMPANY_HAS_PAIN', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesByTechnology(canonicalTechName) {
    const techIds = this._resolveNodeIdsSafe('Technologies', 'canonicalName', canonicalTechName);
    if (techIds.length === 0) return [];

    const companies = new Set();
    for (const techId of techIds) {
      const neighbors = this.findNeighbors(techId, 'COMPANY_USES_TECH', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesByIndustry(canonicalIndustryName) {
    const indIds = this._resolveNodeIdsSafe('Industries', 'canonicalName', canonicalIndustryName);
    if (indIds.length === 0) return [];

    const companies = new Set();
    for (const indId of indIds) {
      const neighbors = this.findNeighbors(indId, 'COMPANY_OPERATES_IN', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesHiring(jobRole) {
    const indIds = this._resolveNodeIdsSafe('HiringSignals', 'canonicalName', jobRole);
    if (indIds.length === 0) return [];

    const companies = new Set();
    for (const indId of indIds) {
      const neighbors = this.findNeighbors(indId, 'COMPANY_HIRING_FOR', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesByFunding(fundingStage) {
    const indIds = this._resolveNodeIdsSafe('FundingSignals', 'canonicalName', fundingStage);
    if (indIds.length === 0) return [];

    const companies = new Set();
    for (const indId of indIds) {
      const neighbors = this.findNeighbors(indId, 'COMPANY_FUNDED_BY', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  _resolveNodeIdsSafe(nodeType, field, value) {
     let existingIds = this.resolver.findDuplicates(nodeType, { [field]: value });
     return existingIds;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  _emitEvent(eventType, entityId, details = {}) {
    getExecutionLogger().info('KnowledgeGraphEngine', eventType, `Entity: ${entityId}`, details);
    try {
      this.db.create('GraphLogs', {
        logId: Utilities.getUuid(),
        eventType: eventType,
        entityId: entityId,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString()
      });
    } catch(e) {}
  }
}

function getKnowledgeGraphEngine() {
  if (!getKnowledgeGraphEngine.instance) {
    getKnowledgeGraphEngine.instance = new KnowledgeGraphEngine();
  }
  return getKnowledgeGraphEngine.instance;
}


/**
 * Graph Analytics Engine
 *
 * Dedicated engine for generating metrics and insights from the Knowledge Graph.
 * Supports:
 * - Centrality and Connectivity
 * - Node/Relationship counts
 * - Pain and Industry Clustering
 * - Executive influence
 * - Company influence
 * - Growth velocity
 */

class GraphAnalytics {
  constructor() {
    this.db = getDatabase();
    this.graphEngine = getKnowledgeGraphEngine();
    this.indexManager = getGraphIndexManager();
  }

  generateGraphMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      nodeCounts: {},
      totalRelationships: 0,
      relationshipTypes: {}
    };

    try {
      const registry = getGraphSchemaRegistry();
      for (const nodeType of Object.keys(registry.nodeTypes)) {
        const records = this.db.read(nodeType);
        metrics.nodeCounts[nodeType] = records.length;
      }

      const relationships = this.db.read('Relationships');
      metrics.totalRelationships = relationships.length;

      for (const rel of relationships) {
        metrics.relationshipTypes[rel.relationshipType] = (metrics.relationshipTypes[rel.relationshipType] || 0) + 1;
      }

      return metrics;
    } catch (e) {
      getExecutionLogger().error('GraphAnalytics', 'generateGraphMetrics', 'Failed to generate metrics', e);
      return metrics;
    }
  }

  getMostConnectedCompanies(limit = 10) {
    const relationships = this.db.read('Relationships');
    const degreeMap = {};

    for (const rel of relationships) {
      if (rel.relationshipType.startsWith('COMPANY_')) {
        degreeMap[rel.sourceNodeId] = (degreeMap[rel.sourceNodeId] || 0) + 1;
      }
    }

    const sortedNodeIds = Object.entries(degreeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const results = [];
    for (const [nodeId, degree] of sortedNodeIds) {
      const node = this.graphEngine.findNode('Companies', nodeId);
      if (node) {
        results.push({
          companyName: node.canonicalName,
          uuid: node.uuid,
          degree: degree
        });
      }
    }

    return results;
  }

  getMostCommonPainPoints(limit = 10) {
    const relationships = this.db.read('Relationships', { relationshipType: 'COMPANY_HAS_PAIN' });
    const painMap = {};

    for (const rel of relationships) {
      painMap[rel.targetNodeId] = (painMap[rel.targetNodeId] || 0) + 1;
    }

    const sortedPains = Object.entries(painMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const results = [];
    for (const [nodeId, count] of sortedPains) {
      const node = this.graphEngine.findNode('PainPoints', nodeId);
      if (node) {
        results.push({
          painName: node.canonicalName,
          uuid: node.uuid,
          occurrences: count
        });
      }
    }

    return results;
  }

  detectTrends(days = 7) {
    const logs = this.db.read('GraphLogs', { eventType: 'RELATIONSHIP_CREATED' });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = logs.filter(log => new Date(log.timestamp) >= cutoffDate);

    const trendMap = {};
    for (const event of recentEvents) {
      let details = {};
      try { details = JSON.parse(event.details || '{}'); } catch(e) {}

      const relType = details.relationshipType || 'UNKNOWN';
      trendMap[relType] = (trendMap[relType] || 0) + 1;
    }

    return trendMap;
  }

  // --- Requested Features ---

  getIndustryClustering(limit = 10) {
     const relationships = this.db.read('Relationships', { relationshipType: 'COMPANY_OPERATES_IN' });
     const industryMap = {};
     for (const rel of relationships) {
        industryMap[rel.targetNodeId] = (industryMap[rel.targetNodeId] || 0) + 1;
     }

     const sortedInd = Object.entries(industryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

     return sortedInd.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Industries', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', count };
     });
  }

  getExecutiveInfluence(limit = 10) {
      const relationships = this.db.read('Relationships', { relationshipType: 'EXECUTIVE_WORKS_AT' });
      const execMap = {};
      for (const rel of relationships) {
          execMap[rel.sourceNodeId] = (execMap[rel.sourceNodeId] || 0) + 1;
      }

      const sortedExec = Object.entries(execMap)
         .sort((a, b) => b[1] - a[1])
         .slice(0, limit);

      return sortedExec.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Executives', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', companies: count };
      });
  }

  getCompanyInfluence(limit = 10) {
      const relationships = this.db.read('Relationships');
      const infMap = {};

      for (const rel of relationships) {
          if (rel.relationshipType === 'COMPANY_INTERESTED_IN' || rel.relationshipType === 'COMPANY_EVALUATING') {
              infMap[rel.targetNodeId] = (infMap[rel.targetNodeId] || 0) + 1;
          }
      }

      const sortedComp = Object.entries(infMap)
         .sort((a, b) => b[1] - a[1])
         .slice(0, limit);

      return sortedComp.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Companies', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', followers: count };
      });
  }

  getGrowthVelocity(days = 30) {
      const relationships = this.db.read('Relationships', { relationshipType: 'COMPANY_HIRING_FOR' });
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const velocityMap = {};
      for (const rel of relationships) {
          if (new Date(rel.createdAt) >= cutoffDate) {
              velocityMap[rel.sourceNodeId] = (velocityMap[rel.sourceNodeId] || 0) + 1;
          }
      }

      const sortedVel = Object.entries(velocityMap)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 10);

      return sortedVel.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Companies', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', hiringSignals: count };
      });
  }
}

function getGraphAnalytics() {
  if (!getGraphAnalytics.instance) {
    getGraphAnalytics.instance = new GraphAnalytics();
  }
  return getGraphAnalytics.instance;
}


/**
 * Graph Tasks Registration
 *
 * Registers Knowledge Graph task handlers with the TaskDispatcher.
 * Enables the ExecutionEngine to asynchronously orchestrate graph updates.
 */

function registerGraphTasks() {
  const dispatcher = getTaskDispatcher();
  const graphEngine = getKnowledgeGraphEngine();
  const indexManager = getGraphIndexManager();
  const resolver = getEntityResolver();

  // Task: CREATE_GRAPH_NODE
  // Payload: { nodeType, rawName, properties }
  dispatcher.registerTask('CREATE_GRAPH_NODE', (payload) => {
    Validation.assertObject(payload, 'Graph Node Payload');
    const uuid = graphEngine.createNode(payload.nodeType, payload.rawName, payload.properties || {});
    return { status: 'COMPLETED', result: uuid };
  });

  // Task: UPDATE_GRAPH_NODE
  // Payload: { nodeType, uuid, properties }
  dispatcher.registerTask('UPDATE_GRAPH_NODE', (payload) => {
    Validation.assertObject(payload, 'Graph Node Update Payload');
    graphEngine.updateNode(payload.nodeType, payload.uuid, payload.properties || {});
    return { status: 'COMPLETED' };
  });

  // Task: CREATE_RELATIONSHIP
  // Payload: { sourceNodeId, targetNodeId, relationshipType, metadata }
  dispatcher.registerTask('CREATE_RELATIONSHIP', (payload) => {
    Validation.assertObject(payload, 'Graph Relationship Payload');
    const relId = graphEngine.createRelationship(
      payload.sourceNodeId,
      payload.targetNodeId,
      payload.relationshipType,
      payload.metadata || {}
    );
    return { status: 'COMPLETED', result: relId };
  });

  // Task: REBUILD_INDEX
  // Payload: { nodeType, field }
  dispatcher.registerTask('REBUILD_INDEX', (payload) => {
    Validation.assertObject(payload, 'Rebuild Index Payload');
    indexManager.rebuildIndex(payload.nodeType, payload.field);
    return { status: 'COMPLETED' };
  });

  // Task: REFRESH_ALIAS_CACHE
  // Payload: {}
  dispatcher.registerTask('REFRESH_ALIAS_CACHE', (payload) => {
    resolver.refreshAliasCache();
    return { status: 'COMPLETED' };
  });
}


/**
 * Entity Resolution Engine
 *
 * Dedicated engine responsible for:
 * - Alias normalization
 * - Canonicalization
 * - Duplicate detection
 * - Similarity scoring
 * - Confidence scoring
 * - Merge recommendations
 */

class EntityResolver {
  constructor() {
    this.db = getDatabase();
    this.cache = CacheService.getScriptCache();
    this.ALIAS_CACHE_KEY = 'GRAPH_ALIASES_CACHE';
    this.CACHE_TTL = 3600; // 1 hour

    // Minimal common suffixes to strip for canonicalization
    this.commonSuffixes = [' inc', ' inc.', ' corp', ' corp.', ' llc', ' ltd', ' ltd.', ' corporation', ' company'];
  }

  /**
   * Initializes or refreshes the alias cache from the GraphAliases sheet.
   */
  refreshAliasCache() {
    try {
      const records = this.db.read('GraphAliases');
      const aliasMap = {};

      for (const record of records) {
        if (record.alias && record.canonicalName) {
          const key = record.alias.toLowerCase().trim();
          aliasMap[key] = {
            canonicalName: record.canonicalName,
            nodeType: record.nodeType,
            confidence: record.confidence
          };
        }
      }

      const payload = JSON.stringify(aliasMap);
      if (payload.length < 90000) {
        this.cache.put(this.ALIAS_CACHE_KEY, payload, this.CACHE_TTL);
      } else {
        getExecutionLogger().warn('EntityResolver', 'refreshAliasCache', 'Alias map too large for single cache key.');
      }
      return aliasMap;
    } catch (e) {
      getExecutionLogger().error('EntityResolver', 'refreshAliasCache', 'Failed to refresh alias cache.', e);
      return {};
    }
  }

  _getAliasMap() {
    const cached = this.cache.get(this.ALIAS_CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return this.refreshAliasCache();
  }

  resolveEntity(rawName, expectedNodeType) {
    if (!rawName) return null;

    const normalizedRaw = rawName.toLowerCase().trim();
    const aliasMap = this._getAliasMap();

    // 1. Check exact alias match
    if (aliasMap[normalizedRaw]) {
      const match = aliasMap[normalizedRaw];
      if (!expectedNodeType || match.nodeType === expectedNodeType) {
        return {
          canonicalName: match.canonicalName,
          confidence: match.confidence || 1.0,
          isAliasMatch: true
        };
      }
    }

    // 2. Fallback to heuristic string canonicalization
    let heuristicName = normalizedRaw;
    if (expectedNodeType === 'Companies') {
      for (const suffix of this.commonSuffixes) {
        if (heuristicName.endsWith(suffix)) {
          heuristicName = heuristicName.substring(0, heuristicName.length - suffix.length).trim();
        }
      }
    }

    const titleCased = this._titleCase(heuristicName);
    return {
      canonicalName: titleCased,
      confidence: 0.7,
      isAliasMatch: false
    };
  }

  computeSimilarity(str1, str2) {
    if (!str1 || !str2) return 0.0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;

    const tokenize = (s) => new Set(s.split(/\s+/));
    const set1 = tokenize(s1);
    const set2 = tokenize(s2);

    let intersection = 0;
    for (const token of set1) {
      if (set2.has(token)) intersection++;
    }

    const union = set1.size + set2.size - intersection;
    if (union === 0) return 0.0;
    return intersection / union;
  }

  _titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  /**
   * Complex deduplication checking.
   * Compares names, domains, websites, and semantic similarity.
   */
  findDuplicates(nodeType, candidateProps) {
    const indexMgr = getGraphIndexManager();
    const results = new Set();

    // 1. Check Exact Name Match or Domain/LinkedIn matches via index
    if (candidateProps.canonicalName) {
       indexMgr.lookup(nodeType, 'canonicalName', candidateProps.canonicalName).forEach(id => results.add(id));
       const dbHits = this.db.read(nodeType, { canonicalName: candidateProps.canonicalName });
       dbHits.forEach(r => results.add(r.uuid));
    }

    if (candidateProps.domain) {
       indexMgr.lookup(nodeType, 'domain', candidateProps.domain).forEach(id => results.add(id));
       const dbHits = this.db.read(nodeType, { domain: candidateProps.domain });
       dbHits.forEach(r => results.add(r.uuid));
    }

    if (candidateProps.linkedInUrl) {
       indexMgr.lookup(nodeType, 'linkedInUrl', candidateProps.linkedInUrl).forEach(id => results.add(id));
       const dbHits = this.db.read(nodeType, { linkedInUrl: candidateProps.linkedInUrl });
       dbHits.forEach(r => results.add(r.uuid));
    }

    if (candidateProps.website) {
       indexMgr.lookup(nodeType, 'website', candidateProps.website).forEach(id => results.add(id));
       const dbHits = this.db.read(nodeType, { website: candidateProps.website });
       dbHits.forEach(r => results.add(r.uuid));
    }

    // 2. Semantic Similarity Fallback (if no strict matches and node is small dataset like PainPoints)
    if (results.size === 0 && candidateProps.canonicalName) {
        // Read all nodes for fuzzy match. Only do this for smaller tables to prevent O(N) issues
        if (nodeType !== 'Companies') {
           const allNodes = this.db.read(nodeType);
           for (const node of allNodes) {
               const sim = this.computeSimilarity(node.canonicalName, candidateProps.canonicalName);
               if (sim > 0.85) {
                   results.add(node.uuid);
               }
           }
        }
    }

    return Array.from(results);
  }
}

function getEntityResolver() {
  if (!getEntityResolver.instance) {
    getEntityResolver.instance = new EntityResolver();
  }
  return getEntityResolver.instance;
}


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



/******************************************************************
LEAD SCORING
******************************************************************/

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



/******************************************************************
DASHBOARD
******************************************************************/

/**
 * Dashboard Engine
 *
 * Implements an automated executive operations center.
 * It transforms operational data from Google Sheets into a real-time command center.
 */

class DashboardEngine {
  constructor() {
    this.logger = getExecutionLogger();
    this.config = getConfig();
    this.db = getDatabase();
    this.SHEET_NAME = this.config.get('DASHBOARD.SHEET_NAME', 'Dashboard');
    this.HEADER_BG = this.config.get('DASHBOARD.COLORS.HEADER_BG', '#202124');
    this.HEADER_TEXT = this.config.get('DASHBOARD.COLORS.HEADER_TEXT', 'white');
    this.TABLE_HEADER = this.config.get('DASHBOARD.COLORS.TABLE_HEADER', '#e8eaed');
    this.BG_COLOR = this.config.get('DASHBOARD.COLORS.BACKGROUND', '#f8f9fa');
    this.FONT = this.config.get('DASHBOARD.FONTS.MAIN', 'Google Sans');
  }

  /**
   * Main entry point to refresh the dashboard.
   */
  updateDashboard() {
    this.logger.info('DashboardEngine', 'updateDashboard', 'Starting dashboard update.');

    // Performance Tracking
    const startTime = Date.now();
    let lock;
    try {
      lock = LockService.getScriptLock();
    } catch (e) {
      this.logger.warn('DashboardEngine', 'updateDashboard', 'LockService unavailable.');
    }

    if (lock && !lock.tryLock(30000)) {
        this.logger.warn('DashboardEngine', 'updateDashboard', 'Could not acquire script lock for dashboard update.');
        return;
    }

    try {
      // Self-healing: if the sheet doesn't exist, this creates and builds the visual framework
      this.createDashboard();

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.SHEET_NAME);
      if (!sheet) return; // Edge case or unbound script

      const props = getScriptProps();
      const lastLeadsCount = parseInt(props.get('DASHBOARD_LAST_LEADS_COUNT', '0'), 10);
      const lastRawLeadsCount = parseInt(props.get('DASHBOARD_LAST_RAW_LEADS_COUNT', '0'), 10);

      // Load once
      const leads = this.db.findAll('Leads') || [];
      const rawLeads = this.db.findAll('RawLeads') || [];

      const currentLeadsCount = leads.length;
      const currentRawLeadsCount = rawLeads.length;

      const shouldFullRefresh = currentLeadsCount !== lastLeadsCount || currentRawLeadsCount !== lastRawLeadsCount;

      this.refreshDashboard(sheet, shouldFullRefresh, startTime, leads, rawLeads);

      props.set('DASHBOARD_LAST_LEADS_COUNT', currentLeadsCount.toString());
      props.set('DASHBOARD_LAST_RAW_LEADS_COUNT', currentRawLeadsCount.toString());

      this.logger.info('DashboardEngine', 'updateDashboard', `Dashboard update complete in ${Date.now() - startTime}ms.`);
    } catch (e) {
      this.logger.error('DashboardEngine', 'updateDashboard', 'Failed to update dashboard', e);
    } finally {
      if (lock) {
        lock.releaseLock();
      }
    }
  }

  _safeWrite(sheet, row, col, values) {
      if (!values || values.length === 0 || !values[0] || values[0].length === 0) return;
      if (typeof RetryEngine !== 'undefined') {
          RetryEngine.execute(() => {
              sheet.getRange(row, col, values.length, values[0].length).setValues(values);
          }, { operationName: 'Dashboard Write', maxRetries: 3 });
      } else {
          sheet.getRange(row, col, values.length, values[0].length).setValues(values);
      }
  }

  createDashboard() {
    let sheet;
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) return; // In non-bound environments
        sheet = ss.getSheetByName(this.SHEET_NAME);
    } catch (e) {
        return; // Handle standalone testing where active spreadsheet might not be bound
    }

    let needsRebuild = false;
    if (!sheet) {
        this.logger.info('DashboardEngine', 'createDashboard', 'Dashboard sheet not found. Creating it now.');
        needsRebuild = true;
    } else {
        // Self-Healing: check if essential formatting or ranges were deleted
        try {
           const checkCell = sheet.getRange(2, 2).getValue();
           if (checkCell !== 'SECTION 1 — EXECUTIVE SUMMARY') {
               this.logger.warn('DashboardEngine', 'createDashboard', 'Dashboard formatting appears corrupted. Rebuilding.');
               needsRebuild = true;
           }
        } catch(e) {
           needsRebuild = true;
        }
    }

    if (needsRebuild) {
        this.rebuildDashboard();
    }
  }

  rebuildDashboard() {
    let ss;
    try {
        ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) return;
    } catch (e) {
        return;
    }

    let sheet = ss.getSheetByName(this.SHEET_NAME);
    if (sheet) {
        ss.deleteSheet(sheet);
    }

    sheet = ss.insertSheet(this.SHEET_NAME, 0); // Put as first tab

    // Apply default styles to everything
    sheet.getRange(1, 1, 150, 25).setFontFamily(this.FONT).setBackground(this.BG_COLOR);
    sheet.setFrozenRows(2);
    sheet.setFrozenColumns(1);

    // Common format function
    const applyHeader = (row, col, title, mergeCount = 3) => {
        sheet.getRange(row, col, 1, mergeCount).merge().setValue(title)
             .setFontWeight("bold").setFontSize(12)
             .setBackground(this.HEADER_BG).setFontColor(this.HEADER_TEXT)
             .setVerticalAlignment("middle");
    };

    const applyTableHeaders = (row, col, headers) => {
        this._safeWrite(sheet, row, col, [headers]);
        sheet.getRange(row, col, 1, headers.length)
             .setBackground(this.TABLE_HEADER).setFontWeight('bold')
             .setBorder(true, true, true, true, null, null);
    };

    // SECTION 1 — EXECUTIVE SUMMARY
    applyHeader(2, 2, "SECTION 1 — EXECUTIVE SUMMARY", 3);
    const execLabels = [
        ['Total Companies Discovered', ''],
        ['New Companies Today', ''],
        ['New Companies This Week', ''],
        ['Qualified Leads', ''],
        ['High Intent Leads', ''],
        ['Avg Buying Intent', ''],
        ['Avg AI Pain Score', ''],
        ['Total Sources Crawled', ''],
        ['Total Records Processed', ''],
        ['Duplicate Rate', ''],
        ['Active Queue Size', ''],
        ['Failed Queue Items', ''],
        ['Current Pipeline Stage', ''],
        ['Last Successful Run', ''],
        ['Last Failed Run', ''],
        ['System Health Status', '']
    ];
    this._safeWrite(sheet, 3, 2, execLabels);
    sheet.getRange(3, 2, execLabels.length, 1).setFontWeight('bold'); // Make labels bold
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 150);

    // SECTION 2 — PIPELINE MONITORING
    applyHeader(2, 6, "SECTION 2 — PIPELINE MONITORING", 3);
    const pipelineLabels = [
        ['Current Stage', ''],
        ['Current Task', ''],
        ['Queue Progress', ''],
        ['Tasks Completed', ''],
        ['Tasks Remaining', ''],
        ['Execution Time', ''],
        ['Est. Time Remaining', '']
    ];
    this._safeWrite(sheet, 3, 6, pipelineLabels);
    sheet.getRange(3, 6, pipelineLabels.length, 1).setFontWeight('bold');
    sheet.setColumnWidth(6, 180);
    sheet.setColumnWidth(7, 150);

    // SECTION 3 — TOP 25 LEADS
    applyHeader(20, 2, "SECTION 3 — TOP 25 LEADS", 11);
    applyTableHeaders(21, 2, ['Company', 'Industry', 'Country', 'Buying Intent', 'AI Pain Score', 'Confidence', 'Source', 'Last Seen', 'Funding Status', 'Hiring Activity', 'Priority']);
    sheet.getRange(22, 2, 25, 11).setBackground('white').setBorder(true, true, true, true, true, true);
    // Formatting columns
    sheet.getRange(22, 5, 25, 2).setNumberFormat('0.0'); // Scores
    sheet.getRange(22, 7, 25, 1).setNumberFormat('0%'); // Confidence

    // SECTION 4 — PAIN INTELLIGENCE
    applyHeader(50, 2, "SECTION 4 — PAIN INTELLIGENCE", 4);
    applyTableHeaders(51, 2, ['Category', 'Count', 'Percentage', 'Severity']);
    sheet.getRange(52, 2, 10, 4).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(52, 4, 10, 1).setNumberFormat('0.0%');

    // SECTION 5 — INDUSTRY ANALYSIS
    applyHeader(50, 7, "SECTION 5 — INDUSTRY ANALYSIS", 4);
    applyTableHeaders(51, 7, ['Industry', 'Companies', 'Avg Intent', 'Avg Pain']);
    sheet.getRange(52, 7, 10, 4).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(52, 9, 10, 2).setNumberFormat('0.0');

    // SECTION 6 — COUNTRY ANALYSIS
    applyHeader(50, 12, "SECTION 6 — COUNTRY ANALYSIS", 4);
    applyTableHeaders(51, 12, ['Country', 'Companies', 'Avg Intent', 'Avg Pain']);
    sheet.getRange(52, 12, 10, 4).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(52, 14, 10, 2).setNumberFormat('0.0');

    // SECTION 7 — SOURCE PERFORMANCE
    applyHeader(65, 2, "SECTION 7 — SOURCE PERFORMANCE", 7);
    applyTableHeaders(66, 2, ['Source', 'Records Retrieved', 'Valid Leads', 'Duplicates', 'Failures', 'Success Rate', 'Last Crawl']);
    sheet.getRange(67, 2, 10, 7).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(67, 7, 10, 1).setNumberFormat('0.0%');

    // SECTION 8 — QUEUE HEALTH
    applyHeader(65, 10, "SECTION 8 — QUEUE HEALTH", 2);
    const queueLabels = [
        ['Queue Size', ''],
        ['Running Jobs', ''],
        ['Completed Jobs', ''],
        ['Failed Jobs', ''],
        ['Retry Queue', ''],
        ['Oldest Pending Job', ''],
        ['Avg Processing Time', ''],
        ['Checkpoint Count', '']
    ];
    this._safeWrite(sheet, 66, 10, queueLabels);
    sheet.getRange(66, 10, queueLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(66, 10, queueLabels.length, 1).setFontWeight('bold');

    // SECTION 9 — ERROR MONITORING
    applyHeader(80, 2, "SECTION 9 — ERROR MONITORING", 6);
    applyTableHeaders(81, 2, ['Timestamp', 'Module', 'Error', 'Retry Count', 'Status', 'Resolution']);
    sheet.getRange(82, 2, 10, 6).setBackground('white').setBorder(true, true, true, true, true, true);

    // SECTION 10 — KNOWLEDGE GRAPH
    applyHeader(95, 2, "SECTION 10 — KNOWLEDGE GRAPH", 2);
    const kgLabels = [
        ['Total Companies', ''],
        ['Total Relationships', ''],
        ['Total Pain Nodes', ''],
        ['Total Industry Nodes', ''],
        ['Total Country Nodes', ''],
        ['Total Tech Nodes', '']
    ];
    this._safeWrite(sheet, 96, 2, kgLabels);
    sheet.getRange(96, 2, kgLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(96, 2, kgLabels.length, 1).setFontWeight('bold');

    // SECTION 11 — DAILY TRENDS
    applyHeader(95, 5, "SECTION 11 — DAILY TRENDS", 2);
    const dailyLabels = [
        ['New Leads / Day', ''],
        ['High Intent / Day', ''],
        ['AI Pains / Day', ''],
        ['Crawled / Day', ''],
        ['Success Rate / Day', '']
    ];
    this._safeWrite(sheet, 96, 5, dailyLabels);
    sheet.getRange(96, 5, dailyLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(96, 5, dailyLabels.length, 1).setFontWeight('bold');

    // SECTION 12 — SYSTEM METRICS
    applyHeader(95, 8, "SECTION 12 — SYSTEM METRICS", 2);
    const sysLabels = [
        ['Total API Calls', ''],
        ['Total HTTP Requests', ''],
        ['Avg API Response Time', ''],
        ['Cache Hit Rate', ''],
        ['Lock Wait Time', ''],
        ['Memory Estimate', ''],
        ['Execution Time', ''],
        ['Daily Runtime', ''],
        ['Dashboard Gen Time', ''],
        ['Trigger Capacity', '']
    ];
    this._safeWrite(sheet, 96, 8, sysLabels);
    sheet.getRange(96, 8, sysLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(96, 8, sysLabels.length, 1).setFontWeight('bold');

    // Let's autosize everything
    for(let i=1; i<=15; i++) {
        try { sheet.autoResizeColumn(i); } catch (e) {}
    }
  }

  refreshDashboard(sheet, shouldFullRefresh, startTime, leads, rawLeads) {
    this.logger.info('DashboardEngine', 'refreshDashboard', 'Refreshing dashboard data.');

    // Load common operational data used for fast-changing sections
    const queue = this.db.findAll('Queue') || [];
    const errors = this.db.findAll('SystemLogs') || [];

    // Always update these sections
    this.updatePipelineMonitoring(sheet, queue);
    this.updateQueueHealth(sheet, queue);
    this.updateSystemMetrics(sheet, queue, startTime, errors);

    if (shouldFullRefresh) {
        // We already have leads and rawLeads loaded in updateDashboard to check lengths efficiently
        const duplicates = this.db.findAll('Duplicates') || [];

        // Compute aggregated object strictly O(n)
        const aggregated = this.aggregateDataSinglePass(leads, rawLeads, duplicates);

        this.updateKPIs(sheet, aggregated, queue, errors);
        this.updateRankings(sheet, aggregated);
        this.updateStatistics(sheet, aggregated);
        this.updateTrends(sheet, aggregated);
        this.updateKnowledgeGraphMetrics(sheet);

        this.updateCharts(sheet);
    }
  }

  aggregateDataSinglePass(leads, rawLeads, duplicates) {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const today = now.toISOString().split('T')[0];

    const HIGH_INTENT_THRESHOLD = this.config.getNumber('DASHBOARD.THRESHOLDS.HIGH_INTENT', 70);

    const agg = {
        totalLeads: leads.length,
        totalRawLeads: rawLeads.length,
        totalDuplicates: duplicates.length,
        newCompaniesToday: 0,
        newCompaniesWeek: 0,
        highIntentLeads: 0,
        totalScore: 0,
        totalPainScore: 0,

        painMap: new Map(),
        industryMap: new Map(),
        countryMap: new Map(),
        sourceMap: new Map(),

        trends: {
            newLeadsToday: 0,
            highIntentToday: 0,
            aiPainsToday: 0,
            totalCrawledToday: 0,
            successfulCrawlsToday: 0
        },

        leads: leads // keep reference for rankings
    };

    // Single pass over Leads
    for (const lead of leads) {
        const score = parseFloat(lead.score) || 0;
        const painScore = parseFloat(lead.aiPainScore) || 0;

        agg.totalScore += score;
        agg.totalPainScore += painScore;

        if (score >= HIGH_INTENT_THRESHOLD) agg.highIntentLeads++;

        const createdDate = lead._createdAt ? new Date(lead._createdAt) : now;
        const diff = now.getTime() - createdDate.getTime();

        if (diff <= oneDay) agg.newCompaniesToday++;
        if (diff <= oneWeek) agg.newCompaniesWeek++;

        const d = (lead._createdAt || '').split('T')[0];
        if (d === today) {
            if (score >= HIGH_INTENT_THRESHOLD) agg.trends.highIntentToday++;
            if (lead.aiPainCategories && lead.aiPainCategories.trim().length > 0) agg.trends.aiPainsToday++;
        }

        // Aggregate Pains
        if (lead.aiPainCategories) {
            const pains = lead.aiPainCategories.split(',').map(s => s.trim());
            for (const p of pains) {
                if (!p) continue;
                agg.painMap.set(p, (agg.painMap.get(p) || 0) + 1);
            }
        }

        // Aggregate Industry
        if (lead.industry) {
            const ind = lead.industry;
            const obj = agg.industryMap.get(ind) || { count: 0, sumScore: 0, sumPain: 0 };
            obj.count++;
            obj.sumScore += score;
            obj.sumPain += painScore;
            agg.industryMap.set(ind, obj);
        }

        // Aggregate Country
        if (lead.country) {
            const country = lead.country;
            const obj = agg.countryMap.get(country) || { count: 0, sumScore: 0 };
            obj.count++;
            obj.sumScore += score;
            agg.countryMap.set(country, obj);
        }
    }

    // Single pass over RawLeads
    for (const r of rawLeads) {
        const src = r.source || 'Unknown';
        const obj = agg.sourceMap.get(src) || { count: 0, valid: 0, fail: 0, last: '' };

        obj.count++;
        if (r.enrichmentStatus === 'ENRICHED') obj.valid++;
        if (r.crawlStatus === 'FAILED' || r.enrichmentStatus === 'FAILED') obj.fail++;
        if (r.crawlTimestamp && r.crawlTimestamp > obj.last) obj.last = r.crawlTimestamp;
        agg.sourceMap.set(src, obj);

        const d = (r._createdAt || '').split('T')[0];
        if (d === today) {
            agg.trends.totalCrawledToday++;
            if (r.crawlStatus !== 'FAILED') agg.trends.successfulCrawlsToday++;
            if (r.enrichmentStatus === 'ENRICHED') agg.trends.newLeadsToday++;
        }
    }

    return agg;
  }

  updateKPIs(sheet, agg, queue, errors) {
    const totalSourcesCrawled = agg.sourceMap.size;
    const avgIntent = agg.totalLeads ? (agg.totalScore / agg.totalLeads).toFixed(1) : 0;
    const avgPain = agg.totalLeads ? (agg.totalPainScore / agg.totalLeads).toFixed(1) : 0;

    // Queue Metrics
    let activeQueueSize = 0;
    let failedQueueItems = 0;
    queue.forEach(q => {
        if (q.status === 'PENDING' || q.status === 'RUNNING') activeQueueSize++;
        if (q.status === 'FAILED') failedQueueItems++;
    });

    const duplicateRate = agg.totalLeads ? ((agg.totalDuplicates / agg.totalLeads) * 100).toFixed(1) + '%' : '0%';
    const now = new Date();
    const lastError = (errors.find(e => e.level === 'ERROR') || {}).timestamp || 'None';

    const WARNING_FAILURES = this.config.getNumber('DASHBOARD.THRESHOLDS.WARNING_QUEUE_FAILURES', 10);

    const values = [
        [agg.totalLeads],
        [agg.newCompaniesToday],
        [agg.newCompaniesWeek],
        [agg.totalLeads], // Assuming all in Leads are 'Qualified' by enrichment
        [agg.highIntentLeads],
        [avgIntent],
        [avgPain],
        [totalSourcesCrawled],
        [agg.totalRawLeads],
        [duplicateRate],
        [activeQueueSize],
        [failedQueueItems],
        ['COMPLETED'], // Dashboard is end of pipeline
        [now.toISOString().split('T')[0]],
        [lastError],
        [failedQueueItems > WARNING_FAILURES ? 'WARNING' : 'HEALTHY']
    ];

    this._safeWrite(sheet, 3, 3, values);
  }

  updateRankings(sheet, agg) {
    const TOP_LIMIT = this.config.getNumber('DASHBOARD.LIMITS.TOP_LEADS', 25);
    const HIGH_INTENT = this.config.getNumber('DASHBOARD.THRESHOLDS.HIGH_INTENT', 70);

    // Sort leads by Buying Intent (score) descending
    const sortedLeads = agg.leads.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0)).slice(0, TOP_LIMIT);

    const displayData = [];
    for (let i = 0; i < TOP_LIMIT; i++) {
        if (i < sortedLeads.length) {
            const lead = sortedLeads[i];
            const score = parseFloat(lead.score) || 0;
            displayData.push([
                lead.company || '',
                lead.industry || '',
                lead.country || '',
                score,
                parseFloat(lead.aiPainScore) || 0,
                parseFloat(lead.confidence) || 0,
                lead.source || '',
                lead._updatedAt || lead._createdAt || '',
                lead.fundingMentioned || '',
                lead.hiringSignals || '',
                score >= HIGH_INTENT ? 'High' : (score >= 50 ? 'Medium' : 'Low')
            ]);
        } else {
            // Fill empty rows to clear out stale data
            displayData.push(['', '', '', '', '', '', '', '', '', '', '']);
        }
    }
    this._safeWrite(sheet, 22, 2, displayData);
  }

  updateStatistics(sheet, agg) {
    const CAT_LIMIT = this.config.getNumber('DASHBOARD.LIMITS.TOP_CATEGORIES', 10);

    // 1. Pain Intelligence
    const sortedPains = Array.from(agg.painMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, CAT_LIMIT);
    const painData = [];
    let totalPainCount = Array.from(agg.painMap.values()).reduce((a, b) => a + b, 0);
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedPains.length) {
            const [category, count] = sortedPains[i];
            const percentage = totalPainCount ? count / totalPainCount : 0;
            painData.push([category, count, percentage, percentage > 0.15 ? 'High' : 'Normal']);
        } else {
            painData.push(['', '', '', '']);
        }
    }
    this._safeWrite(sheet, 52, 2, painData);

    // 2. Industry Analysis
    const sortedInd = Array.from(agg.industryMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, CAT_LIMIT);
    const indData = [];
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedInd.length) {
            const [ind, stats] = sortedInd[i];
            indData.push([ind, stats.count, stats.sumScore / stats.count, stats.sumPain / stats.count]);
        } else {
            indData.push(['', '', '', '']);
        }
    }
    this._safeWrite(sheet, 52, 7, indData);

    // 3. Country Analysis
    const sortedCount = Array.from(agg.countryMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, CAT_LIMIT);
    const countData = [];
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedCount.length) {
            const [country, stats] = sortedCount[i];
            countData.push([country, stats.count, stats.sumScore / stats.count, stats.count > 5 ? 'Growing' : 'Stable']);
        } else {
            countData.push(['', '', '', '']);
        }
    }
    this._safeWrite(sheet, 52, 12, countData);

    // 4. Source Performance
    const sortedSrc = Array.from(agg.sourceMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, CAT_LIMIT);
    const srcData = [];
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedSrc.length) {
            const [src, stats] = sortedSrc[i];
            const successRate = stats.count ? ((stats.count - stats.fail) / stats.count) : 0;
            srcData.push([src, stats.count, stats.valid, 0, stats.fail, successRate, stats.last]);
        } else {
            srcData.push(['', '', '', '', '', '', '']);
        }
    }
    this._safeWrite(sheet, 67, 2, srcData);
  }

  updateTrends(sheet, agg) {
    const totalCrawled = agg.trends.totalCrawledToday;
    const values = [
        [agg.trends.newLeadsToday],
        [agg.trends.highIntentToday],
        [agg.trends.aiPainsToday],
        [totalCrawled],
        [totalCrawled ? (agg.trends.successfulCrawlsToday / totalCrawled).toFixed(2) : 0]
    ];
    this._safeWrite(sheet, 96, 6, values);
  }

  updateKnowledgeGraphMetrics(sheet) {
    const getCount = (table) => {
        try {
            return (this.db.findAll(table) || []).length;
        } catch(e) { return 0; }
    };

    const values = [
        [getCount('Companies')],
        [getCount('Relationships')],
        [getCount('PainPoints')],
        [getCount('Industries')],
        [getCount('Countries')],
        [getCount('Technologies')]
    ];
    this._safeWrite(sheet, 96, 3, values);
  }

  updatePipelineMonitoring(sheet, queue) {
      const stateStr = getScriptProps().get('ENGINE_STATE', '{}');
      let state = {};
      try { state = JSON.parse(stateStr); } catch (e) {}

      const total = queue.length;
      const completed = queue.filter(q => q.status === 'SUCCESS').length;
      const remaining = queue.filter(q => q.status === 'PENDING').length;
      const progress = total ? (completed / total * 100).toFixed(0) + '%' : '0%';

      const values = [
          [state.currentState || 'IDLE'],
          [state.currentTask || 'None'],
          [progress],
          [completed],
          [remaining],
          ['0s'],
          ['0s']
      ];
      this._safeWrite(sheet, 3, 7, values);
  }

  updateQueueHealth(sheet, queue) {
      const running = queue.filter(q => q.status === 'RUNNING').length;
      const completed = queue.filter(q => q.status === 'SUCCESS').length;
      const failed = queue.filter(q => q.status === 'FAILED').length;
      const retrying = queue.filter(q => q.attempts > 0 && q.status === 'PENDING').length;

      let oldest = 'None';
      const pending = queue.filter(q => q.status === 'PENDING').sort((a,b) => new Date(a._createdAt) - new Date(b._createdAt));
      if (pending.length > 0) {
          oldest = pending[0]._createdAt || 'Unknown';
      }

      const checkpoints = (this.db.findAll('State') || []).length;

      const values = [
          [queue.length],
          [running],
          [completed],
          [failed],
          [retrying],
          [oldest],
          ['0s'],
          [checkpoints]
      ];
      this._safeWrite(sheet, 66, 11, values);
  }

  updateSystemMetrics(sheet, queue, startTime, errors) {
    const metricsStr = getScriptProps().get('SYSTEM_METRICS', '{}');
    let sysMetrics = {};
    try { sysMetrics = JSON.parse(metricsStr); } catch(e) {}

    const calls = sysMetrics.apiCalls || 0;
    const hits = sysMetrics.cacheHits || 0;
    const total = sysMetrics.cacheTotal || 0;
    const hitRate = total ? (hits / total) : 0;

    const checkpointSize = (getScriptProps().get('ENGINE_CHECKPOINT', '').length / 1024 / 1024) || 0;
    const memEstimate = `${(5 + (queue.length * 0.0015) + checkpointSize).toFixed(2)} MB`;

    const apiTimesStr = getScriptProps().get('API_RESPONSE_TIMES', '[]');
    let apiTimes = [];
    try { apiTimes = JSON.parse(apiTimesStr); } catch(e){}
    const avgRespTime = apiTimes.length ? (apiTimes.reduce((a,b)=>a+b,0)/apiTimes.length).toFixed(1) + 's' : '0s';

    const lockWaitStr = getScriptProps().get('LOCK_WAIT_TIMES', '[]');
    let lockWaits = [];
    try { lockWaits = JSON.parse(lockWaitStr); } catch(e){}
    const avgLockWait = lockWaits.length ? (lockWaits.reduce((a,b)=>a+b,0)/lockWaits.length).toFixed(1) + 's' : '0s';

    const dailyRuntime = sysMetrics.dailyRuntimeMs ? Math.round(sysMetrics.dailyRuntimeMs / 1000 / 60) + 'm' : '0m';
    const lastExecTime = sysMetrics.lastExecutionMs ? (sysMetrics.lastExecutionMs / 1000).toFixed(1) + 's' : '0s';
    const triggerCap = '100%';
    const dashboardGenTime = Date.now() - startTime + 'ms';

    const values = [
        [calls],
        [sysMetrics.httpRequests || 0],
        [avgRespTime],
        [hitRate.toFixed(2)],
        [avgLockWait],
        [memEstimate],
        [lastExecTime],
        [dailyRuntime],
        [dashboardGenTime],
        [triggerCap]
    ];
    this._safeWrite(sheet, 96, 9, values);

    // Errors
    const recentErrors = errors.filter(e => e.level === 'ERROR').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    const errData = [];
    for (let i = 0; i < 10; i++) {
        if (i < recentErrors.length) {
            const err = recentErrors[i];
            errData.push([err.timestamp, err.module, err.message, 0, 'Unresolved', '']);
        } else {
            errData.push(['', '', '', '', '', '']);
        }
    }
    this._safeWrite(sheet, 82, 2, errData);
  }

  updateCharts(sheet) {
     // Re-create chart definitions cleanly
     // Clear existing charts
     const charts = sheet.getCharts();
     for (const chart of charts) {
         sheet.removeChart(chart);
     }

     // Pain Intelligence Chart
     const painChartBuilder = sheet.newChart()
        .asBarChart()
        .addRange(sheet.getRange(52, 2, 10, 2)) // category & count
        .setPosition(52, 17, 0, 0)
        .setOption('title', 'Top AI Pains')
        .build();
     sheet.insertChart(painChartBuilder);

     // Industry Chart
     const industryChartBuilder = sheet.newChart()
        .asPieChart()
        .addRange(sheet.getRange(52, 7, 10, 2)) // industry & count
        .setPosition(52, 23, 0, 0)
        .setOption('title', 'Industry Distribution')
        .build();
     sheet.insertChart(industryChartBuilder);
  }

  execute(payload) {
    this.updateDashboard();
    return { status: 'SUCCESS', nextState: null, payload: null };
  }
}

// Register with Task Dispatcher
function registerDashboardEngine() {
  const dispatcher = getTaskDispatcher();
  if (dispatcher) {
    dispatcher.registerTask('DASHBOARD_UPDATE', (payload) => {
      const engine = getDashboardEngine();
      return engine.execute(payload);
    });
  }
}

// Global Singleton Getter
let _dashboardEngineInstance = null;
function getDashboardEngine() {
  if (!_dashboardEngineInstance) {
    _dashboardEngineInstance = new DashboardEngine();
  }
  return _dashboardEngineInstance;
}



/******************************************************************
TRIGGERS
******************************************************************/

/**
 * Trigger Manager
 *
 * Responsible for lifecycle management of triggers across the application.
 * Ensures that the system creates required triggers, deletes duplicates,
 * validates existence, and maintains automated scheduling.
 */

class TriggerManager {
  constructor() {
    this.config = getAppConfig();
    this.logger = getSystemLog();
  }

  /**
   * Initializes all required system triggers if they don't already exist.
   */
  initializeSystemTriggers() {
    this.logger.info('TriggerManager', 'Initializing system triggers.');
    this.cleanDuplicateTriggers();

    this.ensureDailyTrigger('TarkaX_Automation_DailyPipeline', this.config.get('AUTOMATION.SCHEDULE.DAILY_PIPELINE', '01:00'));
    this.ensureHourlyTrigger('TarkaX_Automation_HealthCheck', this.config.getNumber('AUTOMATION.SCHEDULE.HEALTH_CHECK_HOURS', 1));
    this.ensureMinuteTrigger('TarkaX_Automation_QueueResume', this.config.getNumber('AUTOMATION.SCHEDULE.QUEUE_RESUME_MINUTES', 15));
    this.ensureHourlyTrigger('TarkaX_Automation_DashboardRefresh', this.config.getNumber('AUTOMATION.SCHEDULE.DASHBOARD_REFRESH_HOURS', 2));
    this.ensureDailyTrigger('TarkaX_Automation_DailyMaintenance', this.config.get('AUTOMATION.SCHEDULE.DAILY_MAINTENANCE', '02:00'));
    this.ensureWeeklyTrigger('TarkaX_Automation_WeeklyOptimization', ScriptApp.WeekDay.SUNDAY, this.config.getNumber('AUTOMATION.SCHEDULE.WEEKLY_OPTIMIZATION', 3));
    this.ensureMonthlyTrigger('TarkaX_Automation_MonthlyMaintenance', 1, this.config.getNumber('AUTOMATION.SCHEDULE.MONTHLY_MAINTENANCE', 4));

    // Recovery Trigger - Ensure it runs periodically
    this.ensureMinuteTrigger('TarkaX_Automation_RecoveryTrigger', this.config.getNumber('AUTOMATION.SCHEDULE.RECOVERY_TRIGGER_MINUTES', 30));

    this.logger.info('TriggerManager', 'System triggers initialization complete.');
  }

  /**
   * Cleans up duplicate triggers pointing to the same function.
   */
  cleanDuplicateTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    const seenFunctions = new Set();
    let deletedCount = 0;

    for (const trigger of triggers) {
      const handlerName = trigger.getHandlerFunction();

      // Do not clean the resume triggers here, they are managed by TimeoutManager
      if (handlerName === 'TarkaX_System_Resume') continue;

      if (seenFunctions.has(handlerName)) {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
        this.logger.info('TriggerManager', `Deleted duplicate trigger for ${handlerName}`);
      } else {
        seenFunctions.add(handlerName);
      }
    }

    if (deletedCount > 0) {
      this.logger.info('TriggerManager', `Cleaned up ${deletedCount} duplicate triggers.`);
    }
  }

  /**
   * Rebuilds all missing triggers.
   */
  rebuildMissingTriggers() {
    this.initializeSystemTriggers();
  }

  /**
   * Ensures a daily trigger exists for a given function.
   */
  ensureDailyTrigger(functionName, timeString) {
    if (this._triggerExists(functionName)) return;

    const [hour, minute] = timeString.split(':').map(Number);
    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .atHour(hour || 0)
        .nearMinute(minute || 0)
        .everyDays(1)
        .create();
      this.logger.info('TriggerManager', `Created daily trigger for ${functionName} at ${timeString}`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create daily trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures an hourly trigger exists.
   */
  ensureHourlyTrigger(functionName, hours) {
    if (this._triggerExists(functionName)) return;

    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .everyHours(hours)
        .create();
      this.logger.info('TriggerManager', `Created hourly trigger for ${functionName} every ${hours} hours`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create hourly trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures a minute trigger exists.
   */
  ensureMinuteTrigger(functionName, minutes) {
    if (this._triggerExists(functionName)) return;

    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .everyMinutes(minutes)
        .create();
      this.logger.info('TriggerManager', `Created minute trigger for ${functionName} every ${minutes} minutes`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create minute trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures a weekly trigger exists.
   */
  ensureWeeklyTrigger(functionName, dayOfWeek, hour) {
    if (this._triggerExists(functionName)) return;

    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .onWeekDay(dayOfWeek)
        .atHour(hour)
        .create();
      this.logger.info('TriggerManager', `Created weekly trigger for ${functionName} on day ${dayOfWeek} at hour ${hour}`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create weekly trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures a monthly trigger exists (approximation via everyDays for Google Apps Script).
   */
  ensureMonthlyTrigger(functionName, dayOfMonth, hour) {
      if (this._triggerExists(functionName)) return;

      try {
        ScriptApp.newTrigger(functionName)
          .timeBased()
          .onMonthDay(dayOfMonth)
          .atHour(hour)
          .create();
        this.logger.info('TriggerManager', `Created monthly trigger for ${functionName} on day ${dayOfMonth} at hour ${hour}`);
      } catch (e) {
        this.logger.error('TriggerManager', `Failed to create monthly trigger for ${functionName}`, { error: e.message });
      }
  }

  /**
   * Checks if a trigger already exists for a given function.
   */
  _triggerExists(functionName) {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === functionName) {
        return true;
      }
    }
    return false;
  }
}

// Singleton getter
function getTriggerManager() {
  if (!getTriggerManager.instance) {
    getTriggerManager.instance = new TriggerManager();
  }
  return getTriggerManager.instance;
}



/******************************************************************
PUBLIC ENTRY POINTS
******************************************************************/

function TarkaX_System_Resume() {
  const recoveryEngine = getRecoveryEngine();
  // Ensure triggers are cleaned up
  const tm = new TimeoutManager();
  tm._deleteContinuationTriggers();

  // Kick off recovery
  recoveryEngine.recoverAndResume();
}

function TarkaX_System_HealthCheck() {
  const monitor = new HealthMonitor();
  monitor.generateReport();
}

function TarkaX_Automation_DailyPipeline() {
  getAutomationEngine().runDailyPipeline();
}

function TarkaX_Automation_HealthCheck() {
  getAutomationEngine().runHealthCheck();
}

function TarkaX_Automation_QueueResume() {
  getAutomationEngine().resumePipeline();
}

function TarkaX_Automation_RecoveryTrigger() {
  // Dedicated catch-all recovery run
  getAutomationEngine().resumePipeline();
}

function TarkaX_Automation_DashboardRefresh() {
  getDashboardEngine().updateDashboard();
}

function TarkaX_Automation_DailyMaintenance() {
  getMaintenanceEngine().planDailyMaintenance();
}

function TarkaX_Automation_WeeklyOptimization() {
  getMaintenanceEngine().planWeeklyOptimization();
}

function TarkaX_Automation_MonthlyMaintenance() {
  getMaintenanceEngine().planMonthlyMaintenance();
}

function TarkaX_System_Start() {
  if (typeof getAutomationEngine === 'function') {
     getAutomationEngine().runDailyPipeline();
     return;
  }

  // Register active engine tasks before start (Legacy fallback)
  const dispatcher = getTaskDispatcher();

  if (!dispatcher.taskExists('DISCOVER')) {
      dispatcher.registerTask('DISCOVER', (payload) => {
         return getDiscoveryEngine().execute(payload);
      });
  }

  if (!dispatcher.taskExists('CRAWL')) {
      dispatcher.registerTask('CRAWL', (payload) => {
         return getCrawlerEngine().execute(payload);
      });
  }

  const engine = getExecutionEngine();
  engine.start();
}


function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TarkaX')
    .addItem('Run Daily Pipeline', 'TarkaX_Automation_DailyPipeline')
    .addItem('Refresh Dashboard', 'TarkaX_Automation_DashboardRefresh')
    .addItem('Run Health Check', 'TarkaX_System_HealthCheck')
    .addToUi();
}

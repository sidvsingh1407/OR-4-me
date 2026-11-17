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
  debug(...args) {
    if (args.length >= 3) {
      this._log(this.LEVELS.DEBUG, 'DEBUG', `[${args[0]}:${args[1]}] ${args[2]}`, args[3] || {});
    } else {
      this._log(this.LEVELS.DEBUG, 'DEBUG', args[0], args[1] || {});
    }
  }

  /**
   * Logs an info message.
   */
  info(...args) {
    if (args.length >= 3) {
      this._log(this.LEVELS.INFO, 'INFO', `[${args[0]}:${args[1]}] ${args[2]}`, args[3] || {});
    } else {
      this._log(this.LEVELS.INFO, 'INFO', args[0], args[1] || {});
    }
  }

  /**
   * Logs a warning message.
   */
  warn(...args) {
    if (args.length >= 3) {
      this._log(this.LEVELS.WARN, 'WARN', `[${args[0]}:${args[1]}] ${args[2]}`, args[3] || {});
    } else {
      this._log(this.LEVELS.WARN, 'WARN', args[0], args[1] || {});
    }
  }

  /**
   * Logs an error message.
   */
  error(...args) {
    if (args.length >= 3) {
      let errMeta = (args[3] && typeof args[3] === 'object') ? (Utils.deepClone(args[3]) || {}) : {};
      if (args[3] instanceof Error) {
        errMeta.message = args[3].message;
        errMeta.stack = args[3].stack;
        errMeta.name = args[3].name;
      }
      this._log(this.LEVELS.ERROR, 'ERROR', `[${args[0]}:${args[1]}] ${args[2]}`, errMeta);
    } else {
      let message = '';
      const extendedMeta = (args[1] && typeof args[1] === 'object') ? (Utils.deepClone(args[1]) || {}) : {};
      const error = args[0];

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
}

// Export a default system logger
function getSystemLog() {
  if (!getSystemLog.instance) {
    getSystemLog.instance = AppLogger.getLogger('System');
  }
  return getSystemLog.instance;
}

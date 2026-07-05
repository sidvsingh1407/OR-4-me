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

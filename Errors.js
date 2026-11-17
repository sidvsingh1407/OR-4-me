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

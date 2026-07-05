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

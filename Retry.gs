/**
 * Retry Engine.
 * Provides a resilient execution wrapper with exponential backoff and jitter.
 * Designed to recover from transient failures like rate limits or network hiccups.
 */
class RetryEngine {
  /**
   * Initializes the RetryEngine.
   * @param {Object} [options={}] - Configuration options for the retry logic.
   * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
   * @param {number} [options.baseDelayMs=1000] - Base delay before the first retry.
   * @param {number} [options.maxDelayMs=30000] - Maximum allowable delay between retries.
   * @param {number} [options.jitterFactor=0.2] - Randomization factor applied to the delay.
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this.baseDelayMs = options.baseDelayMs !== undefined ? options.baseDelayMs : 1000;
    this.maxDelayMs = options.maxDelayMs !== undefined ? options.maxDelayMs : 30000;
    this.jitterFactor = options.jitterFactor !== undefined ? options.jitterFactor : 0.2;
    this.logger = AppLogger.getLogger('RetryEngine');

    Validation.assertNumber(this.maxRetries, 'Max Retries');
    Validation.assertNumber(this.baseDelayMs, 'Base Delay');
    Validation.assertNumber(this.maxDelayMs, 'Max Delay');
    Validation.assertNumber(this.jitterFactor, 'Jitter Factor');
  }

  /**
   * Executes a function with exponential backoff on failure.
   * @param {Function} operation - The function to execute. Must return a value or throw.
   * @param {Function} [shouldRetryPredicate] - Optional callback (error => boolean) to determine if an error is retryable.
   * @returns {*} The result of the operation.
   * @throws {Error} The final error after exhausting retries or encountering a non-retryable error.
   */
  execute(operation, shouldRetryPredicate = null) {
    Validation.assertFunction(operation, 'Operation');
    if (shouldRetryPredicate) {
      Validation.assertFunction(shouldRetryPredicate, 'Should Retry Predicate');
    }

    let attempt = 0;

    while (true) {
      try {
        return operation();
      } catch (error) {
        attempt++;

        // Determine if we should stop retrying
        if (attempt > this.maxRetries) {
          this.logger.error(`Operation failed after ${this.maxRetries} retries.`, { error: error.message });
          throw error;
        }

        if (shouldRetryPredicate && !shouldRetryPredicate(error)) {
          this.logger.warn(`Operation failed with non-retryable error. Aborting retries.`, { error: error.message });
          throw error;
        }

        // Calculate next delay with exponential backoff and jitter
        const delay = this._calculateDelay(attempt);
        this.logger.info(`Operation failed. Retrying in ${delay}ms (Attempt ${attempt}/${this.maxRetries}).`, { error: error.message });

        Utils.sleep(delay);
      }
    }
  }

  /**
   * Calculates the delay for the next retry using exponential backoff with jitter.
   * @param {number} attempt - The current attempt number (1-based).
   * @returns {number} The delay in milliseconds.
   * @private
   */
  _calculateDelay(attempt) {
    // Exponential backoff: base * 2^(attempt-1)
    let exponentialDelay = this.baseDelayMs * Math.pow(2, attempt - 1);

    // Apply max delay cap
    if (exponentialDelay > this.maxDelayMs) {
      exponentialDelay = this.maxDelayMs;
    }

    // Apply jitter: +/- (jitterFactor * delay)
    const jitterVariance = exponentialDelay * this.jitterFactor;
    const jitter = (Math.random() * 2 - 1) * jitterVariance; // Random between -jitterVariance and +jitterVariance

    let finalDelay = Math.floor(exponentialDelay + jitter);

    // Ensure delay is at least 0
    return Math.max(0, finalDelay);
  }
}

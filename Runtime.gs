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

/**
 * Lock Manager.
 * Orchestrates concurrency control using Google Apps Script LockService.
 * Ensures safe execution of critical sections across multiple trigger executions.
 */
class LockManager {
  /**
   * Initializes the LockManager.
   * @param {string} [lockType='SCRIPT'] - The type of lock: 'SCRIPT', 'USER', or 'DOCUMENT'.
   */
  constructor(lockType = 'SCRIPT') {
    Validation.assertString(lockType, 'Lock Type');
    this.lockType = lockType.toUpperCase();
    this.logger = AppLogger.getLogger(`LockManager[${this.lockType}]`);
    this.lock = this._getLockService();
    this.isLocked = false;
  }

  /**
   * Internal method to acquire the proper native Lock object.
   * @returns {GoogleAppsScript.Lock.Lock} The native lock object.
   */
  _getLockService() {
    if (typeof LockService === 'undefined') {
      this.logger.warn('LockService is undefined. Using mock lock.');
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

    switch (this.lockType) {
      case 'SCRIPT':
        return LockService.getScriptLock();
      case 'USER':
        return LockService.getUserLock();
      case 'DOCUMENT':
        return LockService.getDocumentLock();
      default:
        throw new ConfigurationError(`Unsupported lock type: ${this.lockType}`);
    }
  }

  /**
   * Attempts to acquire the lock within the specified timeout.
   * @param {number} [timeoutInMillis=10000] - Maximum time to wait for the lock.
   * @returns {boolean} True if the lock was acquired, false otherwise.
   */
  acquire(timeoutInMillis = 10000) {
    Validation.assertNumber(timeoutInMillis, 'Lock Timeout');

    if (this.isLocked || this.lock.hasLock()) {
      this.logger.debug('Lock is already held by this instance.');
      return true;
    }

    try {
      const success = this.lock.tryLock(timeoutInMillis);
      if (success) {
        this.isLocked = true;
        this.logger.debug(`Lock acquired successfully after waiting up to ${timeoutInMillis}ms.`);
        return true;
      } else {
        this.logger.warn(`Failed to acquire lock within ${timeoutInMillis}ms.`);
        return false;
      }
    } catch (e) {
      this.logger.error('Exception thrown while trying to acquire lock', { error: e.message });
      return false;
    }
  }

  /**
   * Releases the lock if it is currently held.
   */
  release() {
    if (!this.isLocked && !this.lock.hasLock()) {
      this.logger.debug('No lock held to release.');
      return;
    }

    try {
      this.lock.releaseLock();
      this.isLocked = false;
      this.logger.debug('Lock released successfully.');
    } catch (e) {
      this.logger.error('Failed to release lock', { error: e.message });
      throw new LockError('Could not release the lock.', { originalError: e.message });
    }
  }

  /**
   * Executes a callback function within a lock context.
   * Guarantees that the lock is released even if the callback throws an error.
   * @param {Function} callback - The function to execute.
   * @param {number} [timeoutInMillis=10000] - Timeout to acquire the lock.
   * @returns {*} The result of the callback.
   * @throws {LockError} If the lock cannot be acquired.
   */
  executeWithLock(callback, timeoutInMillis = 10000) {
    Validation.assertFunction(callback, 'Callback');

    if (!this.acquire(timeoutInMillis)) {
      throw new LockError(`Failed to acquire lock for critical section within ${timeoutInMillis}ms.`);
    }

    try {
      return callback();
    } finally {
      this.release();
    }
  }
}

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

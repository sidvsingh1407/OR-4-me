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

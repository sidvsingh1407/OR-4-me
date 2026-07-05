/**
 * System Health Monitor
 *
 * Scans the entire execution engine and database to detect anomalies such as:
 * - Stuck queues (tasks in RUNNING state for too long)
 * - Dead checkpoints (checkpoints older than 24 hours)
 * - Long-running tasks
 * - Retry storms (excessive tasks in RETRY state)
 * - Lock contention (excessive wait times for LockService)
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
    report.metrics.runningTasks = runningTasks.length;

    if (runningTasks.length > 0) {
      const now = new Date().getTime();
      let stuckCount = 0;

      runningTasks.forEach(task => {
        const updatedAt = new Date(task._updatedAt).getTime();
        const durationMin = (now - updatedAt) / (1000 * 60);

        // If a task has been RUNNING for more than 15 minutes, it's likely stuck
        // (since GAS max execution is 6 mins, + buffer)
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

    report.metrics.tasksInRetry = retryTasks.length;
    report.metrics.tasksFailed = failedTasks.length;

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
}

// Global hook for scheduled monitoring
function TarkaX_System_HealthCheck() {
  const monitor = new HealthMonitor();
  monitor.generateReport();
}

// Singleton getter
function getHealthMonitor() {
  if (!getHealthMonitor.instance) {
    getHealthMonitor.instance = new HealthMonitor();
  }
  return getHealthMonitor.instance;
}

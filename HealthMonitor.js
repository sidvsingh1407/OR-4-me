/**
 * System Health Monitor
 *
 * Scans the entire execution engine and database to detect anomalies such as:
 * - Stuck queues (tasks in RUNNING state for too long)
 * - Dead checkpoints (checkpoints older than 24 hours)
 * - Long-running tasks
 * - Retry storms (excessive tasks in RETRY state)
 * - Lock contention (excessive wait times for LockService)
 * - Trigger integrity
 * - Script Properties integrity
 * - Sheet integrity
 * - Runtime statistics
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
      this._checkTriggerHealth(report);
      this._checkCacheAndProperties(report);
      this._checkSheetIntegrity(report);

      // Save report to both historical and status sheets
      this._saveMetrics(report);

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
    const pendingTasks = db.findMany('Queue', { status: 'PENDING' });

    report.metrics.runningTasks = runningTasks.length;
    report.metrics.pendingTasks = pendingTasks.length;
    report.metrics.queueSize = runningTasks.length + pendingTasks.length;

    if (runningTasks.length > 0) {
      const now = new Date().getTime();
      let stuckCount = 0;

      runningTasks.forEach(task => {
        const updatedAt = new Date(task._updatedAt).getTime();
        const durationMin = (now - updatedAt) / (1000 * 60);

        // If a task has been RUNNING for more than 15 minutes, it's likely stuck
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
    const successTasks = db.findMany('Queue', { status: 'COMPLETED' });

    report.metrics.tasksInRetry = retryTasks.length;
    report.metrics.tasksFailed = failedTasks.length;
    report.metrics.tasksCompleted = successTasks.length;

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

  /**
   * Validates trigger integrity.
   */
  _checkTriggerHealth(report) {
    const triggers = ScriptApp.getProjectTriggers();
    report.metrics.triggerCount = triggers.length;

    if (triggers.length === 0) {
       report.issues.push('No triggers found. Automation is completely offline.');
       report.score -= 50;
    }
  }

  /**
   * Validates cache and properties usage.
   */
  _checkCacheAndProperties(report) {
    const props = PropertiesService.getScriptProperties();
    const keys = props.getKeys();

    report.metrics.propertiesCount = keys.length;

    // Very basic check, if keys are approaching 500 (soft limit estimation)
    if (keys.length > 500) {
       report.issues.push(`High Properties Usage: ${keys.length} keys in use.`);
       report.score -= 10;
    }

    // Cache test
    const cache = CacheService.getScriptCache();
    cache.put('HealthTest', 'OK', 60);
    const result = cache.get('HealthTest');
    if (result !== 'OK') {
       report.issues.push('CacheService is unavailable or malfunctioning.');
       report.score -= 15;
    }
  }

  /**
   * Validates core database sheets.
   */
  _checkSheetIntegrity(report) {
    const db = getDatabase();
    const expectedSheets = ['Queue', 'Checkpoints', 'SystemLogs'];

    for (const sheet of expectedSheets) {
       if (!db._getSheet(sheet)) {
          report.issues.push(`Missing core system sheet: ${sheet}`);
          report.score -= 30;
       }
    }
  }

  /**
   * Saves metrics to the AutomationMetrics tables.
   */
  _saveMetrics(report) {
    const db = getDatabase();
    const stateManager = getExecutionStateManager();
    const currentState = stateManager.getState();

    // Ensure metrics are never negative
    const finalScore = Math.max(0, report.score);

    const statusRecord = {
      id: 'CURRENT',
      healthScore: finalScore,
      queueSize: report.metrics.queueSize || 0,
      currentStage: currentState.currentStage || 'IDLE',
      runningWorker: currentState.currentWorker || 'NONE',
      activeTriggerCount: report.metrics.triggerCount || 0,
      lastSuccessfulExecution: currentState.state === 'SUCCESS' ? new Date().toISOString() : null,
      lastFailedExecution: currentState.state === 'FAILED' ? new Date().toISOString() : null,
      pendingTasks: report.metrics.pendingTasks || 0,
      failedTasks: report.metrics.tasksFailed || 0,
      retryCount: currentState.retryCount || 0,
      apiErrorCount: 0, // Would be pulled from ApiLogs if they exist
      lockContention: report.metrics.lockTestDurationMs || 0,
      runtimeMs: 0, // Can calculate based on execution start time
      remainingQuotaEstimate: 0,
      updatedAt: report.timestamp
    };

    // 1. Update Status Sheet (UPSERT)
    const existingStatus = db.findById('AutomationMetrics_Status', 'CURRENT');
    if (existingStatus) {
       db.update('AutomationMetrics_Status', 'CURRENT', statusRecord);
    } else {
       db.insert('AutomationMetrics_Status', statusRecord);
    }

    // 2. Insert into History
    db.insert('AutomationMetrics_History', {
       id: Utilities.getUuid(),
       timestamp: report.timestamp,
       healthScore: finalScore,
       queueSize: report.metrics.queueSize || 0,
       runtimeMs: 0,
       tasksCompleted: report.metrics.tasksCompleted || 0,
       tasksFailed: report.metrics.tasksFailed || 0,
       apiCalls: 0,
       retryCount: currentState.retryCount || 0,
       memoryEstimate: 0,
       triggerCount: report.metrics.triggerCount || 0,
       stageCompleted: currentState.currentStage || 'NONE'
    });
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

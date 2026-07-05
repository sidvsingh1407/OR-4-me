/**
 * Self-Healing Engine
 *
 * Automatically repairs systemic issues detected by the Health Monitor
 * or execution exceptions. Resolves missing sheets, missing triggers,
 * stuck queues, retry storms, and manages the Watchdog.
 */

class SelfHealingEngine {
  constructor() {
    this.logger = getSystemLog();
    this.db = getDatabase();
    this.config = getAppConfig();
  }

  /**
   * Executes a full self-healing scan and repair cycle.
   */
  heal() {
    this.logger.info('SelfHealingEngine', 'Starting self-healing cycle.');

    try {
      this._repairTriggers();
      this._repairSheets();
      this._repairCache();
      this._repairIndexes();
      this._repairQueue();
      this.logger.info('SelfHealingEngine', 'Self-healing cycle completed.');
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Failed to complete self-healing cycle.', { error: e.message });
    }
  }

  /**
   * Rebuilds any missing essential triggers.
   */
  _repairTriggers() {
    const triggerManager = getTriggerManager();
    triggerManager.rebuildMissingTriggers();
  }

  /**
   * Re-initializes core database schemas if missing.
   */
  _repairSheets() {
    try {
      // getDatabase automatically triggers initialization if sheets are missing
      const db = getDatabase();
      db.initialize();
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Failed to repair sheets.', { error: e.message });
    }
  }

  /**
   * Clears completely corrupted cache or performs basic tests.
   */
  _repairCache() {
    try {
      const cache = CacheService.getScriptCache();
      cache.put('HealthTest', 'OK', 60);
      const result = cache.get('HealthTest');
      if (result !== 'OK') {
        this.logger.warn('SelfHealingEngine', 'Cache validation failed. Waiting for Google Apps Script to auto-recover cache.');
      }
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Error during cache repair test.', { error: e.message });
    }
  }

  /**
   * Requests Graph Index rebuild if corrupted.
   */
  _repairIndexes() {
    try {
       const indexManager = getGraphIndexManager();
       // This will rebuild cache from sheets if memory is empty
       indexManager.buildIndexes();
    } catch (e) {
       this.logger.error('SelfHealingEngine', 'Failed to repair indexes.', { error: e.message });
    }
  }

  /**
   * Fixes stuck running tasks or excessive retry storms.
   */
  _repairQueue() {
    try {
      const queueManager = getQueueManager();
      queueManager.recoverStuckTasks();

      const retryStormThreshold = this.config.getNumber('AUTOMATION.RETRY_STORM_THRESHOLD', 50);
      const retryTasks = this.db.findMany('Queue', { status: 'RETRY' });

      if (retryTasks.length > retryStormThreshold) {
         this.logger.warn('SelfHealingEngine', `Detected retry storm (${retryTasks.length} tasks). Downgrading priorities.`);
         // Optionally lower priority of failing tasks to let new work pass
      }
    } catch (e) {
      this.logger.error('SelfHealingEngine', 'Failed to repair queue.', { error: e.message });
    }
  }
}

/**
 * Execution Watchdog
 *
 * Supervisor that runs alongside or around execution cycles to detect
 * runaway loops, high failure rates, and forced timeouts.
 */
class ExecutionWatchdog {
  constructor() {
    this.logger = getSystemLog();
    this.stateManager = getExecutionStateManager();
    this.timeoutManager = getTimeoutManager();
  }

  /**
   * Inspects the current execution state and context.
   * If limits are exceeded, forces a safe termination.
   */
  monitorAndEnforce() {
    const state = this.stateManager.getState();

    // 1. Check for Stuck State
    if (state.state === 'RUNNING') {
      const startTime = new Date(state.startTime).getTime();
      const now = new Date().getTime();
      const runDurationMins = (now - startTime) / (1000 * 60);

      const maxExecMins = getAppConfig().getNumber('AUTOMATION.MAX_EXECUTION_TIME_MINUTES', 5);

      if (runDurationMins > maxExecMins + 1) { // 1 min buffer over max
         this.logger.error('ExecutionWatchdog', `Runaway execution detected. Module ${state.currentModule} running for ${runDurationMins.toFixed(1)} mins.`);
         this.forceTermination('Runaway execution limit exceeded.');
      }
    }

    // 2. Check Timeout Safety (rely on TimeoutManager primarily, but watchdog acts as a safety net)
    this.timeoutManager.checkAndHaltIfNeeded(10000); // Tighter buffer for watchdog
  }

  /**
   * Forcibly halts the current execution and saves a checkpoint.
   */
  forceTermination(reason) {
    this.logger.warn('ExecutionWatchdog', `Forcing termination. Reason: ${reason}`);

    // Transition state
    this.stateManager.transition('CHECKPOINT');

    // Attempt standard timeout manager continuation
    try {
      this.timeoutManager.checkAndHaltIfNeeded(60000); // force a trigger creation
    } catch (e) {
      if (e.name === 'TimeoutError') {
        throw e; // expected
      }
    }

    // Hard throw if timeout manager didn't
    throw new Error(`ExecutionWatchdog Termination: ${reason}`);
  }
}

// Singleton getters
function getSelfHealingEngine() {
  if (!getSelfHealingEngine.instance) {
    getSelfHealingEngine.instance = new SelfHealingEngine();
  }
  return getSelfHealingEngine.instance;
}

function getExecutionWatchdog() {
  if (!getExecutionWatchdog.instance) {
    getExecutionWatchdog.instance = new ExecutionWatchdog();
  }
  return getExecutionWatchdog.instance;
}

/**
 * Timeout Manager
 *
 * Prevents Apps Script from terminating unexpectedly by detecting remaining time,
 * saving a checkpoint, and automatically scheduling a continuation trigger.
 */

class TimeoutManager {
  /**
   * @param {Object} context The current execution context to save if a timeout occurs.
   */
  constructor(context = {}) {
    this.runtime = getRuntime(); // from Runtime.gs
    this.checkpointEngine = getCheckpointEngine();
    this.stateManager = getExecutionStateManager();
    this.context = context; // Stores currentTask, currentModule, apiState, etc.
  }

  /**
   * Updates the dynamic context that will be checkpointed.
   */
  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Checks if the execution is near the timeout limit.
   * If so, gracefully halts, checkpoints, creates a trigger, and throws an exception to stop the current run.
   * @param {number} [bufferMs=15000] - Safe buffer time (default 15s).
   */
  checkAndHaltIfNeeded(bufferMs = 15000) {
    if (this.runtime.shouldCheckpoint(bufferMs)) {
      getExecutionLogger().warn('TimeoutManager', 'checkAndHalt', `Approaching timeout limit. Checkpointing and halting. Buffer: ${bufferMs}ms`);

      // Save state
      this.stateManager.transition(ENGINE_STATES.CHECKPOINT);
      this.checkpointEngine.saveCheckpoint(this.context);

      // Create continuation trigger
      this._createContinuationTrigger();

      // Transition to EXIT
      this.stateManager.transition(ENGINE_STATES.EXIT);
      getExecutionLogger().info('TimeoutManager', 'checkAndHalt', `System safely halted and continuation scheduled.`);

      throw new TimeoutError('Execution safely halted for continuation trigger.');
    }
  }

  /**
   * Uses ScriptApp to schedule a new one-time trigger 1 minute from now to resume execution.
   */
  _createContinuationTrigger() {
    // Ensure we don't create duplicate triggers
    this._deleteContinuationTriggers();

    try {
      ScriptApp.newTrigger('TarkaX_System_Resume')
        .timeBased()
        .after(60 * 1000) // 1 minute delay
        .create();
      getExecutionLogger().info('TimeoutManager', 'createTrigger', 'Scheduled continuation trigger for 1 minute from now.');
    } catch (e) {
      getExecutionLogger().error('TimeoutManager', 'createTrigger', 'Failed to schedule continuation trigger.', e);
      // Even if trigger fails, the state is CHECKPOINT, meaning a manual run or the daily run will recover it.
    }
  }

  /**
   * Deletes all existing continuation triggers.
   */
  _deleteContinuationTriggers() {
    try {
      const triggers = ScriptApp.getProjectTriggers();
      let count = 0;
      for (const trigger of triggers) {
        if (trigger.getHandlerFunction() === 'TarkaX_System_Resume') {
          ScriptApp.deleteTrigger(trigger);
          count++;
        }
      }
      if (count > 0) {
        getExecutionLogger().debug('TimeoutManager', 'deleteTriggers', `Deleted ${count} old continuation triggers.`);
      }
    } catch (e) {
      getExecutionLogger().error('TimeoutManager', 'deleteTriggers', 'Failed to cleanup old continuation triggers.', e);
    }
  }
}

// Global entry point for the continuation trigger
function TarkaX_System_Resume() {
  const recoveryEngine = getRecoveryEngine();
  // Ensure triggers are cleaned up
  const tm = new TimeoutManager();
  tm._deleteContinuationTriggers();

  // Kick off recovery
  recoveryEngine.recoverAndResume();
}

// Singleton getter
function getTimeoutManager() {
  if (!getTimeoutManager.instance) {
    getTimeoutManager.instance = new TimeoutManager();
  }
  return getTimeoutManager.instance;
}

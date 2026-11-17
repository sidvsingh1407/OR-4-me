/**
 * Recovery Engine
 *
 * Responsible for restoring execution deterministicly after an expected timeout,
 * or unexpected script crash.
 */

class RecoveryEngine {
  constructor() {
    this.stateManager = getExecutionStateManager();
    this.checkpointEngine = getCheckpointEngine();
    this.queueManager = getQueueManager();
  }

  /**
   * Entry point for resuming an execution from a previous state.
   */
  recoverAndResume() {
    getExecutionLogger().info('RecoveryEngine', 'Start', 'Initiating system recovery.');

    const state = this.stateManager.getState();
    const currentState = state.state;

    // Check if recovery is actually needed
    if (currentState === ENGINE_STATES.IDLE || currentState === ENGINE_STATES.SUCCESS) {
      getExecutionLogger().info('RecoveryEngine', 'Status', `No recovery needed. Current state: ${currentState}`);
      return;
    }

    // Recover stuck RUNNING tasks (script crash)
    if (currentState === ENGINE_STATES.RUNNING) {
      getExecutionLogger().warn('RecoveryEngine', 'CrashDetect', 'Detected unexpected crash (State was RUNNING). Resetting state and recovering stuck tasks.');
      this.queueManager.recoverStuckTasks();
      this.stateManager.transition(ENGINE_STATES.QUEUED);
    }

    // Load checkpoint
    const checkpoint = this.checkpointEngine.loadCheckpoint();
    if (checkpoint) {
      getExecutionLogger().info('RecoveryEngine', 'CheckpointLoaded', `Restoring cursor: Page ${checkpoint.pageNumber}, Offset ${checkpoint.offset}`);
      this.queueManager.setPointer(checkpoint.cursor, checkpoint.pageNumber, checkpoint.offset);
    } else {
      getExecutionLogger().warn('RecoveryEngine', 'NoCheckpoint', 'No checkpoint found during recovery. Restarting queue from beginning.');
      this.queueManager.clearPointer();
    }

    // Transition state and hand off to the main execution engine
    this.stateManager.transition(ENGINE_STATES.RESUME);

    // Call the main engine loop (will be defined in ExecutionEngine.gs)
    const engine = getExecutionEngine();
    engine.start();
  }
}

// Singleton getter
function getRecoveryEngine() {
  if (!getRecoveryEngine.instance) {
    getRecoveryEngine.instance = new RecoveryEngine();
  }
  return getRecoveryEngine.instance;
}

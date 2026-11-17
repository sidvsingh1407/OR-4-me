/**
 * Checkpoint Engine
 *
 * Automatically saves and loads execution progress using PropertiesService.
 * Essential for recovering safely without duplicating work if the script terminates.
 */

class CheckpointEngine {
  constructor() {
    this.props = getScriptProps();
    this.CHECKPOINT_KEY = 'ENGINE_LATEST_CHECKPOINT';
  }

  /**
   * Saves a new checkpoint with the current execution context.
   * @param {Object} context
   * @param {string} context.currentTask
   * @param {string} context.currentModule
   * @param {Object} context.apiState
   * @param {string} context.resumeToken
   */
  saveCheckpoint(context = {}) {
    // Merge the checkpoint context with the Queue pointer (if any)
    const queueManager = getQueueManager();
    const pointer = queueManager.getPointer();

    const checkpoint = {
      timestamp: new Date().toISOString(),
      currentTask: context.currentTask || null,
      currentModule: context.currentModule || null,
      apiState: context.apiState || null,
      resumeToken: context.resumeToken || Utilities.getUuid(),
      cursor: pointer.cursorId,
      pageNumber: pointer.pageNumber,
      offset: pointer.offset
    };

    this.props.set(this.CHECKPOINT_KEY, JSON.stringify(checkpoint));

    // Also update the state manager
    const stateManager = getExecutionStateManager();
    stateManager.updateContext({
      lastCheckpointTime: checkpoint.timestamp,
      resumeToken: checkpoint.resumeToken
    });

    getExecutionLogger().info('CheckpointEngine', 'Save', 'Checkpoint saved successfully.', checkpoint);
    return checkpoint;
  }

  /**
   * Loads the latest checkpoint.
   * @returns {Object|null} The checkpoint object or null if none exists.
   */
  loadCheckpoint() {
    const cpStr = this.props.get(this.CHECKPOINT_KEY);
    if (!cpStr) {
      getExecutionLogger().debug('CheckpointEngine', 'Load', 'No checkpoint found.');
      return null;
    }

    try {
      const checkpoint = JSON.parse(cpStr);
      getExecutionLogger().info('CheckpointEngine', 'Load', 'Checkpoint loaded.', checkpoint);
      return checkpoint;
    } catch (e) {
      getExecutionLogger().error('CheckpointEngine', 'Load', 'Failed to parse checkpoint data.', e);
      return null;
    }
  }

  /**
   * Clears the current checkpoint (e.g., when a workflow completes successfully).
   */
  clearCheckpoint() {
    this.props.delete(this.CHECKPOINT_KEY);
    getExecutionLogger().info('CheckpointEngine', 'Clear', 'Checkpoint cleared.');
  }

  /**
   * Checks if a valid checkpoint exists.
   * @returns {boolean}
   */
  hasCheckpoint() {
    return this.props.get(this.CHECKPOINT_KEY) !== null;
  }
}

// Singleton getter
function getCheckpointEngine() {
  if (!getCheckpointEngine.instance) {
    getCheckpointEngine.instance = new CheckpointEngine();
  }
  return getCheckpointEngine.instance;
}

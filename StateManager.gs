/**
 * Execution State Manager
 *
 * Responsible for tracking the exact state of the execution engine.
 * Stores lightweight state in PropertiesService so it survives script termination.
 * States: IDLE, QUEUED, RUNNING, CHECKPOINT, SUCCESS, RETRY, FAILED, TIMEOUT, ABORTED, RESUME
 */

const ENGINE_STATES = {
  IDLE: 'IDLE',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  CHECKPOINT: 'CHECKPOINT',
  SUCCESS: 'SUCCESS',
  RETRY: 'RETRY',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  ABORTED: 'ABORTED',
  RESUME: 'RESUME',
  EXIT: 'EXIT'
};

class ExecutionStateManager {
  constructor() {
    this.props = getScriptProps();
    this.STATE_KEY = 'ENGINE_EXECUTION_STATE';
  }

  /**
   * Initializes a new execution state.
   */
  initializeState() {
    const initialState = {
      executionId: Utilities.getUuid(),
      state: ENGINE_STATES.IDLE,
      startTime: new Date().toISOString(),
      currentWorkflow: null,
      currentModule: null,
      resumeToken: null,
      lastCheckpointTime: null,
      retryCount: 0
    };
    this._saveState(initialState);
    return initialState;
  }

  /**
   * Transitions the engine to a new state.
   * @param {string} newState - Must be a valid ENGINE_STATES value.
   * @param {Object} [updates={}] - Additional state properties to update (e.g. currentModule).
   */
  transition(newState, updates = {}) {
    if (!Object.values(ENGINE_STATES).includes(newState)) {
      throw new ConfigurationError(`Invalid execution state: ${newState}`);
    }

    const state = this.getState();
    const oldState = state.state;
    state.state = newState;

    // Apply any additional updates
    for (const [key, value] of Object.entries(updates)) {
      state[key] = value;
    }

    this._saveState(state);

    try {
      getExecutionLogger().info('ExecutionStateManager', 'Transition', `State changed: ${oldState} -> ${newState}`, {
        executionId: state.executionId,
        workflow: state.currentWorkflow,
        module: state.currentModule
      });
    } catch(e) { /* ignore logger issues */ }

    return state;
  }

  /**
   * Retrieves the current execution state.
   * @returns {Object} The current state object, or a new initialized state if none exists.
   */
  getState() {
    const stateStr = this.props.get(this.STATE_KEY);
    if (!stateStr) {
      return this.initializeState();
    }
    try {
      return JSON.parse(stateStr);
    } catch (e) {
      getExecutionLogger().warn('ExecutionStateManager', 'getState', 'Failed to parse state, re-initializing.');
      return this.initializeState();
    }
  }

  /**
   * Updates specific fields in the current state without changing the primary state enum.
   * @param {Object} updates
   */
  updateContext(updates) {
    const state = this.getState();
    for (const [key, value] of Object.entries(updates)) {
      state[key] = value;
    }
    this._saveState(state);
    return state;
  }

  /**
   * Clears the current state (typically used on complete SUCCESS or FAILED after recovery is no longer needed).
   */
  clearState() {
    this.props.delete(this.STATE_KEY);
  }

  _saveState(stateObj) {
    this.props.set(this.STATE_KEY, JSON.stringify(stateObj));
  }
}

// Singleton getter
function getExecutionStateManager() {
  if (!getExecutionStateManager.instance) {
    getExecutionStateManager.instance = new ExecutionStateManager();
  }
  return getExecutionStateManager.instance;
}

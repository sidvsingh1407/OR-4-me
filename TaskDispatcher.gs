/**
 * Task Dispatcher
 *
 * Dynamically routes execution to registered task modules.
 * Ensures the core engine does not need to know implementation details of future modules.
 */

class TaskDispatcher {
  constructor() {
    this.registry = {};
  }

  /**
   * Registers a handler function for a specific task type.
   * @param {string} taskType - The name of the task (e.g. 'CRAWL', 'DISCOVER').
   * @param {Function} handler - The function to execute. Must accept a payload parameter.
   */
  registerTask(taskType, handler) {
    Validation.assertString(taskType, 'Task Type');
    Validation.assertFunction(handler, 'Task Handler');

    const normalizedTaskType = taskType.toUpperCase();

    if (this.registry[normalizedTaskType]) {
      getExecutionLogger().warn('TaskDispatcher', 'RegisterTask', `Overwriting existing handler for task: ${normalizedTaskType}`);
    }

    this.registry[normalizedTaskType] = handler;
    getExecutionLogger().info('TaskDispatcher', 'RegisterTask', `Task registered: ${normalizedTaskType}`);
  }

  /**
   * Unregisters a task.
   * @param {string} taskType
   */
  unregisterTask(taskType) {
    const normalizedTaskType = taskType.toUpperCase();
    delete this.registry[normalizedTaskType];
  }

  /**
   * Checks if a task is registered.
   * @param {string} taskType
   * @returns {boolean}
   */
  taskExists(taskType) {
    return !!this.registry[taskType.toUpperCase()];
  }

  /**
   * Gets a list of all currently registered tasks.
   * @returns {string[]}
   */
  getRegisteredTasks() {
    return Object.keys(this.registry);
  }

  /**
   * Executes a registered task with the given payload.
   * @param {string} taskType
   * @param {Object} payload
   * @returns {*} The result of the task handler.
   */
  executeTask(taskType, payload) {
    const normalizedTaskType = taskType.toUpperCase();
    const handler = this.registry[normalizedTaskType];

    if (!handler) {
      throw new ConfigurationError(`TaskDispatcher: No handler registered for task type: ${normalizedTaskType}`);
    }

    try {
      getExecutionLogger().debug('TaskDispatcher', 'ExecuteTask', `Executing task: ${normalizedTaskType}`, payload);
      const result = handler(payload);
      return result;
    } catch (error) {
      getExecutionLogger().error('TaskDispatcher', 'ExecuteTask', `Error executing task: ${normalizedTaskType}`, error);
      throw error;
    }
  }
}

// Singleton getter
function getTaskDispatcher() {
  if (!getTaskDispatcher.instance) {
    getTaskDispatcher.instance = new TaskDispatcher();
  }
  return getTaskDispatcher.instance;
}

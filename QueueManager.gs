/**
 * Queue Manager
 *
 * Manages the execution queue.
 * - Active tasks are pulled from the Database 'Queue' sheet or cached locally.
 * - Queue pointer/cursor is managed in PropertiesService to support thousands of tasks.
 */

class QueueManager {
  constructor() {
    this.props = getScriptProps();
    this.QUEUE_POINTER_KEY = 'ENGINE_QUEUE_POINTER';
  }

  /**
   * Enqueues a task by inserting it into the Database Engine.
   * @param {string} taskType - The module or task name (e.g. 'CRAWL', 'DISCOVER')
   * @param {Object} payload - Task specific data
   * @param {number} [priority=1] - Lower number is higher priority (currently not fully modeled in DB schema, but standard practice)
   */
  enqueue(taskType, payload, priority = 1) {
    Validation.assertString(taskType, 'Task Type');

    const db = getDatabase();
    const taskRecord = {
      taskType: taskType,
      status: 'PENDING',
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      attempts: 0
    };

    const id = db.insert('Queue', taskRecord);
    getExecutionLogger().info('QueueManager', 'Enqueue', `Queued task ${taskType}`, { id });
    return id;
  }

  /**
   * Enqueues multiple tasks efficiently.
   */
  enqueueBatch(tasks) {
    if (!tasks || tasks.length === 0) return [];
    const db = getDatabase();

    const records = tasks.map(t => ({
      taskType: t.taskType,
      status: 'PENDING',
      payload: typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload),
      attempts: 0
    }));

    const ids = db.batchInsert('Queue', records);
    getExecutionLogger().info('QueueManager', 'EnqueueBatch', `Queued ${records.length} tasks`);
    return ids;
  }

  /**
   * Reads the next available batch of tasks from the queue.
   * @param {number} limit
   */
  getNextBatch(limit = 10) {

    const db = getDatabase();
    const allPending = db.findMany('Queue', { status: 'PENDING' });
    const batch = allPending.slice(0, limit);

    if (batch.length > 0) {
      const updates = {};
      batch.forEach(t => { updates[t._id] = { status: 'RUNNING' }; });
      db.batchUpdate('Queue', updates);
    }

    return batch;
  }

  /**
   * Marks a task as running in the database.
   */
  markRunning(taskId) {
    const db = getDatabase();
    db.update('Queue', taskId, { status: 'RUNNING' });
  }

  /**
   * Marks a task as successful.
   */
  markSuccess(taskId) {
    const db = getDatabase();
    db.update('Queue', taskId, { status: 'SUCCESS' });
  }

  /**
   * Handles a task failure, either retrying it or marking it completely failed.
   */
  markFailed(task, error, maxRetries = 3) {
    const db = getDatabase();
    const attempts = (task.attempts || 0) + 1;

    if (attempts >= maxRetries) {
      db.update('Queue', task._id, {
        status: 'FAILED',
        attempts: attempts
      });
      getExecutionLogger().error('QueueManager', 'TaskFailed', `Task permanently failed after ${attempts} attempts`, error, { taskId: task._id });
    } else {
      // Exponential backoff logic could determine nextAttemptAt here
      db.update('Queue', task._id, {
        status: 'RETRY',
        attempts: attempts
      });
      getExecutionLogger().warn('QueueManager', 'TaskRetry', `Task failed, scheduled for retry (${attempts}/${maxRetries})`, error, { taskId: task._id });
    }
  }

  /**
   * Recovers tasks that were stuck in RUNNING state (e.g. script crash).
   */
  recoverStuckTasks() {
    const db = getDatabase();
    const stuckTasks = db.findMany('Queue', { status: 'RUNNING' });

    if (stuckTasks.length > 0) {
      getExecutionLogger().warn('QueueManager', 'RecoverStuckTasks', `Found ${stuckTasks.length} stuck tasks. Resetting to PENDING.`);
      const updates = {};
      stuckTasks.forEach(t => {
        updates[t._id] = { status: 'PENDING' };
      });
      db.batchUpdate('Queue', updates);
    }
  }

  // --- Pointer Management for very large datasets (e.g. iterating over millions of Leads) ---

  setPointer(cursorId, pageNumber, offset) {
    const pointer = { cursorId, pageNumber, offset };
    this.props.set(this.QUEUE_POINTER_KEY, JSON.stringify(pointer));
  }

  getPointer() {
    const pStr = this.props.get(this.QUEUE_POINTER_KEY);
    if (!pStr) return { cursorId: null, pageNumber: 0, offset: 0 };
    try {
      return JSON.parse(pStr);
    } catch (e) {
      return { cursorId: null, pageNumber: 0, offset: 0 };
    }
  }

  clearPointer() {
    this.props.delete(this.QUEUE_POINTER_KEY);
  }
}

// Singleton getter
function getQueueManager() {
  if (!getQueueManager.instance) {
    getQueueManager.instance = new QueueManager();
  }
  return getQueueManager.instance;
}

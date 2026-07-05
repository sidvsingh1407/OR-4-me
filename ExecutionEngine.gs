/**
 * Main Execution Engine
 *
 * Acts as the lightweight operating system for TarkaX.
 * Orchestrates the execution loop:
 * Queue -> Dispatcher -> Task -> Checkpoint -> Timeout Check -> Loop
 */

class ExecutionEngine {
  constructor() {
    this.stateManager = getExecutionStateManager();
    this.queueManager = getQueueManager();
    this.dispatcher = getTaskDispatcher();
    this.checkpointEngine = getCheckpointEngine();
    this.timeoutManager = getTimeoutManager();
  }

  /**
   * Starts the main execution loop.
   */
  start() {
    getExecutionLogger().info('ExecutionEngine', 'Start', 'Starting execution engine loop.');

    // Distributed Lock: Prevent duplicate concurrent runs of the engine
    const lock = DistributedLockManager.acquire(30000, 'SCRIPT');
    if (!lock) {
      getExecutionLogger().warn('ExecutionEngine', 'Start', 'Failed to acquire script lock. Another execution is likely running. Exiting.');
      return;
    }

    try {
      this.stateManager.transition(ENGINE_STATES.RUNNING);

      let hasMoreTasks = true;
      while (hasMoreTasks) {
        // 1. Check Timeout before starting a new batch
        this.timeoutManager.checkAndHaltIfNeeded(15000); // Need at least 15s to safely process a task

        // 2. Fetch Tasks
        const tasks = this.queueManager.getNextBatch(5); // Process in small batches
        if (tasks.length === 0) {
          getExecutionLogger().info('ExecutionEngine', 'Loop', 'No more tasks in queue.');
          hasMoreTasks = false;
          break;
        }

        // 3. Process Batch
        for (const task of tasks) {
          this.timeoutManager.checkAndHaltIfNeeded(10000);
          this._processTask(task);
        }

        // 4. Batch Checkpoint
        // Save progress after every batch to survive a crash during the next batch
        this.checkpointEngine.saveCheckpoint({
            currentModule: 'ExecutionEngine',
            currentTask: 'BATCH_COMPLETE'
        });
      }

      // Execution finished successfully
      this._handleSuccess();

    } catch (e) {
      if (e instanceof TimeoutError) {
        // Expected halt, state is already managed by TimeoutManager
        getExecutionLogger().info('ExecutionEngine', 'Halt', 'Execution engine paused for continuation.');
      } else {
        // Unexpected crash
        this.stateManager.transition(ENGINE_STATES.FAILED);
        getExecutionLogger().error('ExecutionEngine', 'Crash', 'Engine crashed unexpectedly.', e);
      }
    } finally {
      DistributedLockManager.release(lock);
      getExecutionLogger().info('ExecutionEngine', 'End', 'Execution engine loop ended.');
    }
  }

  /**
   * Processes a single task from the queue.
   */
  _processTask(task) {
    getExecutionLogger().debug('ExecutionEngine', 'ProcessTask', `Processing task ID: ${task._id}`, { type: task.taskType });

    try {
      this.queueManager.markRunning(task._id);

      // Setup dynamic context for timeout manager
      this.timeoutManager.updateContext({
        currentTask: task._id,
        currentModule: task.taskType
      });

      // Execute via dispatcher wrapped in RetryEngine
      const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload;

      RetryEngine.execute(() => {
         this.dispatcher.executeTask(task.taskType, payload);
      }, { operationName: `Task Execution: ${task.taskType}` });

      this.queueManager.markSuccess(task._id);
      getExecutionLogger().info('ExecutionEngine', 'ProcessTask', `Task ${task._id} completed successfully.`);

    } catch (error) {
      getExecutionLogger().error('ExecutionEngine', 'ProcessTask', `Error processing task ${task._id}`, error);
      // Let the QueueManager handle retries vs permanent failure marking
      this.queueManager.markFailed(task, error);
    }
  }

  /**
   * Handles a clean finish of the queue.
   */
  _handleSuccess() {
    this.stateManager.transition(ENGINE_STATES.SUCCESS);
    this.stateManager.clearState();
    this.checkpointEngine.clearCheckpoint();
    this.queueManager.clearPointer();
    getExecutionLogger().info('ExecutionEngine', 'Success', 'All tasks completed. Engine state cleared.');
  }
}

// Global Entry point for daily scheduled runs
function TarkaX_System_Start() {
  const engine = getExecutionEngine();
  engine.start();
}

// Singleton getter
function getExecutionEngine() {
  if (!getExecutionEngine.instance) {
    getExecutionEngine.instance = new ExecutionEngine();
  }
  return getExecutionEngine.instance;
}

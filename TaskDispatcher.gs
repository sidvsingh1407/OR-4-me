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


    // Auto-register known engines
    getTaskDispatcher.instance.registerTask('SCORE_LEAD', (payload) => { return getScoringEngine().scoreLead(payload.leadId); });

    if (typeof registerEnrichmentEngine === 'function') {
       registerEnrichmentEngine();
    }
    if (typeof registerDashboardEngine === 'function') {
       registerDashboardEngine();
    }

    // Auto-register Graph Tasks
    if (typeof registerGraphTasks === 'function') {
       registerGraphTasks();
    }

    // Maintenance Tasks
    getTaskDispatcher.instance.registerTask('MAINTENANCE_CACHE_PURGE', () => getSelfHealingEngine()._repairCache());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_LOG_COMPRESSION', () => getMaintenanceEngine().compressLogs());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_STALE_CHECKPOINT_REMOVAL', () => getMaintenanceEngine().removeStaleCheckpoints());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_TEMP_DATA_CLEANUP', () => getMaintenanceEngine().cleanupTempData());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REBUILD_INDEXES', () => getGraphIndexManager().buildIndexes());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REFRESH_DASHBOARD', () => { if (typeof TarkaX_Dashboard_Update === 'function') TarkaX_Dashboard_Update(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_GRAPH_OPTIMIZATION', () => { if (typeof getGraphAnalytics === 'function') getGraphAnalytics().optimizeGraph(); else getSystemLog().warn('Maintenance', 'Graph optimization not available'); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_DUPLICATE_REEVALUATION', () => { if (typeof getEntityResolver === 'function') getEntityResolver().resolveAliases(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_SCORE_RECALCULATION', () => { if (typeof getScoringEngine === 'function') getScoringEngine().recalculateAll(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_ONTOLOGY_REFRESH', () => { if (typeof getPainOntologyEngine === 'function') getPainOntologyEngine().initializeNodes(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_CRAWLER_STATS_CLEANUP', () => { getSystemLog().info('Maintenance', 'Crawler Stats cleanup omitted.'); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_ARCHIVE_LEADS', () => getMaintenanceEngine().archiveOldLeads());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_ARCHIVE_LOGS', () => getMaintenanceEngine().archiveMetrics());
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REBUILD_SUMMARY_TABLES', () => { if (typeof TarkaX_Dashboard_Update === 'function') TarkaX_Dashboard_Update(); });
    getTaskDispatcher.instance.registerTask('MAINTENANCE_OPTIMIZE_METRICS', () => getSystemLog().info('Maintenance', 'Optimize Metrics omitted.'));
    getTaskDispatcher.instance.registerTask('MAINTENANCE_REFRESH_CONFIG_CACHE', () => { getAppConfig().clear(); getAppConfig(); });

  }
  return getTaskDispatcher.instance;
}

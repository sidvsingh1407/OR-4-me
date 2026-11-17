/**
 * Maintenance Engine
 *
 * Acts as a planner to generate and enqueue maintenance tasks.
 * Performs Daily, Weekly, and Monthly scheduling.
 * Does NOT execute maintenance synchronously to avoid timeouts.
 */

class MaintenanceEngine {
  constructor() {
    this.queueManager = getQueueManager();
    this.logger = getSystemLog();
  }

  /**
   * Plans and enqueues daily maintenance jobs.
   */
  planDailyMaintenance() {
    this.logger.info('MaintenanceEngine', 'Planning Daily Maintenance.');

    this.queueManager.enqueue('MAINTENANCE_CACHE_PURGE', {}, 5); // Low priority
    this.queueManager.enqueue('MAINTENANCE_LOG_COMPRESSION', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_STALE_CHECKPOINT_REMOVAL', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_TEMP_DATA_CLEANUP', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_REBUILD_INDEXES', {}, 5);
    this.queueManager.enqueue('MAINTENANCE_REFRESH_DASHBOARD', {}, 5);

    this.logger.info('MaintenanceEngine', 'Daily Maintenance planning complete.');
  }

  /**
   * Plans and enqueues weekly optimization jobs.
   */
  planWeeklyOptimization() {
    this.logger.info('MaintenanceEngine', 'Planning Weekly Optimization.');

    this.queueManager.enqueue('MAINTENANCE_GRAPH_OPTIMIZATION', {}, 6); // Lower priority
    this.queueManager.enqueue('MAINTENANCE_DUPLICATE_REEVALUATION', {}, 6);
    this.queueManager.enqueue('MAINTENANCE_SCORE_RECALCULATION', {}, 6);
    this.queueManager.enqueue('MAINTENANCE_ONTOLOGY_REFRESH', {}, 6);
    this.queueManager.enqueue('MAINTENANCE_CRAWLER_STATS_CLEANUP', {}, 6);

    this.logger.info('MaintenanceEngine', 'Weekly Optimization planning complete.');
  }

  /**
   * Plans and enqueues monthly maintenance jobs.
   */
  planMonthlyMaintenance() {
    this.logger.info('MaintenanceEngine', 'Planning Monthly Maintenance.');

    this.queueManager.enqueue('MAINTENANCE_ARCHIVE_LEADS', {}, 7); // Lowest priority
    this.queueManager.enqueue('MAINTENANCE_ARCHIVE_LOGS', {}, 7);
    this.queueManager.enqueue('MAINTENANCE_REBUILD_SUMMARY_TABLES', {}, 7);
    this.queueManager.enqueue('MAINTENANCE_OPTIMIZE_METRICS', {}, 7);
    this.queueManager.enqueue('MAINTENANCE_REFRESH_CONFIG_CACHE', {}, 7);

    this.logger.info('MaintenanceEngine', 'Monthly Maintenance planning complete.');
  }

  // --- Worker Functions for Maintenance Tasks ---

  /**
   * Executes log compression (removes logs older than config days).
   */
  compressLogs() {
    this.logger.info('MaintenanceEngine', 'Executing Log Compression');
    const db = getDatabase();
    const days = getAppConfig().getNumber('MAINTENANCE.CLEANUP_LOGS_DAYS', 30);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const logs = db.findMany('SystemLogs', {});
      const toDelete = logs.filter(log => new Date(log.timestamp) < cutoffDate).map(log => log._id);

      let deleted = 0;
      for (const id of toDelete) {
         db.delete('SystemLogs', id);
         deleted++;
      }
      this.logger.info('MaintenanceEngine', `Compressed/deleted ${deleted} old log entries.`);
    } catch(e) {
      this.logger.error('MaintenanceEngine', 'Failed to compress logs', { error: e.message });
    }
  }

  /**
   * Removes stale checkpoints.
   */
  removeStaleCheckpoints() {
    this.logger.info('MaintenanceEngine', 'Executing Stale Checkpoint Removal');
    const checkpointEngine = getCheckpointEngine();
    const cp = checkpointEngine.loadCheckpoint();
    if (cp) {
       const cpTime = new Date(cp.timestamp).getTime();
       const hoursOld = (new Date().getTime() - cpTime) / (1000 * 60 * 60);
       if (hoursOld > 24) {
          checkpointEngine.clearCheckpoint();
          this.logger.info('MaintenanceEngine', 'Cleared checkpoint older than 24 hours.');
       }
    }
  }

  /**
   * Cleans up temporary data (e.g. Properties cache that isn't standard CacheService).
   */
  cleanupTempData() {
    this.logger.info('MaintenanceEngine', 'Executing Temp Data Cleanup');
    // Implement based on what TarkaX actually uses. Properties cleanup might be risky if we don't know keys.
    // For now, clear any properties that look like temporary chunks.
    const props = PropertiesService.getScriptProperties();
    const keys = props.getKeys();
    let count = 0;
    for (const key of keys) {
      if (key.startsWith('TEMP_CHUNK_') || key.startsWith('LOCK_')) {
         props.deleteProperty(key);
         count++;
      }
    }
    this.logger.info('MaintenanceEngine', `Cleaned ${count} temporary properties.`);
  }

  /**
   * Archives old leads (moves to another sheet or deletes if too old, depending on policy).
   */
  archiveOldLeads() {
    this.logger.info('MaintenanceEngine', 'Executing Lead Archival');
    const db = getDatabase();
    const days = getAppConfig().getNumber('MAINTENANCE.ARCHIVE_LEADS_DAYS', 90);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Simplest implementation: Just mark them as ARCHIVED state or delete
    try {
       const leads = db.findMany('Leads', {});
       const toArchive = leads.filter(lead => new Date(lead.lastUpdated || lead._createdAt) < cutoffDate);

       let count = 0;
       for (const lead of toArchive) {
          // If we had an archive sheet we would move it. For now, we update state if field exists.
          if (lead.state !== 'ARCHIVED') {
             db.update('Leads', lead._id, { state: 'ARCHIVED' });
             count++;
          }
       }
       this.logger.info('MaintenanceEngine', `Archived ${count} old leads.`);
    } catch(e) {
       this.logger.error('MaintenanceEngine', 'Failed to archive leads', { error: e.message });
    }
  }

  /**
   * Archives historical metrics.
   */
  archiveMetrics() {
     this.logger.info('MaintenanceEngine', 'Executing Metrics Archival');
     const db = getDatabase();
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days of metrics history max
     try {
       const history = db.findMany('AutomationMetrics_History', {});
       const toDelete = history.filter(row => new Date(row.timestamp) < cutoffDate).map(row => row.id || row._id);

       let count = 0;
       for (const id of toDelete) {
         db.delete('AutomationMetrics_History', id);
         count++;
       }
       this.logger.info('MaintenanceEngine', `Deleted ${count} old metric records.`);
     } catch (e) {
       this.logger.error('MaintenanceEngine', 'Failed to archive metrics', { error: e.message });
     }
  }

}

// Global Triggers mapping
function TarkaX_Automation_DailyMaintenance() {
  getMaintenanceEngine().planDailyMaintenance();
}

function TarkaX_Automation_WeeklyOptimization() {
  getMaintenanceEngine().planWeeklyOptimization();
}

function TarkaX_Automation_MonthlyMaintenance() {
  getMaintenanceEngine().planMonthlyMaintenance();
}

// Singleton Getter
function getMaintenanceEngine() {
  if (!getMaintenanceEngine.instance) {
    getMaintenanceEngine.instance = new MaintenanceEngine();
  }
  return getMaintenanceEngine.instance;
}

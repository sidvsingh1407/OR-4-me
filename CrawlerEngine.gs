/**
 * Crawler Engine
 *
 * Orchestrates the execution of configured Crawler Plugins.
 * Pulls from CrawlerQueue or uses built-in default crawls depending on setup.
 * Normalizes, Validates, and places results into the ENRICHMENT Queue.
 */

class CrawlerEngine {
  constructor() {
    this.logger = AppLogger.getLogger('CrawlerEngine');
    this.config = getAppConfig();
    this.queueManager = getQueueManager();
    this.validator = getCrawlerValidationEngine();
    this.checkpointEngine = getCheckpointEngine();
    this.timeoutManager = getTimeoutManager();
  }

  /**
   * Main Execution Entry from Task Dispatcher.
   * payload may contain instructions like { plugin: 'RSSCrawler', target: '...' }
   */
  execute(payload) {
    this.logger.info('CrawlerEngine', 'Execute', 'Starting Crawler Engine execution.', payload);

    // We can be triggered generically or specifically for a plugin.
    // If specific, run it. Otherwise, loop enabled plugins.
    const specificPluginName = payload && payload.plugin ? payload.plugin : null;

    const enabledPlugins = this.config.get('CRAWLER.ENABLED_PLUGINS', []);
    const pluginsToRun = specificPluginName
                         ? enabledPlugins.filter(p => p === specificPluginName)
                         : enabledPlugins;

    if (pluginsToRun.length === 0) {
      this.logger.warn('CrawlerEngine', 'Execute', 'No crawler plugins are enabled or matched.');
      return { status: 'COMPLETED', payload: {} };
    }

    const availablePlugins = getCrawlerPlugins();

    let totalProcessed = 0;

    for (const pluginName of pluginsToRun) {
      this.timeoutManager.checkAndHaltIfNeeded(15000);

      const pluginInstance = availablePlugins[pluginName];
      if (!pluginInstance) {
         this.logger.error('CrawlerEngine', 'Execute', `Plugin ${pluginName} not found in factory.`);
         continue;
      }

      try {
        pluginInstance.initialize();

        let hasMore = true;
        let pluginBatchCount = 0;
        const BATCH_LIMIT = this.config.get('CRAWLER.BATCH_SIZE', 50);

        while (hasMore && pluginBatchCount < BATCH_LIMIT) {
           this.timeoutManager.checkAndHaltIfNeeded(5000);

           const rawItems = pluginInstance.crawl();

           // If rawItems is explicitly null, the crawler asserts it is exhausted (e.g., all feeds processed).
           // If it is simply an empty array [], it means it found nothing on this pass or rate-limited.
           if (rawItems === null) {
             hasMore = false;
             break;
           }

           if (Array.isArray(rawItems) && rawItems.length === 0) {
              // Empty array means no results this page/feed, but there might be more later or next feed.
              // Just break out of the while loop to yield time, but DO NOT mark as exhausted.
              pluginInstance.checkpoint();
              break;
           }

           const acceptedRecords = [];
           const rejectedRecords = [];

           for (const raw of rawItems) {
              try {
                 const normalized = pluginInstance.normalize(raw);
                 const validResult = this.validator.validate(normalized);

                 if (validResult.isValid) {
                    acceptedRecords.push(normalized);
                 } else {
                    rejectedRecords.push({ url: normalized.url, title: normalized.title, reason: validResult.reason });
                 }
              } catch (e) {
                 this.logger.error('CrawlerEngine', 'Normalization', `Error normalizing item in ${pluginName}`, e);
                 rejectedRecords.push({ error: e.message });
              }
           }

           // Persist to RawLeads first, then Queue accepted records for Enrichment
           if (acceptedRecords.length > 0) {
              const db = getDatabase();
              const rawLeadsPayload = acceptedRecords.map(r => ({
                 _id: r.id,
                 source: pluginName,
                 url: r.url,
                 title: r.title,
                 rawJson: JSON.stringify(r),
                 enrichmentStatus: 'PENDING'
              }));
              db.batchInsert('RawLeads', rawLeadsPayload);

              const queueItems = acceptedRecords.map(r => ({
                 taskType: 'ENRICH_LEAD',
                 payload: { rawLeadId: r._id || r.id }
              }));
              this.queueManager.enqueueBatch(queueItems);
              totalProcessed += acceptedRecords.length;
           }

           // Log rejected stats and save to a RejectionDB table
           if (rejectedRecords.length > 0) {
              this.logger.info('CrawlerEngine', 'Validation', `${pluginName} rejected ${rejectedRecords.length} records.`, { sample: rejectedRecords[0] });
              try {
                  const db = getDatabase();
                  db.batchInsert('RejectedCrawls', rejectedRecords.map(r => ({
                     crawlerName: pluginName,
                     url: r.url || 'Unknown',
                     title: r.title || 'Unknown',
                     reason: r.reason || r.error || 'Unknown Validation Failure',
                     rejectedAt: new Date().toISOString()
                  })));
              } catch (dbError) {
                  this.logger.warn('CrawlerEngine', 'Validation', 'Could not save rejected records to DB. Table may not exist yet.');
              }
           }

           pluginBatchCount += rawItems.length;
           pluginInstance.checkpoint(); // save state inside plugin
        }

        // Cleanup if source naturally exhausted
        if (!hasMore) {
           pluginInstance.cleanup();
        }

      } catch (pluginError) {
        this.logger.error('CrawlerEngine', 'PluginExecution', `${pluginName} failed execution`, pluginError);
        // We do not rethrow. Let other plugins run.
      }
    }

    return { status: 'COMPLETED', payload: { recordsProcessed: totalProcessed } };
  }
}

function getCrawlerEngine() {
  if (!getCrawlerEngine.instance) {
    getCrawlerEngine.instance = new CrawlerEngine();
  }
  return getCrawlerEngine.instance;
}

/**
 * Pipeline Scheduler
 *
 * Orchestrates the high-level stages of the pipeline.
 * Decides which module should execute next and tracks progress across executions.
 * Ensures only unfinished stages are executed.
 */

class PipelineScheduler {
  constructor() {
    this.stateManager = getExecutionStateManager();
    this.queueManager = getQueueManager();
    this.logger = getSystemLog();

    // The ordered list of pipeline stages
    this.PIPELINE_STAGES = [
      'DISCOVERY',
      'CRAWLER_RSS',
      'CRAWLER_GITHUB',
      'CRAWLER_REDDIT',
      'CRAWLER_JOBS',
      'CRAWLER_FUNDING',
      'ENRICHMENT',
      'PAIN_DETECTION',
      'PRODUCT_RECOMMENDATION',
      'BUYING_INTENT',
      'DEDUPLICATION',
      'DASHBOARD_UPDATE',
      'MAINTENANCE',
      'COMPLETE'
    ];
  }

  /**
   * Starts or resumes the pipeline.
   * Finds the first unfinished stage and kicks off the corresponding worker.
   */
  startPipeline() {
    this.logger.info('PipelineScheduler', 'Evaluating pipeline stages to start/resume.');

    const state = this.stateManager.getState();
    const completedStages = state.completedStages || [];

    // Find next stage
    let nextStage = null;
    for (const stage of this.PIPELINE_STAGES) {
      if (!completedStages.includes(stage)) {
        nextStage = stage;
        break;
      }
    }

    if (!nextStage || nextStage === 'COMPLETE') {
       this.logger.info('PipelineScheduler', 'Pipeline is fully complete for this cycle.');
       return;
    }

    this.logger.info('PipelineScheduler', `Next unfinished stage is: ${nextStage}.`);

    // Update state to active stage
    this.stateManager.updateContext({
       currentStage: nextStage,
       lastHeartbeat: new Date().toISOString()
    });

    this._dispatchStage(nextStage);
  }

  /**
   * Dispatches the correct payload to the queue for a given stage.
   */
  _dispatchStage(stage) {
    this.logger.info('PipelineScheduler', `Dispatching stage: ${stage}`);

    // For many stages, we just inject an initial task into the queue to start that engine
    switch (stage) {
      case 'DISCOVERY':
        this.queueManager.enqueue('DISCOVER', { category: 'ALL' }, 1);
        break;
      case 'CRAWL': // Generic Crawl
        this.queueManager.enqueue('CRAWL', { type: 'ALL' }, 2);
        break;
      case 'CRAWLER_RSS':
        this.queueManager.enqueue('CRAWL_RSS', {}, 2);
        break;
      case 'CRAWLER_GITHUB':
        this.queueManager.enqueue('CRAWL_GITHUB', {}, 2);
        break;
      case 'CRAWLER_REDDIT':
        this.queueManager.enqueue('CRAWL_REDDIT', {}, 2);
        break;
      case 'CRAWLER_JOBS':
        this.queueManager.enqueue('CRAWL_JOBS', {}, 2);
        break;
      case 'CRAWLER_FUNDING':
        this.queueManager.enqueue('CRAWL_FUNDING', {}, 2);
        break;
      case 'ENRICHMENT':
      case 'PAIN_DETECTION':
      case 'PRODUCT_RECOMMENDATION':
      case 'BUYING_INTENT':
      case 'DEDUPLICATION':
        // These typically run continuously on queued items,
        // but we can enqueue a specific batch trigger or let ExecutionEngine process pending queue
        // For simplicity of orchestration, we ensure queue processing runs
        break;
      case 'DASHBOARD_UPDATE':
        this.queueManager.enqueue('DASHBOARD_UPDATE', {}, 3);
        break;
      case 'MAINTENANCE':
        getMaintenanceEngine().planDailyMaintenance();
        break;
      default:
        this.logger.warn('PipelineScheduler', `Unknown stage: ${stage}`);
        break;
    }

    // After queueing, transition state and kick off the execution engine
    this.stateManager.transition('QUEUED');
    getExecutionEngine().start();
  }

  /**
   * Marks a stage as complete and moves to the next stage.
   */
  markStageComplete(stage) {
    this.logger.info('PipelineScheduler', `Marking stage complete: ${stage}`);

    const state = this.stateManager.getState();
    const completedStages = state.completedStages || [];

    if (!completedStages.includes(stage)) {
       completedStages.push(stage);
    }

    this.stateManager.updateContext({
       completedStages: completedStages,
       currentStage: null
    });

    // Immediately start next stage if not checking timeouts
    this.startPipeline();
  }

  /**
   * Resets the pipeline completely (e.g., for a new daily run).
   */
  resetPipeline() {
    this.logger.info('PipelineScheduler', 'Resetting pipeline for new cycle.');
    this.stateManager.updateContext({
       currentStage: null,
       completedStages: [],
       failedStages: [],
       executionId: Utilities.getUuid(),
       startTime: new Date().toISOString()
    });
  }
}

// Singleton getter
function getPipelineScheduler() {
  if (!getPipelineScheduler.instance) {
    getPipelineScheduler.instance = new PipelineScheduler();
  }
  return getPipelineScheduler.instance;
}

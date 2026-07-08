/**
 * Automation Engine
 *
 * The top-level orchestrator for Phase 11.
 * Coordinates the TriggerManager, PipelineScheduler, RecoveryEngine,
 * HealthMonitor, QueueManager, ExecutionEngine, and SelfHealingEngine.
 * Contains orchestration logic only (no business logic).
 */

class AutomationEngine {
  constructor() {
    this.logger = getSystemLog();
    this.triggerManager = getTriggerManager();
    this.pipelineScheduler = getPipelineScheduler();
    this.recoveryEngine = getRecoveryEngine();
    this.healthMonitor = getHealthMonitor();
    this.selfHealingEngine = getSelfHealingEngine();
  }

  /**
   * Initializes the automation system (called during setup/deployment).
   */
  initialize() {
    this.logger.info('AutomationEngine', 'Initializing Automation Engine.');
    this.triggerManager.initializeSystemTriggers();
    this.logger.info('AutomationEngine', 'Initialization complete.');
  }

  /**
   * Primary entry point for the Daily Pipeline.
   */
  runDailyPipeline() {
    this.logger.info('AutomationEngine', 'Starting Daily Pipeline.');

    // Safety check - self healing before a major run
    this.selfHealingEngine.heal();

    // Reset pipeline state
    this.pipelineScheduler.resetPipeline();

    // Start the scheduler
    this.pipelineScheduler.startPipeline();
  }

  /**
   * Entry point for resuming an interrupted pipeline.
   */
  resumePipeline() {
    this.logger.info('AutomationEngine', 'Resuming Pipeline.');

    // Let the recovery engine handle crashed states
    this.recoveryEngine.recoverAndResume();

    // After execution engine runs via recovery, check if pipeline stage needs advancing
    const stateManager = getExecutionStateManager();
    const state = stateManager.getState();

    if (state.state === 'SUCCESS') {
       // If queue is completely empty, the stage is done
       const queueManager = getQueueManager();
       const pending = queueManager.getNextBatch(1);
       if (pending.length === 0 && state.currentStage) {
          this.pipelineScheduler.markStageComplete(state.currentStage);
       }
    }
  }

  /**
   * Entry point for standard health checks.
   */
  runHealthCheck() {
    this.logger.info('AutomationEngine', 'Running Scheduled Health Check.');
    const report = this.healthMonitor.generateReport();

    // If the score is critically low, trigger self-healing
    if (report.score < 80) {
      this.logger.warn('AutomationEngine', 'Health score below threshold, triggering self-healing.');
      this.selfHealingEngine.heal();
    }
  }
}

// -----------------------------------------------------------------------------
// Global Trigger Handlers mapped to AutomationEngine
// -----------------------------------------------------------------------------

function TarkaX_Automation_DailyPipeline() {
  getAutomationEngine().runDailyPipeline();
}

function TarkaX_Automation_HealthCheck() {
  getAutomationEngine().runHealthCheck();
}

function TarkaX_Automation_QueueResume() {
  getAutomationEngine().resumePipeline();
}

// Note: TarkaX_System_Resume is still used internally by TimeoutManager for 1-minute resumes,
// while TarkaX_Automation_QueueResume is a constant 15-minute cron backup.

function TarkaX_Automation_RecoveryTrigger() {
  // Dedicated catch-all recovery run
  getAutomationEngine().resumePipeline();
}

// Singleton getter
function getAutomationEngine() {
  if (!getAutomationEngine.instance) {
    getAutomationEngine.instance = new AutomationEngine();
  }
  return getAutomationEngine.instance;
}

function TarkaX_Automation_DashboardRefresh() {
  if (typeof TarkaX_Dashboard_Update === 'function') TarkaX_Dashboard_Update();
}

/**
 * PUBLIC ENTRY POINT: Installation
 * Run this function exactly once on a fresh deployment.
 * It will construct the database schemas and initialize all required triggers.
 */
function TarkaX_System_Install() {
  const logger = getSystemLog();
  logger.info('System', 'TarkaX_System_Install', 'Beginning system installation...');

  try {
    // 1. Initialize Database & Schemas (Creates sheets and headers)
    const db = getDatabase();
    db.initialize();

    // 2. Initialize Ontology
    const ontology = getPainOntologyEngine();
    ontology.initializeOntology();

    // 3. Setup Triggers
    const triggerManager = getTriggerManager();
    triggerManager.initializeSystemTriggers();

    // 4. Create Dashboard
    const dashboard = new DashboardEngine();
    dashboard.createDashboard();

    logger.info('System', 'TarkaX_System_Install', 'Installation completed successfully.');
  } catch (e) {
    logger.error('System', 'TarkaX_System_Install', 'Installation failed.', e);
    throw e;
  }
}

/**
 * Trigger Manager
 *
 * Responsible for lifecycle management of triggers across the application.
 * Ensures that the system creates required triggers, deletes duplicates,
 * validates existence, and maintains automated scheduling.
 */

class TriggerManager {
  constructor() {
    this.config = getAppConfig();
    this.logger = getSystemLog();
  }

  /**
   * Initializes all required system triggers if they don't already exist.
   */
  initializeSystemTriggers() {
    this.logger.info('TriggerManager', 'Initializing system triggers.');
    this.cleanDuplicateTriggers();

    this.ensureDailyTrigger('TarkaX_Automation_DailyPipeline', this.config.get('AUTOMATION.SCHEDULE.DAILY_PIPELINE', '01:00'));
    this.ensureHourlyTrigger('TarkaX_Automation_HealthCheck', this.config.getNumber('AUTOMATION.SCHEDULE.HEALTH_CHECK_HOURS', 1));
    this.ensureMinuteTrigger('TarkaX_Automation_QueueResume', this.config.getNumber('AUTOMATION.SCHEDULE.QUEUE_RESUME_MINUTES', 15));
    this.ensureHourlyTrigger('TarkaX_Automation_DashboardRefresh', this.config.getNumber('AUTOMATION.SCHEDULE.DASHBOARD_REFRESH_HOURS', 2));
    this.ensureDailyTrigger('TarkaX_Automation_DailyMaintenance', this.config.get('AUTOMATION.SCHEDULE.DAILY_MAINTENANCE', '02:00'));
    this.ensureWeeklyTrigger('TarkaX_Automation_WeeklyOptimization', ScriptApp.WeekDay.SUNDAY, this.config.getNumber('AUTOMATION.SCHEDULE.WEEKLY_OPTIMIZATION', 3));
    this.ensureMonthlyTrigger('TarkaX_Automation_MonthlyMaintenance', 1, this.config.getNumber('AUTOMATION.SCHEDULE.MONTHLY_MAINTENANCE', 4));

    // Recovery Trigger - Ensure it runs periodically
    this.ensureMinuteTrigger('TarkaX_Automation_RecoveryTrigger', this.config.getNumber('AUTOMATION.SCHEDULE.RECOVERY_TRIGGER_MINUTES', 30));

    this.logger.info('TriggerManager', 'System triggers initialization complete.');
  }

  /**
   * Cleans up duplicate triggers pointing to the same function.
   */
  cleanDuplicateTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    const seenFunctions = new Set();
    let deletedCount = 0;

    for (const trigger of triggers) {
      const handlerName = trigger.getHandlerFunction();

      // Do not clean the resume triggers here, they are managed by TimeoutManager
      if (handlerName === 'TarkaX_System_Resume') continue;

      if (seenFunctions.has(handlerName)) {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
        this.logger.info('TriggerManager', `Deleted duplicate trigger for ${handlerName}`);
      } else {
        seenFunctions.add(handlerName);
      }
    }

    if (deletedCount > 0) {
      this.logger.info('TriggerManager', `Cleaned up ${deletedCount} duplicate triggers.`);
    }
  }

  /**
   * Rebuilds all missing triggers.
   */
  rebuildMissingTriggers() {
    this.initializeSystemTriggers();
  }

  /**
   * Ensures a daily trigger exists for a given function.
   */
  ensureDailyTrigger(functionName, timeString) {
    if (this._triggerExists(functionName)) return;

    const [hour, minute] = timeString.split(':').map(Number);
    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .atHour(hour || 0)
        .nearMinute(minute || 0)
        .everyDays(1)
        .create();
      this.logger.info('TriggerManager', `Created daily trigger for ${functionName} at ${timeString}`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create daily trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures an hourly trigger exists.
   */
  ensureHourlyTrigger(functionName, hours) {
    if (this._triggerExists(functionName)) return;

    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .everyHours(hours)
        .create();
      this.logger.info('TriggerManager', `Created hourly trigger for ${functionName} every ${hours} hours`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create hourly trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures a minute trigger exists.
   */
  ensureMinuteTrigger(functionName, minutes) {
    if (this._triggerExists(functionName)) return;

    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .everyMinutes(minutes)
        .create();
      this.logger.info('TriggerManager', `Created minute trigger for ${functionName} every ${minutes} minutes`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create minute trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures a weekly trigger exists.
   */
  ensureWeeklyTrigger(functionName, dayOfWeek, hour) {
    if (this._triggerExists(functionName)) return;

    try {
      ScriptApp.newTrigger(functionName)
        .timeBased()
        .onWeekDay(dayOfWeek)
        .atHour(hour)
        .create();
      this.logger.info('TriggerManager', `Created weekly trigger for ${functionName} on day ${dayOfWeek} at hour ${hour}`);
    } catch (e) {
      this.logger.error('TriggerManager', `Failed to create weekly trigger for ${functionName}`, { error: e.message });
    }
  }

  /**
   * Ensures a monthly trigger exists (approximation via everyDays for Google Apps Script).
   */
  ensureMonthlyTrigger(functionName, dayOfMonth, hour) {
      if (this._triggerExists(functionName)) return;

      try {
        ScriptApp.newTrigger(functionName)
          .timeBased()
          .onMonthDay(dayOfMonth)
          .atHour(hour)
          .create();
        this.logger.info('TriggerManager', `Created monthly trigger for ${functionName} on day ${dayOfMonth} at hour ${hour}`);
      } catch (e) {
        this.logger.error('TriggerManager', `Failed to create monthly trigger for ${functionName}`, { error: e.message });
      }
  }

  /**
   * Checks if a trigger already exists for a given function.
   */
  _triggerExists(functionName) {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === functionName) {
        return true;
      }
    }
    return false;
  }
}

// Singleton getter
function getTriggerManager() {
  if (!getTriggerManager.instance) {
    getTriggerManager.instance = new TriggerManager();
  }
  return getTriggerManager.instance;
}

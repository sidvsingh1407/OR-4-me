/**
 * Dashboard Engine
 *
 * Implements an automated executive operations center.
 * It transforms operational data from Google Sheets into a real-time command center.
 */

class DashboardEngine {
  constructor() {
    this.logger = getExecutionLogger();
    this.config = getConfig();
    this.db = getDatabase();
    this.SHEET_NAME = this.config.get('DASHBOARD.SHEET_NAME', 'Dashboard');
    this.HEADER_BG = this.config.get('DASHBOARD.COLORS.HEADER_BG', '#202124');
    this.HEADER_TEXT = this.config.get('DASHBOARD.COLORS.HEADER_TEXT', 'white');
    this.TABLE_HEADER = this.config.get('DASHBOARD.COLORS.TABLE_HEADER', '#e8eaed');
    this.BG_COLOR = this.config.get('DASHBOARD.COLORS.BACKGROUND', '#f8f9fa');
    this.FONT = this.config.get('DASHBOARD.FONTS.MAIN', 'Google Sans');
  }

  /**
   * Main entry point to refresh the dashboard.
   */
  updateDashboard() {
    this.logger.info('DashboardEngine', 'updateDashboard', 'Starting dashboard update.');

    // Performance Tracking
    const startTime = Date.now();
    let lock;
    try {
      lock = LockService.getScriptLock();
    } catch (e) {
      this.logger.warn('DashboardEngine', 'updateDashboard', 'LockService unavailable.');
    }

    if (lock && !lock.tryLock(30000)) {
        this.logger.warn('DashboardEngine', 'updateDashboard', 'Could not acquire script lock for dashboard update.');
        return;
    }

    try {
      // Self-healing: if the sheet doesn't exist, this creates and builds the visual framework
      this.createDashboard();

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.SHEET_NAME);
      if (!sheet) return; // Edge case or unbound script

      const props = getScriptProps();
      const lastLeadsCount = parseInt(props.get('DASHBOARD_LAST_LEADS_COUNT', '0'), 10);
      const lastRawLeadsCount = parseInt(props.get('DASHBOARD_LAST_RAW_LEADS_COUNT', '0'), 10);

      // Load once
      const leads = this.db.findAll('Leads') || [];
      const rawLeads = this.db.findAll('RawLeads') || [];

      const currentLeadsCount = leads.length;
      const currentRawLeadsCount = rawLeads.length;

      const shouldFullRefresh = currentLeadsCount !== lastLeadsCount || currentRawLeadsCount !== lastRawLeadsCount;

      this.refreshDashboard(sheet, shouldFullRefresh, startTime, leads, rawLeads);

      props.set('DASHBOARD_LAST_LEADS_COUNT', currentLeadsCount.toString());
      props.set('DASHBOARD_LAST_RAW_LEADS_COUNT', currentRawLeadsCount.toString());

      this.logger.info('DashboardEngine', 'updateDashboard', `Dashboard update complete in ${Date.now() - startTime}ms.`);
    } catch (e) {
      this.logger.error('DashboardEngine', 'updateDashboard', 'Failed to update dashboard', e);
    } finally {
      if (lock) {
        lock.releaseLock();
      }
    }
  }

  _safeWrite(sheet, row, col, values) {
      if (!values || values.length === 0 || !values[0] || values[0].length === 0) return;
      if (typeof RetryEngine !== 'undefined') {
          RetryEngine.execute(() => {
              sheet.getRange(row, col, values.length, values[0].length).setValues(values);
          }, { operationName: 'Dashboard Write', maxRetries: 3 });
      } else {
          sheet.getRange(row, col, values.length, values[0].length).setValues(values);
      }
  }

  createDashboard() {
    let sheet;
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) return; // In non-bound environments
        sheet = ss.getSheetByName(this.SHEET_NAME);
    } catch (e) {
        return; // Handle standalone testing where active spreadsheet might not be bound
    }

    let needsRebuild = false;
    if (!sheet) {
        this.logger.info('DashboardEngine', 'createDashboard', 'Dashboard sheet not found. Creating it now.');
        needsRebuild = true;
    } else {
        // Self-Healing: check if essential formatting or ranges were deleted
        try {
           const checkCell = sheet.getRange(2, 2).getValue();
           if (checkCell !== 'SECTION 1 — EXECUTIVE SUMMARY') {
               this.logger.warn('DashboardEngine', 'createDashboard', 'Dashboard formatting appears corrupted. Rebuilding.');
               needsRebuild = true;
           }
        } catch(e) {
           needsRebuild = true;
        }
    }

    if (needsRebuild) {
        this.rebuildDashboard();
    }
  }

  rebuildDashboard() {
    let ss;
    try {
        ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) return;
    } catch (e) {
        return;
    }

    let sheet = ss.getSheetByName(this.SHEET_NAME);
    if (sheet) {
        ss.deleteSheet(sheet);
    }

    sheet = ss.insertSheet(this.SHEET_NAME, 0); // Put as first tab

    // Apply default styles to everything
    sheet.getRange(1, 1, 150, 25).setFontFamily(this.FONT).setBackground(this.BG_COLOR);
    sheet.setFrozenRows(2);
    sheet.setFrozenColumns(1);

    // Common format function
    const applyHeader = (row, col, title, mergeCount = 3) => {
        sheet.getRange(row, col, 1, mergeCount).merge().setValue(title)
             .setFontWeight("bold").setFontSize(12)
             .setBackground(this.HEADER_BG).setFontColor(this.HEADER_TEXT)
             .setVerticalAlignment("middle");
    };

    const applyTableHeaders = (row, col, headers) => {
        this._safeWrite(sheet, row, col, [headers]);
        sheet.getRange(row, col, 1, headers.length)
             .setBackground(this.TABLE_HEADER).setFontWeight('bold')
             .setBorder(true, true, true, true, null, null);
    };

    // SECTION 1 — EXECUTIVE SUMMARY
    applyHeader(2, 2, "SECTION 1 — EXECUTIVE SUMMARY", 3);
    const execLabels = [
        ['Total Companies Discovered', ''],
        ['New Companies Today', ''],
        ['New Companies This Week', ''],
        ['Qualified Leads', ''],
        ['High Intent Leads', ''],
        ['Avg Buying Intent', ''],
        ['Avg AI Pain Score', ''],
        ['Total Sources Crawled', ''],
        ['Total Records Processed', ''],
        ['Duplicate Rate', ''],
        ['Active Queue Size', ''],
        ['Failed Queue Items', ''],
        ['Current Pipeline Stage', ''],
        ['Last Successful Run', ''],
        ['Last Failed Run', ''],
        ['System Health Status', '']
    ];
    this._safeWrite(sheet, 3, 2, execLabels);
    sheet.getRange(3, 2, execLabels.length, 1).setFontWeight('bold'); // Make labels bold
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 150);

    // SECTION 2 — PIPELINE MONITORING
    applyHeader(2, 6, "SECTION 2 — PIPELINE MONITORING", 3);
    const pipelineLabels = [
        ['Current Stage', ''],
        ['Current Task', ''],
        ['Queue Progress', ''],
        ['Tasks Completed', ''],
        ['Tasks Remaining', ''],
        ['Execution Time', ''],
        ['Est. Time Remaining', '']
    ];
    this._safeWrite(sheet, 3, 6, pipelineLabels);
    sheet.getRange(3, 6, pipelineLabels.length, 1).setFontWeight('bold');
    sheet.setColumnWidth(6, 180);
    sheet.setColumnWidth(7, 150);

    // SECTION 3 — TOP 25 LEADS
    applyHeader(20, 2, "SECTION 3 — TOP 25 LEADS", 11);
    applyTableHeaders(21, 2, ['Company', 'Industry', 'Country', 'Buying Intent', 'AI Pain Score', 'Confidence', 'Source', 'Last Seen', 'Funding Status', 'Hiring Activity', 'Priority']);
    sheet.getRange(22, 2, 25, 11).setBackground('white').setBorder(true, true, true, true, true, true);
    // Formatting columns
    sheet.getRange(22, 5, 25, 2).setNumberFormat('0.0'); // Scores
    sheet.getRange(22, 7, 25, 1).setNumberFormat('0%'); // Confidence

    // SECTION 4 — PAIN INTELLIGENCE
    applyHeader(50, 2, "SECTION 4 — PAIN INTELLIGENCE", 4);
    applyTableHeaders(51, 2, ['Category', 'Count', 'Percentage', 'Severity']);
    sheet.getRange(52, 2, 10, 4).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(52, 4, 10, 1).setNumberFormat('0.0%');

    // SECTION 5 — INDUSTRY ANALYSIS
    applyHeader(50, 7, "SECTION 5 — INDUSTRY ANALYSIS", 4);
    applyTableHeaders(51, 7, ['Industry', 'Companies', 'Avg Intent', 'Avg Pain']);
    sheet.getRange(52, 7, 10, 4).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(52, 9, 10, 2).setNumberFormat('0.0');

    // SECTION 6 — COUNTRY ANALYSIS
    applyHeader(50, 12, "SECTION 6 — COUNTRY ANALYSIS", 4);
    applyTableHeaders(51, 12, ['Country', 'Companies', 'Avg Intent', 'Avg Pain']);
    sheet.getRange(52, 12, 10, 4).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(52, 14, 10, 2).setNumberFormat('0.0');

    // SECTION 7 — SOURCE PERFORMANCE
    applyHeader(65, 2, "SECTION 7 — SOURCE PERFORMANCE", 7);
    applyTableHeaders(66, 2, ['Source', 'Records Retrieved', 'Valid Leads', 'Duplicates', 'Failures', 'Success Rate', 'Last Crawl']);
    sheet.getRange(67, 2, 10, 7).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(67, 7, 10, 1).setNumberFormat('0.0%');

    // SECTION 8 — QUEUE HEALTH
    applyHeader(65, 10, "SECTION 8 — QUEUE HEALTH", 2);
    const queueLabels = [
        ['Queue Size', ''],
        ['Running Jobs', ''],
        ['Completed Jobs', ''],
        ['Failed Jobs', ''],
        ['Retry Queue', ''],
        ['Oldest Pending Job', ''],
        ['Avg Processing Time', ''],
        ['Checkpoint Count', '']
    ];
    this._safeWrite(sheet, 66, 10, queueLabels);
    sheet.getRange(66, 10, queueLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(66, 10, queueLabels.length, 1).setFontWeight('bold');

    // SECTION 9 — ERROR MONITORING
    applyHeader(80, 2, "SECTION 9 — ERROR MONITORING", 6);
    applyTableHeaders(81, 2, ['Timestamp', 'Module', 'Error', 'Retry Count', 'Status', 'Resolution']);
    sheet.getRange(82, 2, 10, 6).setBackground('white').setBorder(true, true, true, true, true, true);

    // SECTION 10 — KNOWLEDGE GRAPH
    applyHeader(95, 2, "SECTION 10 — KNOWLEDGE GRAPH", 2);
    const kgLabels = [
        ['Total Companies', ''],
        ['Total Relationships', ''],
        ['Total Pain Nodes', ''],
        ['Total Industry Nodes', ''],
        ['Total Country Nodes', ''],
        ['Total Tech Nodes', '']
    ];
    this._safeWrite(sheet, 96, 2, kgLabels);
    sheet.getRange(96, 2, kgLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(96, 2, kgLabels.length, 1).setFontWeight('bold');

    // SECTION 11 — DAILY TRENDS
    applyHeader(95, 5, "SECTION 11 — DAILY TRENDS", 2);
    const dailyLabels = [
        ['New Leads / Day', ''],
        ['High Intent / Day', ''],
        ['AI Pains / Day', ''],
        ['Crawled / Day', ''],
        ['Success Rate / Day', '']
    ];
    this._safeWrite(sheet, 96, 5, dailyLabels);
    sheet.getRange(96, 5, dailyLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(96, 5, dailyLabels.length, 1).setFontWeight('bold');

    // SECTION 12 — SYSTEM METRICS
    applyHeader(95, 8, "SECTION 12 — SYSTEM METRICS", 2);
    const sysLabels = [
        ['Total API Calls', ''],
        ['Total HTTP Requests', ''],
        ['Avg API Response Time', ''],
        ['Cache Hit Rate', ''],
        ['Lock Wait Time', ''],
        ['Memory Estimate', ''],
        ['Execution Time', ''],
        ['Daily Runtime', ''],
        ['Dashboard Gen Time', ''],
        ['Trigger Capacity', '']
    ];
    this._safeWrite(sheet, 96, 8, sysLabels);
    sheet.getRange(96, 8, sysLabels.length, 2).setBackground('white').setBorder(true, true, true, true, true, true);
    sheet.getRange(96, 8, sysLabels.length, 1).setFontWeight('bold');

    // Let's autosize everything
    for(let i=1; i<=15; i++) {
        try { sheet.autoResizeColumn(i); } catch (e) {}
    }
  }

  refreshDashboard(sheet, shouldFullRefresh, startTime, leads, rawLeads) {
    this.logger.info('DashboardEngine', 'refreshDashboard', 'Refreshing dashboard data.');

    // Load common operational data used for fast-changing sections
    const queue = this.db.findAll('Queue') || [];
    const errors = this.db.findAll('SystemLogs') || [];

    // Always update these sections
    this.updatePipelineMonitoring(sheet, queue);
    this.updateQueueHealth(sheet, queue);
    this.updateSystemMetrics(sheet, queue, startTime, errors);

    if (shouldFullRefresh) {
        // We already have leads and rawLeads loaded in updateDashboard to check lengths efficiently
        const duplicates = this.db.findAll('Duplicates') || [];

        // Compute aggregated object strictly O(n)
        const aggregated = this.aggregateDataSinglePass(leads, rawLeads, duplicates);

        this.updateKPIs(sheet, aggregated, queue, errors);
        this.updateRankings(sheet, aggregated);
        this.updateStatistics(sheet, aggregated);
        this.updateTrends(sheet, aggregated);
        this.updateKnowledgeGraphMetrics(sheet);

        this.updateCharts(sheet);
    }
  }

  aggregateDataSinglePass(leads, rawLeads, duplicates) {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const today = now.toISOString().split('T')[0];

    const HIGH_INTENT_THRESHOLD = this.config.getNumber('DASHBOARD.THRESHOLDS.HIGH_INTENT', 70);

    const agg = {
        totalLeads: leads.length,
        totalRawLeads: rawLeads.length,
        totalDuplicates: duplicates.length,
        newCompaniesToday: 0,
        newCompaniesWeek: 0,
        highIntentLeads: 0,
        totalScore: 0,
        totalPainScore: 0,

        painMap: new Map(),
        industryMap: new Map(),
        countryMap: new Map(),
        sourceMap: new Map(),

        trends: {
            newLeadsToday: 0,
            highIntentToday: 0,
            aiPainsToday: 0,
            totalCrawledToday: 0,
            successfulCrawlsToday: 0
        },

        leads: leads // keep reference for rankings
    };

    // Single pass over Leads
    for (const lead of leads) {
        const score = parseFloat(lead.score) || 0;
        const painScore = parseFloat(lead.aiPainScore) || 0;

        agg.totalScore += score;
        agg.totalPainScore += painScore;

        if (score >= HIGH_INTENT_THRESHOLD) agg.highIntentLeads++;

        const createdDate = lead._createdAt ? new Date(lead._createdAt) : now;
        const diff = now.getTime() - createdDate.getTime();

        if (diff <= oneDay) agg.newCompaniesToday++;
        if (diff <= oneWeek) agg.newCompaniesWeek++;

        const d = (lead._createdAt || '').split('T')[0];
        if (d === today) {
            if (score >= HIGH_INTENT_THRESHOLD) agg.trends.highIntentToday++;
            if (lead.aiPainCategories && lead.aiPainCategories.trim().length > 0) agg.trends.aiPainsToday++;
        }

        // Aggregate Pains
        if (lead.aiPainCategories) {
            const pains = lead.aiPainCategories.split(',').map(s => s.trim());
            for (const p of pains) {
                if (!p) continue;
                agg.painMap.set(p, (agg.painMap.get(p) || 0) + 1);
            }
        }

        // Aggregate Industry
        if (lead.industry) {
            const ind = lead.industry;
            const obj = agg.industryMap.get(ind) || { count: 0, sumScore: 0, sumPain: 0 };
            obj.count++;
            obj.sumScore += score;
            obj.sumPain += painScore;
            agg.industryMap.set(ind, obj);
        }

        // Aggregate Country
        if (lead.country) {
            const country = lead.country;
            const obj = agg.countryMap.get(country) || { count: 0, sumScore: 0 };
            obj.count++;
            obj.sumScore += score;
            agg.countryMap.set(country, obj);
        }
    }

    // Single pass over RawLeads
    for (const r of rawLeads) {
        const src = r.source || 'Unknown';
        const obj = agg.sourceMap.get(src) || { count: 0, valid: 0, fail: 0, last: '' };

        obj.count++;
        if (r.enrichmentStatus === 'ENRICHED') obj.valid++;
        if (r.crawlStatus === 'FAILED' || r.enrichmentStatus === 'FAILED') obj.fail++;
        if (r.crawlTimestamp && r.crawlTimestamp > obj.last) obj.last = r.crawlTimestamp;
        agg.sourceMap.set(src, obj);

        const d = (r._createdAt || '').split('T')[0];
        if (d === today) {
            agg.trends.totalCrawledToday++;
            if (r.crawlStatus !== 'FAILED') agg.trends.successfulCrawlsToday++;
            if (r.enrichmentStatus === 'ENRICHED') agg.trends.newLeadsToday++;
        }
    }

    return agg;
  }

  updateKPIs(sheet, agg, queue, errors) {
    const totalSourcesCrawled = agg.sourceMap.size;
    const avgIntent = agg.totalLeads ? (agg.totalScore / agg.totalLeads).toFixed(1) : 0;
    const avgPain = agg.totalLeads ? (agg.totalPainScore / agg.totalLeads).toFixed(1) : 0;

    // Queue Metrics
    let activeQueueSize = 0;
    let failedQueueItems = 0;
    queue.forEach(q => {
        if (q.status === 'PENDING' || q.status === 'RUNNING') activeQueueSize++;
        if (q.status === 'FAILED') failedQueueItems++;
    });

    const duplicateRate = agg.totalLeads ? ((agg.totalDuplicates / agg.totalLeads) * 100).toFixed(1) + '%' : '0%';
    const now = new Date();
    const lastError = (errors.find(e => e.level === 'ERROR') || {}).timestamp || 'None';

    const WARNING_FAILURES = this.config.getNumber('DASHBOARD.THRESHOLDS.WARNING_QUEUE_FAILURES', 10);

    const values = [
        [agg.totalLeads],
        [agg.newCompaniesToday],
        [agg.newCompaniesWeek],
        [agg.totalLeads], // Assuming all in Leads are 'Qualified' by enrichment
        [agg.highIntentLeads],
        [avgIntent],
        [avgPain],
        [totalSourcesCrawled],
        [agg.totalRawLeads],
        [duplicateRate],
        [activeQueueSize],
        [failedQueueItems],
        ['COMPLETED'], // Dashboard is end of pipeline
        [now.toISOString().split('T')[0]],
        [lastError],
        [failedQueueItems > WARNING_FAILURES ? 'WARNING' : 'HEALTHY']
    ];

    this._safeWrite(sheet, 3, 3, values);
  }

  updateRankings(sheet, agg) {
    const TOP_LIMIT = this.config.getNumber('DASHBOARD.LIMITS.TOP_LEADS', 25);
    const HIGH_INTENT = this.config.getNumber('DASHBOARD.THRESHOLDS.HIGH_INTENT', 70);

    // Sort leads by Buying Intent (score) descending
    const sortedLeads = agg.leads.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0)).slice(0, TOP_LIMIT);

    const displayData = [];
    for (let i = 0; i < TOP_LIMIT; i++) {
        if (i < sortedLeads.length) {
            const lead = sortedLeads[i];
            const score = parseFloat(lead.score) || 0;
            displayData.push([
                lead.company || '',
                lead.industry || '',
                lead.country || '',
                score,
                parseFloat(lead.aiPainScore) || 0,
                parseFloat(lead.confidence) || 0,
                lead.source || '',
                lead._updatedAt || lead._createdAt || '',
                lead.fundingMentioned || '',
                lead.hiringSignals || '',
                score >= HIGH_INTENT ? 'High' : (score >= 50 ? 'Medium' : 'Low')
            ]);
        } else {
            // Fill empty rows to clear out stale data
            displayData.push(['', '', '', '', '', '', '', '', '', '', '']);
        }
    }
    this._safeWrite(sheet, 22, 2, displayData);
  }

  updateStatistics(sheet, agg) {
    const CAT_LIMIT = this.config.getNumber('DASHBOARD.LIMITS.TOP_CATEGORIES', 10);

    // 1. Pain Intelligence
    const sortedPains = Array.from(agg.painMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, CAT_LIMIT);
    const painData = [];
    let totalPainCount = Array.from(agg.painMap.values()).reduce((a, b) => a + b, 0);
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedPains.length) {
            const [category, count] = sortedPains[i];
            const percentage = totalPainCount ? count / totalPainCount : 0;
            painData.push([category, count, percentage, percentage > 0.15 ? 'High' : 'Normal']);
        } else {
            painData.push(['', '', '', '']);
        }
    }
    this._safeWrite(sheet, 52, 2, painData);

    // 2. Industry Analysis
    const sortedInd = Array.from(agg.industryMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, CAT_LIMIT);
    const indData = [];
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedInd.length) {
            const [ind, stats] = sortedInd[i];
            indData.push([ind, stats.count, stats.sumScore / stats.count, stats.sumPain / stats.count]);
        } else {
            indData.push(['', '', '', '']);
        }
    }
    this._safeWrite(sheet, 52, 7, indData);

    // 3. Country Analysis
    const sortedCount = Array.from(agg.countryMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, CAT_LIMIT);
    const countData = [];
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedCount.length) {
            const [country, stats] = sortedCount[i];
            countData.push([country, stats.count, stats.sumScore / stats.count, stats.count > 5 ? 'Growing' : 'Stable']);
        } else {
            countData.push(['', '', '', '']);
        }
    }
    this._safeWrite(sheet, 52, 12, countData);

    // 4. Source Performance
    const sortedSrc = Array.from(agg.sourceMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, CAT_LIMIT);
    const srcData = [];
    for (let i = 0; i < CAT_LIMIT; i++) {
        if (i < sortedSrc.length) {
            const [src, stats] = sortedSrc[i];
            const successRate = stats.count ? ((stats.count - stats.fail) / stats.count) : 0;
            srcData.push([src, stats.count, stats.valid, 0, stats.fail, successRate, stats.last]);
        } else {
            srcData.push(['', '', '', '', '', '', '']);
        }
    }
    this._safeWrite(sheet, 67, 2, srcData);
  }

  updateTrends(sheet, agg) {
    const totalCrawled = agg.trends.totalCrawledToday;
    const values = [
        [agg.trends.newLeadsToday],
        [agg.trends.highIntentToday],
        [agg.trends.aiPainsToday],
        [totalCrawled],
        [totalCrawled ? (agg.trends.successfulCrawlsToday / totalCrawled).toFixed(2) : 0]
    ];
    this._safeWrite(sheet, 96, 6, values);
  }

  updateKnowledgeGraphMetrics(sheet) {
    const getCount = (table) => {
        try {
            return (this.db.findAll(table) || []).length;
        } catch(e) { return 0; }
    };

    const values = [
        [getCount('Companies')],
        [getCount('Relationships')],
        [getCount('PainPoints')],
        [getCount('Industries')],
        [getCount('Countries')],
        [getCount('Technologies')]
    ];
    this._safeWrite(sheet, 96, 3, values);
  }

  updatePipelineMonitoring(sheet, queue) {
      const stateStr = getScriptProps().get('ENGINE_STATE', '{}');
      let state = {};
      try { state = JSON.parse(stateStr); } catch (e) {}

      const total = queue.length;
      const completed = queue.filter(q => q.status === 'SUCCESS').length;
      const remaining = queue.filter(q => q.status === 'PENDING').length;
      const progress = total ? (completed / total * 100).toFixed(0) + '%' : '0%';

      const values = [
          [state.currentState || 'IDLE'],
          [state.currentTask || 'None'],
          [progress],
          [completed],
          [remaining],
          ['0s'],
          ['0s']
      ];
      this._safeWrite(sheet, 3, 7, values);
  }

  updateQueueHealth(sheet, queue) {
      const running = queue.filter(q => q.status === 'RUNNING').length;
      const completed = queue.filter(q => q.status === 'SUCCESS').length;
      const failed = queue.filter(q => q.status === 'FAILED').length;
      const retrying = queue.filter(q => q.attempts > 0 && q.status === 'PENDING').length;

      let oldest = 'None';
      const pending = queue.filter(q => q.status === 'PENDING').sort((a,b) => new Date(a._createdAt) - new Date(b._createdAt));
      if (pending.length > 0) {
          oldest = pending[0]._createdAt || 'Unknown';
      }

      const checkpoints = (this.db.findAll('State') || []).length;

      const values = [
          [queue.length],
          [running],
          [completed],
          [failed],
          [retrying],
          [oldest],
          ['0s'],
          [checkpoints]
      ];
      this._safeWrite(sheet, 66, 11, values);
  }

  updateSystemMetrics(sheet, queue, startTime, errors) {
    const metricsStr = getScriptProps().get('SYSTEM_METRICS', '{}');
    let sysMetrics = {};
    try { sysMetrics = JSON.parse(metricsStr); } catch(e) {}

    const calls = sysMetrics.apiCalls || 0;
    const hits = sysMetrics.cacheHits || 0;
    const total = sysMetrics.cacheTotal || 0;
    const hitRate = total ? (hits / total) : 0;

    const checkpointSize = (getScriptProps().get('ENGINE_CHECKPOINT', '').length / 1024 / 1024) || 0;
    const memEstimate = `${(5 + (queue.length * 0.0015) + checkpointSize).toFixed(2)} MB`;

    const apiTimesStr = getScriptProps().get('API_RESPONSE_TIMES', '[]');
    let apiTimes = [];
    try { apiTimes = JSON.parse(apiTimesStr); } catch(e){}
    const avgRespTime = apiTimes.length ? (apiTimes.reduce((a,b)=>a+b,0)/apiTimes.length).toFixed(1) + 's' : '0s';

    const lockWaitStr = getScriptProps().get('LOCK_WAIT_TIMES', '[]');
    let lockWaits = [];
    try { lockWaits = JSON.parse(lockWaitStr); } catch(e){}
    const avgLockWait = lockWaits.length ? (lockWaits.reduce((a,b)=>a+b,0)/lockWaits.length).toFixed(1) + 's' : '0s';

    const dailyRuntime = sysMetrics.dailyRuntimeMs ? Math.round(sysMetrics.dailyRuntimeMs / 1000 / 60) + 'm' : '0m';
    const lastExecTime = sysMetrics.lastExecutionMs ? (sysMetrics.lastExecutionMs / 1000).toFixed(1) + 's' : '0s';
    const triggerCap = '100%';
    const dashboardGenTime = Date.now() - startTime + 'ms';

    const values = [
        [calls],
        [sysMetrics.httpRequests || 0],
        [avgRespTime],
        [hitRate.toFixed(2)],
        [avgLockWait],
        [memEstimate],
        [lastExecTime],
        [dailyRuntime],
        [dashboardGenTime],
        [triggerCap]
    ];
    this._safeWrite(sheet, 96, 9, values);

    // Errors
    const recentErrors = errors.filter(e => e.level === 'ERROR').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    const errData = [];
    for (let i = 0; i < 10; i++) {
        if (i < recentErrors.length) {
            const err = recentErrors[i];
            errData.push([err.timestamp, err.module, err.message, 0, 'Unresolved', '']);
        } else {
            errData.push(['', '', '', '', '', '']);
        }
    }
    this._safeWrite(sheet, 82, 2, errData);
  }

  updateCharts(sheet) {
     // Re-create chart definitions cleanly
     // Clear existing charts
     const charts = sheet.getCharts();
     for (const chart of charts) {
         sheet.removeChart(chart);
     }

     // Pain Intelligence Chart
     const painChartBuilder = sheet.newChart()
        .asBarChart()
        .addRange(sheet.getRange(52, 2, 10, 2)) // category & count
        .setPosition(52, 17, 0, 0)
        .setOption('title', 'Top AI Pains')
        .build();
     sheet.insertChart(painChartBuilder);

     // Industry Chart
     const industryChartBuilder = sheet.newChart()
        .asPieChart()
        .addRange(sheet.getRange(52, 7, 10, 2)) // industry & count
        .setPosition(52, 23, 0, 0)
        .setOption('title', 'Industry Distribution')
        .build();
     sheet.insertChart(industryChartBuilder);
  }

  execute(payload) {
    this.updateDashboard();
    return { status: 'SUCCESS', nextState: null, payload: null };
  }
}

// Register with Task Dispatcher
function registerDashboardEngine() {
  const dispatcher = getTaskDispatcher();
  if (dispatcher) {
    dispatcher.registerTask('DASHBOARD_UPDATE', (payload) => {
      const engine = getDashboardEngine();
      return engine.execute(payload);
    });
  }
}

// Global Singleton Getter
let _dashboardEngineInstance = null;
function getDashboardEngine() {
  if (!_dashboardEngineInstance) {
    _dashboardEngineInstance = new DashboardEngine();
  }
  return _dashboardEngineInstance;
}

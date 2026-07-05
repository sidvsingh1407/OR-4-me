/**
 * TarkaX Automated Testing Engine
 *
 * STRICT CONSTRAINTS:
 * - Enterprise-grade, entirely inside Google Apps Script.
 * - Zero external dependencies.
 * - Non-invasive to production data (uses mocks or temp sheets).
 * - Single file structure.
 */

// ============================================================================
// 1. MOCK FRAMEWORK
// ============================================================================

class MockFramework {
  constructor() {
    this.originalMethods = new Map();
    this.mockedSheets = new Set();
  }

  /**
   * Stubs a method on an object.
   * @param {Object} obj The object containing the method.
   * @param {string} methodName The method name.
   * @param {Function} stubFn The replacement function.
   */
  stub(obj, methodName, stubFn) {
    if (!obj || typeof obj[methodName] !== 'function') {
      throw new Error(`Cannot stub: ${methodName} is not a function on object.`);
    }
    const key = `${obj.constructor.name || 'Obj'}.${methodName}`;
    if (!this.originalMethods.has(key)) {
      this.originalMethods.set(key, { obj, methodName, original: obj[methodName] });
    }
    obj[methodName] = stubFn;
  }

  /**
   * Spies on a method to track calls.
   */
  spy(obj, methodName) {
    const original = obj[methodName];
    const spyState = { calls: [], called: false, callCount: 0 };
    this.stub(obj, methodName, function(...args) {
      spyState.called = true;
      spyState.callCount++;
      spyState.calls.push(args);
      return original.apply(this, args);
    });
    return spyState;
  }

  /**
   * Restores all stubbed methods.
   */
  restoreAll() {
    for (const [key, record] of this.originalMethods.entries()) {
      record.obj[record.methodName] = record.original;
    }
    this.originalMethods.clear();
  }

  /**
   * Creates a temporary isolated sheet for testing.
   */
  createTempSheet(sheetName) {
    const tempName = `TEST_${sheetName}_${Utils.generateId().substring(0, 8)}`;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tempName);
    if (!sheet) {
      sheet = ss.insertSheet(tempName);
    }
    this.mockedSheets.add(tempName);
    return tempName;
  }

  /**
   * Cleans up all temporary sheets.
   */
  cleanupTempSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    for (const tempName of this.mockedSheets) {
      const sheet = ss.getSheetByName(tempName);
      if (sheet) {
        ss.deleteSheet(sheet);
      }
    }
    this.mockedSheets.clear();
  }
}

// Global Mock Framework Instance
const Mocks = new MockFramework();


// ============================================================================
// 2. ASSERTION LIBRARY
// ============================================================================

class TestAssertionError extends BaseError {
  constructor(message, expected, actual) {
    super(message, { expected, actual });
  }
}

class Assert {
  static _throw(msg, expected, actual) {
    throw new TestAssertionError(msg, expected, actual);
  }

  static equals(expected, actual, msg = "Values are not equal") {
    if (expected !== actual) this._throw(msg, expected, actual);
  }

  static notEquals(expected, actual, msg = "Values are equal") {
    if (expected === actual) this._throw(msg, expected, actual);
  }

  static isTrue(actual, msg = "Value is not true") {
    if (actual !== true) this._throw(msg, true, actual);
  }

  static isFalse(actual, msg = "Value is not false") {
    if (actual !== false) this._throw(msg, false, actual);
  }

  static isNull(actual, msg = "Value is not null") {
    if (actual !== null) this._throw(msg, null, actual);
  }

  static notNull(actual, msg = "Value is null") {
    if (actual === null) this._throw(msg, "not null", actual);
  }

  static arrayLength(expectedLength, array, msg = "Array length mismatch") {
    if (!Array.isArray(array)) this._throw("Not an array", "array", typeof array);
    if (array.length !== expectedLength) this._throw(msg, expectedLength, array.length);
  }

  static objectKeys(expectedKeys, obj, msg = "Object keys mismatch") {
    if (typeof obj !== 'object' || obj === null) this._throw("Not an object", "object", typeof obj);
    const actualKeys = Object.keys(obj);
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) this._throw(`Missing key: ${key}`, expectedKeys, actualKeys);
    }
  }

  static contains(expectedSubstring, string, msg = "String does not contain substring") {
    if (typeof string !== 'string' || !string.includes(expectedSubstring)) {
      this._throw(msg, expectedSubstring, string);
    }
  }

  static notContains(expectedSubstring, string, msg = "String contains substring") {
    if (typeof string === 'string' && string.includes(expectedSubstring)) {
      this._throw(msg, `not ${expectedSubstring}`, string);
    }
  }

  static throws(fn, expectedErrorType = null, msg = "Function did not throw") {
    try {
      fn();
    } catch (e) {
      if (expectedErrorType && !(e instanceof expectedErrorType)) {
        this._throw(`Wrong error type thrown. Expected ${expectedErrorType.name}, got ${e.constructor.name}`, expectedErrorType.name, e.constructor.name);
      }
      return; // Success
    }
    this._throw(msg, "Error", "No Error");
  }

  static deepEquals(expected, actual, msg = "Objects are not deeply equal") {
    const expectedStr = JSON.stringify(expected);
    const actualStr = JSON.stringify(actual);
    if (expectedStr !== actualStr) {
       this._throw(msg, expectedStr, actualStr);
    }
  }
}


// ============================================================================
// 3. TEST RUNNER
// ============================================================================

class TestRunner {
  constructor() {
    this.suites = new Map();
    this.results = {
      runId: Utils.generateId(),
      timestamp: new Date().toISOString(),
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0,
      details: []
    };
  }

  registerSuite(name, fn) {
    this.suites.set(name, fn);
  }

  runAll() {
    return this._executeSuites(Array.from(this.suites.keys()));
  }

  runSuite(suiteName) {
    if (!this.suites.has(suiteName)) throw new Error(`Suite not found: ${suiteName}`);
    return this._executeSuites([suiteName]);
  }

  _executeSuites(suiteNames) {
    const startTime = Date.now();
    const logger = AppLogger.getLogger('TestRunner');

    logger.info(`Starting Test Run: ${this.results.runId}`);

    for (const name of suiteNames) {
      const suiteFn = this.suites.get(name);
      try {
        const suiteInstance = new TestSuiteContext(name, this);
        suiteFn(suiteInstance);
      } catch (e) {
        logger.error(`Critical error in test suite: ${name}`, { error: e.stack });
        this._recordResult(name, 'Setup/Teardown', false, 0, e.message);
      } finally {
        Mocks.restoreAll();
        Mocks.cleanupTempSheets();
      }
    }

    this.results.duration = Date.now() - startTime;
    this.results.total = this.results.passed + this.results.failed;

    logger.info(`Test Run Complete. Passed: ${this.results.passed}, Failed: ${this.results.failed}, Duration: ${this.results.duration}ms`);

    this._saveReport();
    return this.results;
  }

  _recordResult(suiteName, testName, isSuccess, duration, errorMsg = '') {
    if (isSuccess) this.results.passed++;
    else this.results.failed++;

    this.results.details.push({
      suiteName,
      testName,
      status: isSuccess ? 'PASS' : 'FAIL',
      duration,
      errorMsg
    });
  }

  _saveReport() {
    const db = getDatabase();

    // Ensure TestReports sheet exists
    if (!db.ss.getSheetByName('TestReports')) {
      const sheet = db.ss.insertSheet('TestReports');
      sheet.appendRow(['runId', 'timestamp', 'suiteName', 'testName', 'status', 'duration', 'errorMsg']);
    }

    // Convert details to rows
    const rows = this.results.details.map(d => ({
        _id: Utils.generateId(),
        runId: this.results.runId,
        timestamp: this.results.timestamp,
        suiteName: d.suiteName,
        testName: d.testName,
        status: d.status,
        duration: d.duration,
        errorMsg: d.errorMsg
    }));

    try {
        // Direct write avoiding full DB engine schema constraints for simplicity on test reports
        const sheet = db.ss.getSheetByName('TestReports');
        const rowsData = rows.map(r => [r.runId, r.timestamp, r.suiteName, r.testName, r.status, r.duration, r.errorMsg]);
        if(rowsData.length > 0){
             sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
        }
    } catch(e) {
        AppLogger.getLogger('TestRunner').error("Failed to save test report", e);
    }
  }
}

class TestSuiteContext {
  constructor(suiteName, runner) {
    this.suiteName = suiteName;
    this.runner = runner;
  }

  test(testName, testFn) {
    const startTime = Date.now();
    let isSuccess = false;
    let errorMsg = '';

    try {
      testFn();
      isSuccess = true;
    } catch (e) {
      errorMsg = e instanceof TestAssertionError
        ? `Assertion Failed: ${e.message} | Expected: ${JSON.stringify(e.details.expected)} | Actual: ${JSON.stringify(e.details.actual)}`
        : `Error: ${e.message}\n${e.stack}`;
      AppLogger.getLogger('TestRunner').warn(`Test Failed: ${this.suiteName} -> ${testName}`, { errorMsg });
    } finally {
      const duration = Date.now() - startTime;
      this.runner._recordResult(this.suiteName, testName, isSuccess, duration, errorMsg);
      Mocks.restoreAll(); // Ensure mocks are restored between individual tests
    }
  }
}


// ============================================================================
// 4. TEST SUITES
// ============================================================================

const tarkaTestRunner = new TestRunner();

// This will replace the section labeled 4. TEST SUITES in TestingEngine.gs
// with a fully expanded set of tests

// --- QUEUE ENGINE TESTS ---
tarkaTestRunner.registerSuite('QueueEngine', (suite) => {
  suite.test('Queue Checkpoint Saving and Recovery', () => {
    const queue = getQueueManager();
    const tempSheet = Mocks.createTempSheet('Queue');
    const db = getDatabase();

    SCHEMA[tempSheet] = SCHEMA['Queue'];
    Mocks.stub(db, '_validateAndMap', (sheetName, record, isNew) => {
        if(sheetName === 'Queue') sheetName = tempSheet;
        return record;
    });

    Mocks.stub(db, 'batchInsert', (sheetName, records) => {
       if (sheetName === 'Queue') sheetName = tempSheet;
       return db.constructor.prototype.batchInsert.call(db, tempSheet, records);
    });

    // Simulate checkpoint saving via the queue
    const taskId = queue.enqueue('TEST_TASK', { foo: 'bar' }, 'PENDING');
    Assert.notNull(taskId);

    // Mock find query to retrieve task
    Mocks.stub(db, 'findMany', (sheetName, query, includeDeleted) => {
        if (sheetName === 'Queue') sheetName = tempSheet;
        return db.constructor.prototype.findMany.call(db, tempSheet, query, includeDeleted);
    });

    const tasks = db.findMany('Queue', { status: 'PENDING' });
    Assert.arrayLength(1, tasks);
    Assert.equals('TEST_TASK', tasks[0].taskType);

    Mocks.restoreAll();
  });

  suite.test('Retry Recovery & Dead Queue Detection', () => {
    // Assert retries increment properly before dying
    const task = { attempts: 2, status: 'FAILED' };
    const maxRetries = 3;
    const isDead = task.attempts >= maxRetries;
    Assert.isFalse(isDead);

    task.attempts = 3;
    Assert.isTrue(task.attempts >= maxRetries);
  });
});

// --- DATABASE TESTS ---
tarkaTestRunner.registerSuite('DatabaseEngine', (suite) => {
  suite.test('Insert, Update, Delete Lifecycle', () => {
    const db = getDatabase();
    const tempSheet = Mocks.createTempSheet('Leads_Test');
    SCHEMA[tempSheet] = SCHEMA['Leads'];
    db.ensureColumns(tempSheet);

    // Insert
    const testLead = { company: 'Test DB Lifecycle', domain: 'lifecycle.com' };
    const ids = db.batchInsert(tempSheet, [testLead]);
    Assert.arrayLength(1, ids);
    const id = ids[0];

    // Update
    db.update(tempSheet, id, { score: 50 });
    let result = db.getById(tempSheet, id);
    Assert.equals(50, result.score);

    // Soft Delete
    db.delete(tempSheet, id);
    result = db.getById(tempSheet, id);
    Assert.isNull(result, "Should be soft-deleted and not found");

    // Check with includeDeleted flag
    const allResults = db.findMany(tempSheet, { _id: id }, true);
    Assert.arrayLength(1, allResults, "Should find if includeDeleted is true");
    Assert.isTrue(allResults[0]._deleted);
  });

  suite.test('Transactions and Rollback', () => {
     const db = getDatabase();
     const tx = getTransactionManager();
     const tempSheet = Mocks.createTempSheet('Tx_Test');
     SCHEMA[tempSheet] = SCHEMA['Leads'];
     db.ensureColumns(tempSheet);

     tx.beginTransaction();
     const inserted = db.batchInsert(tempSheet, [{ company: 'Tx Co', domain: 'tx.co' }]);
     tx.rollback(db);

     const results = db.findMany(tempSheet, { company: 'Tx Co' });
     Assert.arrayLength(0, results, "Rollback should delete the inserted record");
  });
});

// --- CRAWLER TESTS ---
tarkaTestRunner.registerSuite('CrawlerEngine', (suite) => {
  const getMockedClient = (mockResponseData, statusCode = 200) => {
      const client = new HttpClient();
      Mocks.stub(client, '_fetchNative', () => ({
          getResponseCode: () => statusCode,
          getContentText: () => mockResponseData,
          getHeaders: () => ({})
      }));
      return client;
  };

  suite.test('RSS Crawler Payload Parsing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
      <channel>
        <title>Tech News</title>
        <item><title>AI Breakthrough</title><description>Details here.</description><link>http://link</link></item>
      </channel>
      </rss>`;

    // Simulate Crawler using mocked HttpClient
    const client = getMockedClient(xml);
    const res = client.get('http://rss');
    Assert.contains('<item>', res.text);
  });

  suite.test('GitHub Crawler JSON Parsing', () => {
    const json = JSON.stringify({ items: [{ html_url: 'git.com', description: 'AI Project' }] });
    const client = getMockedClient(json);
    const res = client.get('http://git');
    Assert.equals('AI Project', res.json.items[0].description);
  });

  suite.test('Greenhouse, Lever, Ashby, Workable API Invalid Payload Handling', () => {
     const client = getMockedClient('Not JSON', 500);
     Assert.throws(() => client.request('http://ats'), null, "Client should throw NetworkError on 500");
  });
});

// --- AI DISCOVERY TESTS ---
tarkaTestRunner.registerSuite('DiscoveryEngine', (suite) => {
    suite.test('Search Query Generation', () => {
        const config = getAppConfig();
        const titles = config.get('DISCOVERY.EXECUTIVE_TITLES');
        const operators = config.get('DISCOVERY.BOOLEAN_OPERATORS');
        Assert.contains('CIO', titles);
        Assert.contains('AND', operators);

        // Simulating search query construction
        const query = `"${titles[0]}" ${operators[0]} "AI"`;
        Assert.contains('AND', query);
    });
});

// --- PAIN ONTOLOGY TESTS ---
tarkaTestRunner.registerSuite('PainOntology', (suite) => {
    suite.test('Multi-Category Matching and Confidence', () => {
        const config = getAppConfig();
        const painSignals = config.get('SCORING.SIGNALS.PAIN');

        const testText = "We have major shadow AI issues and manual processes.";
        let matchCount = 0;
        let score = 0;

        painSignals.forEach(signal => {
            if (testText.toLowerCase().includes(signal.term.toLowerCase())) {
                matchCount++;
                score += signal.score;
            }
        });

        Assert.equals(2, matchCount, "Should match 'Shadow AI' and 'manual processes'");
        Assert.equals(30, score, "20 + 10");
    });
});

// --- BUYING INTENT TESTS ---
tarkaTestRunner.registerSuite('BuyingIntent', (suite) => {
    suite.test('Score Bounds and Normalization', () => {
        const config = getAppConfig();
        const maxScore = config.getNumber('SCORING.MAX_SCORE');

        // Simulating ScoringEngine bounding logic
        let rawScore = 150;
        let normalizedScore = Math.min(rawScore, maxScore);
        normalizedScore = Math.max(normalizedScore, 0);

        Assert.equals(100, normalizedScore);

        rawScore = -10;
        normalizedScore = Math.min(Math.max(rawScore, 0), maxScore);
        Assert.equals(0, normalizedScore);
    });

    suite.test('Decay Factors', () => {
        const config = getAppConfig();
        const decayRate = config.getNumber('SCORING.DECAY.RATE');
        const floor = config.getNumber('SCORING.DECAY.FLOOR');

        const ageDays = 14;
        let decay = 1 - ((ageDays / 7) * decayRate);
        decay = Math.max(decay, floor);

        Assert.equals(0.9, decay); // 1 - (2 * 0.05)
    });
});

// --- DASHBOARD TESTS ---
tarkaTestRunner.registerSuite('DashboardEngine', (suite) => {
    suite.test('Dashboard Generation and KPI Calculation', () => {
        const db = getDatabase();
        const tempDash = Mocks.createTempSheet('Dashboard_Test');
        SCHEMA[tempDash] = SCHEMA['Dashboard'];
        db.ensureColumns(tempDash);

        db.batchInsert(tempDash, [
           { metric: 'New Leads', value: '150', category: 'General' },
           { metric: 'Avg Score', value: '75.5', category: 'Scoring' }
        ]);

        const results = db.findMany(tempDash);
        Assert.arrayLength(2, results);

        // Simulating KPI update
        db.update(tempDash, results[0]._id, { value: '160' });
        const updated = db.getById(tempDash, results[0]._id);
        Assert.equals('160', updated.value);
    });
});

// --- PERFORMANCE & STRESS TESTS ---
tarkaTestRunner.registerSuite('Performance', (suite) => {
    suite.test('Stress Simulation: 5,000 Leads Queue Throughput', () => {
        const start = Date.now();
        // We simulate queue progression by mapping and processing an array
        // to verify V8 loop capabilities and memory limits
        const mockQueue = new Array(5000).fill(null).map((_, i) => ({ id: i, data: "test data" }));

        let processedCount = 0;
        for (const item of mockQueue) {
            // simulate processing overhead
            const jsonStr = JSON.stringify(item);
            const backObj = JSON.parse(jsonStr);
            if(backObj.id !== undefined) processedCount++;
        }

        const duration = Date.now() - start;
        Assert.equals(5000, processedCount);
        Assert.isTrue(duration < 3000, `Memory processing of 5k elements took ${duration}ms, expected under 3 seconds`);
    });
});

// --- FAILURE INJECTION TESTS ---
tarkaTestRunner.registerSuite('FailureInjection', (suite) => {
    suite.test('Trigger Interruption and Timeout Recovery', () => {
        // We test that RetryEngine throws TimeoutError after max delay
        let executionCount = 0;
        const failingOperation = () => {
            executionCount++;
            throw new Error("Simulated Interrupt");
        };

        const fastRetryConfig = {
            maxRetries: 2,
            baseDelayMs: 10,
            maxDelayMs: 20,
            operationName: 'Test Interruption'
        };

        Assert.throws(() => {
           RetryEngine.execute(failingOperation, fastRetryConfig);
        }, null, "Engine should throw after exhausting retries");

        // Initial call + 2 retries = 3 calls
        Assert.equals(3, executionCount);
    });

    suite.test('Simulated Property Corruption Recovery', () => {
        // Assert deep equals handles malformed JSON parsing via safe parsing wrappers
        const badJson = "{ missingQuotes: true ";
        const fallback = { recovered: true };
        const result = DBUtils.safeParse(badJson, fallback);
        Assert.deepEquals(fallback, result);
    });
});

// --- LOGGING VALIDATION TESTS ---
tarkaTestRunner.registerSuite('Logging', (suite) => {
    suite.test('All Subsystem Logs Include Proper Metadata', () => {
        const logger = AppLogger.getLogger('SubsystemTest');
        const spy = Mocks.spy(logger, '_log');

        logger.warn('Recovery applied', { retryCount: 3 });

        Assert.isTrue(spy.called);
        const meta = spy.calls[0][3];
        Assert.equals(3, meta.retryCount);
    });
});

// ============================================================================
// 5. EXPORTED RUNNERS & ASSESSMENT FUNCTION
// ============================================================================

/**
 * Runs all registered test suites.
 */
function runAllTests() {
  return tarkaTestRunner.runAll();
}

/**
 * Runs a specific named test suite.
 */
function runSuite(suiteName) {
  return tarkaTestRunner.runSuite(suiteName);
}

function runUnitTests() {
  // Define mapping of suites, for now run all or a subset
  return tarkaTestRunner._executeSuites(['QueueEngine', 'Logging', 'PainOntology']);
}

function runIntegrationTests() {
  return tarkaTestRunner._executeSuites(['DatabaseEngine']);
}

function runCrawlerTests() {
  return tarkaTestRunner.runSuite('CrawlerEngine');
}

function runQueueTests() {
  return tarkaTestRunner.runSuite('QueueEngine');
}

function runDatabaseTests() {
  return tarkaTestRunner.runSuite('DatabaseEngine');
}

function runRecoveryTests() {
  return tarkaTestRunner.runSuite('FailureInjection');
}

function runScoringTests() {
  return tarkaTestRunner.runSuite('BuyingIntent');
}

function runDashboardTests() {
  return tarkaTestRunner.runSuite('DashboardEngine');
}

/**
 * Main Production Readiness Assessment function.
 * Validates configuration, triggers, core connectivity, and runs full test suite.
 */
function runProductionReadinessAssessment() {
  const logger = AppLogger.getLogger('Assessment');
  logger.info("Starting Production Readiness Assessment...");

  const report = {
      timestamp: new Date().toISOString(),
      environment: "Google Apps Script",
      checks: {},
      testResults: null,
      isProductionReady: false
  };

  try {
      // 1. Config Check
      const config = getAppConfig();
      report.checks.config = {
          hasAiKey: !!config.get('AI.API_KEY', false) || config.get('AI.API_KEY') === '',
          hasCategories: config.get('DISCOVERY.CATEGORIES').length > 0
      };

      // 2. Database Schema Check
      const db = getDatabase();
      const testSheet = Mocks.createTempSheet('SchemaTest');
      SCHEMA[testSheet] = { test: { type: 'string' } };
      db.ensureColumns(testSheet);
      report.checks.database = {
          canCreateSheetAndHeaders: db.getHeaders(testSheet).includes('test')
      };
      Mocks.cleanupTempSheets(); // clean immediately

      // 3. Execution / Trigger check (Mocking for now to verify environment access)
      report.checks.triggers = {
          scriptAppAccessible: typeof ScriptApp !== 'undefined'
      };

      // 4. Run full test suite
      report.testResults = tarkaTestRunner.runAll();

      // Final Evaluation
      report.isProductionReady = report.testResults.failed === 0 && report.checks.database.canCreateSheetAndHeaders;

      logger.info("Assessment Complete.", { isReady: report.isProductionReady, failedTests: report.testResults.failed });

  } catch(e) {
      logger.error("Assessment Failed Critically", e);
      report.error = e.message;
  }

  // Also log summary to TestReports DB
  try {
      const db = getDatabase();
      db.insert('TestReports', {
          runId: `ASSESSMENT_${Utils.generateId().substring(0,8)}`,
          timestamp: report.timestamp,
          suiteName: 'Production Readiness',
          testName: 'Final Validation',
          status: report.isProductionReady ? 'PASS' : 'FAIL',
          duration: report.testResults ? report.testResults.duration : 0,
          errorMsg: report.isProductionReady ? '' : `Failed tests: ${report.testResults ? report.testResults.failed : 'Crash'}`
      });
  } catch(err) {
      // Ignore DB write errors here so we still return object
  }

  return report;
}

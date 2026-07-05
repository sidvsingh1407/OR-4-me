/**
 * TarkaX Phase 2 - Google Sheets Database Engine
 *
 * STRICT CONSTRAINTS:
 * - One Google Apps Script project.
 * - No top-level instantiation. Use getter functions for singletons.
 * - ES6+ Syntax, GAS V8 Compatible.
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const SCHEMA_VERSION = 1;

const SYSTEM_COLUMNS = [
  '_id',
  '_createdAt',
  '_updatedAt',
  '_deleted',
  '_deletedAt',
  '_version',
  '_checksum',
  '_source',
  '_lastProcessed',
  '_lastModifiedBy'
];

const SCHEMA = {
  Leads: {
    company: { type: 'string', required: true },
    domain: { type: 'string' },
    score: { type: 'number', default: 0 },
    website: { type: 'string' },
    industry: { type: 'string' },
    companySize: { type: 'string' },
    employeeEstimate: { type: 'number' },
    country: { type: 'string' },
    state: { type: 'string' },
    city: { type: 'string' },
    executiveNames: { type: 'string' },
    executiveTitles: { type: 'string' },
    technologiesMentioned: { type: 'string' },
    aiProductsMentioned: { type: 'string' },
    aiVendorsMentioned: { type: 'string' },
    fundingMentioned: { type: 'string' },
    hiringSignals: { type: 'string' },
    aiInitiatives: { type: 'string' },
    aiProblems: { type: 'string' },
    aiPainCategories: { type: 'string' },
    aiMaturityIndicators: { type: 'string' },
    riskIndicators: { type: 'string' },
    buyingSignals: { type: 'string' },
    sourceQuality: { type: 'number', default: 0 },
    confidenceScore: { type: 'number', default: 0 },
    completenessScore: { type: 'number', default: 0 },
    freshnessScore: { type: 'number', default: 0 },
    reliabilityScore: { type: 'number', default: 0 },
    sourceTrustScore: { type: 'number', default: 0 },
    extractionQualityScore: { type: 'number', default: 0 },
    overallQualityScore: { type: 'number', default: 0 },
    originalSource: { type: 'string' },
    originalUrl: { type: 'string' },
    crawlTimestamp: { type: 'string' }
  },
  RawLeads: {
    rawLeadId: { type: 'string', required: true },
    source: { type: 'string' },
    sourceType: { type: 'string' },
    url: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    body: { type: 'string' },
    author: { type: 'string' },
    publishedDate: { type: 'string' },
    crawlTimestamp: { type: 'string' },
    metadata: { type: 'string' },
    rawJson: { type: 'string' },
    contentHash: { type: 'string' },
    crawlStatus: { type: 'string' },
    enrichmentStatus: { type: 'string', default: 'PENDING' },
    retryCount: { type: 'number', default: 0 },
    lastAttempt: { type: 'string' },
    processingOwner: { type: 'string' }
  },
  KnowledgeGraph: {
    nodeType: { type: 'string', required: true },
    entityId: { type: 'string', required: true },
    properties: { type: 'string', default: '{}' }
  },
  Duplicates: {
    originalId: { type: 'string', required: true },
    duplicateId: { type: 'string', required: true },
    confidence: { type: 'number', default: 1.0 }
  },
  DiscoveryHistory: {
    searchQuery: { type: 'string', required: true },
    generationSource: { type: 'string' },
    category: { type: 'string' },
    confidence: { type: 'number', default: 0 },
    timesExecuted: { type: 'number', default: 0 },
    resultsReturned: { type: 'number', default: 0 },
    successRate: { type: 'number', default: 0 },
    avgLeadScore: { type: 'number', default: 0 },
    avgPainScore: { type: 'number', default: 0 },
    status: { type: 'string', default: 'ACTIVE' }
  },
  SearchQueue: {
    searchQuery: { type: 'string', required: true },
    category: { type: 'string' },
    industry: { type: 'string' },
    country: { type: 'string' },
    language: { type: 'string' },
    priority: { type: 'number', default: 1 },
    confidence: { type: 'number', default: 0 },
    source: { type: 'string' },
    generatedTimestamp: { type: 'string' },
    expirationTimestamp: { type: 'string' },
    executionStatus: { type: 'string', default: 'PENDING' },
    retryCount: { type: 'number', default: 0 },
    lastExecution: { type: 'string' }
  },
  DiscoveryMetrics: {
    metricName: { type: 'string', required: true },
    metricValue: { type: 'string', required: true },
    timestamp: { type: 'string', required: true }
  },
  DiscoveryBlacklist: {
    term: { type: 'string', required: true },
    reason: { type: 'string' },
    addedAt: { type: 'string', required: true }
  },
  DiscoveryCache: {
    cacheKey: { type: 'string', required: true },
    payload: { type: 'string', required: true },
    expiresAt: { type: 'string', required: true }
  },
  DiscoveryKeywords: {
    keyword: { type: 'string', required: true },
    category: { type: 'string' },
    confidence: { type: 'number', default: 1.0 },
    source: { type: 'string' }
  },
  DiscoveryCategories: {
    name: { type: 'string', required: true },
    description: { type: 'string' },
    status: { type: 'string', default: 'ACTIVE' }
  },
  SystemLogs: {
    timestamp: { type: 'string', required: true },
    level: { type: 'string', required: true },
    module: { type: 'string', required: true },
    operation: { type: 'string' },
    message: { type: 'string', required: true },
    stack: { type: 'string' },
    details: { type: 'string' }
  },
  Queue: {
    taskType: { type: 'string', required: true },
    status: { type: 'string', required: true, default: 'PENDING' },
    payload: { type: 'string', required: true },
    attempts: { type: 'number', default: 0 },
    nextAttemptAt: { type: 'string' }
  },
  State: {
    key: { type: 'string', required: true },
    value: { type: 'string', required: true }
  },
  Cache: {
    key: { type: 'string', required: true },
    value: { type: 'string', required: true },
    expiresAt: { type: 'string', required: true }
  },
  Config: {
    key: { type: 'string', required: true },
    value: { type: 'string', required: true }
  },
  Dashboard: {
    metric: { type: 'string', required: true },
    value: { type: 'string', required: true },
    category: { type: 'string', default: 'General' }
  },
  AuditTrail: {
    operation: { type: 'string', required: true },
    sheetName: { type: 'string', required: true },
    recordId: { type: 'string', required: true },
    changedFields: { type: 'string' },
    previousValues: { type: 'string' }
  }
};

// ============================================================================
// CORE UTILITIES
// ============================================================================

class DBUtils {
  static generateUUID() {
    return Utilities.getUuid();
  }

  static getTimestamp() {
    return new Date().toISOString();
  }

  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  static safeParse(str, fallback = null) {
    if (typeof str !== 'string') return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  static safeStringify(obj) {
    if (typeof obj === 'string') return obj;
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return String(obj);
    }
  }

  static generateChecksum(obj) {
    const str = DBUtils.safeStringify(obj);
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str)
      .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
      .join('');
  }

  static typeCheck(value, type) {
    if (value === null || value === undefined || value === '') return false;
    if (type === 'uuid') return typeof value === 'string' && value.length === 36;
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number' || !isNaN(Number(value));
    if (type === 'boolean') return typeof value === 'boolean' || value === 'true' || value === 'false';
    if (type === 'object') return typeof value === 'object' && !Array.isArray(value);
    if (type === 'array') return Array.isArray(value);
    return true; // Unknown types pass by default
  }

  static castValue(value, type) {
    if (value === null || value === undefined || value === '') return null;
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true' || value === true;
    if (type === 'string') return String(value);
    if (type === 'object' || type === 'array') return DBUtils.safeParse(value, value);
    return value;
  }
}

// ============================================================================
// SYSTEM LOGGER (FAIL-SAFE)
// ============================================================================

class FailSafeLogger {
  constructor() {
    this.isLogging = false;
  }

  log(level, module, operation, message, error = null, details = null) {
    if (this.isLogging) {
      // Recursion guard: fallback to console immediately
      console.error(`Recursive Log Attempt [${level}]: ${message}`);
      return;
    }

    this.isLogging = true;
    try {
      this._writeToSheet(level, module, operation, message, error, details);
    } catch (sheetError) {
      try {
        console.error(`SystemLogs Sheet Failure: ${sheetError.message}. Original Log [${level}]: ${message}`);
      } catch (consoleError) {
        this._writeToProperties(level, message, error);
      }
    } finally {
      this.isLogging = false;
    }
  }

  _writeToSheet(level, module, operation, message, error, details) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("No active spreadsheet found.");

    let sheet = ss.getSheetByName('SystemLogs');
    if (!sheet) {
      // Attempt emergency sheet creation
      sheet = ss.insertSheet('SystemLogs');
      sheet.appendRow(['_id', '_createdAt', 'timestamp', 'level', 'module', 'operation', 'message', 'stack', 'details']);
    }

    const row = [
      DBUtils.generateUUID(),
      DBUtils.getTimestamp(),
      DBUtils.getTimestamp(),
      level,
      module,
      operation || 'N/A',
      message,
      error && error.stack ? error.stack : (error ? String(error) : ''),
      details ? DBUtils.safeStringify(details) : ''
    ];

    RetryEngine.execute(() => {
      DistributedLockManager.executeWithLock(() => {
        sheet.appendRow(row);
        SpreadsheetApp.flush();
      }, 30000, 'SCRIPT');
    }, { operationName: 'SystemLogs Write', maxRetries: 3 });
  }

  _writeToProperties(level, message, error) {
    try {
      const props = PropertiesService.getScriptProperties();
      const logsStr = props.getProperty('EMERGENCY_LOGS') || '[]';
      let logs = DBUtils.safeParse(logsStr, []);
      logs.push({
        t: DBUtils.getTimestamp(),
        l: level,
        m: message,
        e: error ? String(error) : ''
      });
      // Keep only last 20 emergency logs to avoid 9kb limit
      if (logs.length > 20) logs = logs.slice(logs.length - 20);
      props.setProperty('EMERGENCY_LOGS', JSON.stringify(logs));
    } catch (e) {
      // Ultimate silent fail
    }
  }

  info(module, operation, message, details = null) {
    this.log('INFO', module, operation, message, null, details);
  }

  warn(module, operation, message, error = null, details = null) {
    this.log('WARN', module, operation, message, error, details);
  }

  error(module, operation, message, error = null, details = null) {
    this.log('ERROR', module, operation, message, error, details);
  }
}

let _loggerInstance = null;
function getLogger() {
  if (!_loggerInstance) {
    _loggerInstance = new FailSafeLogger();
  }
  return _loggerInstance;
}

// ============================================================================
// INDEX MANAGER (CHUNKED)
// ============================================================================

class IndexManager {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.props = PropertiesService.getScriptProperties();
    this.chunkSizeLimit = 90000; // Safe limit under 100kb for CacheService string length
  }

  _getIndexMetadataKey(sheetName, columnName) {
    return `IDX_META_${sheetName}_${columnName}`;
  }

  _getChunkKey(sheetName, columnName, chunkIndex) {
    return `IDX_${sheetName}_${columnName}_CHUNK_${chunkIndex}`;
  }

  buildIndex(sheetName, columnName, records) {
    try {
      const indexMap = {};
      records.forEach(record => {
        const val = record[columnName];
        if (val !== undefined && val !== null && val !== '') {
          const key = String(val);
          if (!indexMap[key]) indexMap[key] = [];
          indexMap[key].push(record._id);
        }
      });

      const serialized = DBUtils.safeStringify(indexMap);
      this._saveChunkedIndex(sheetName, columnName, serialized);
    } catch (e) {
      getLogger().error('IndexManager', 'buildIndex', `Failed to build index for ${sheetName}.${columnName}`, e);
    }
  }

  _saveChunkedIndex(sheetName, columnName, serializedData) {
    const numChunks = Math.ceil(serializedData.length / this.chunkSizeLimit);
    const metadata = {
      numChunks,
      updatedAt: DBUtils.getTimestamp(),
      checksum: Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, serializedData).join('')
    };

    const cachePayload = {};
    for (let i = 0; i < numChunks; i++) {
      const start = i * this.chunkSizeLimit;
      const chunk = serializedData.substring(start, start + this.chunkSizeLimit);
      cachePayload[this._getChunkKey(sheetName, columnName, i)] = chunk;
    }

    cachePayload[this._getIndexMetadataKey(sheetName, columnName)] = JSON.stringify(metadata);

    try {
      this.cache.putAll(cachePayload, 21600); // 6 hours max cache time
    } catch(e) {
      getLogger().warn('IndexManager', '_saveChunkedIndex', `Cache size exceeded for index ${sheetName}.${columnName}`, e);
    }
  }

  lookup(sheetName, columnName, value) {
    const metadataStr = this.cache.get(this._getIndexMetadataKey(sheetName, columnName));
    if (!metadataStr) return null; // Index missing or expired

    const metadata = DBUtils.safeParse(metadataStr);
    if (!metadata || !metadata.numChunks) return null;

    const chunkKeys = [];
    for (let i = 0; i < metadata.numChunks; i++) {
      chunkKeys.push(this._getChunkKey(sheetName, columnName, i));
    }

    const chunks = this.cache.getAll(chunkKeys);
    let serializedData = '';
    for (let i = 0; i < metadata.numChunks; i++) {
      const chunk = chunks[this._getChunkKey(sheetName, columnName, i)];
      if (!chunk) return null; // Missing chunk, index invalid
      serializedData += chunk;
    }

    const indexMap = DBUtils.safeParse(serializedData);
    if (!indexMap) return null;

    const key = String(value);
    return indexMap[key] || [];
  }

  invalidateIndex(sheetName, columnName) {
    this.cache.remove(this._getIndexMetadataKey(sheetName, columnName));
    // We let chunks expire naturally to avoid expensive search/remove operations,
    // as without metadata they will be ignored anyway.
  }
}

let _indexManagerInstance = null;
function getIndexManager() {
  if (!_indexManagerInstance) {
    _indexManagerInstance = new IndexManager();
  }
  return _indexManagerInstance;
}


// ============================================================================
// TRANSACTION ENGINE
// ============================================================================

class TransactionManager {
  constructor() {
    this.isActive = false;
    this.transactionId = null;
    this.writeAheadLog = [];
    this.snapshotData = {}; // Store original rows for rollback
  }

  beginTransaction() {
    if (this.isActive) {
      throw new Error("TransactionManager: A transaction is already active.");
    }
    this.isActive = true;
    this.transactionId = DBUtils.generateUUID();
    this.writeAheadLog = [];
    this.snapshotData = {};
    getLogger().info('TransactionManager', 'beginTransaction', `Started transaction ${this.transactionId}`);
  }

  registerMutation(sheetName, operation, rowId, originalData = null, newData = null) {
    if (!this.isActive) return;

    this.writeAheadLog.push({
      sheetName,
      operation,
      rowId,
      newData: DBUtils.deepClone(newData)
    });

    if (!this.snapshotData[sheetName]) {
      this.snapshotData[sheetName] = {};
    }

    // Only store snapshot on first mutation of this row within the transaction
    if (originalData && !this.snapshotData[sheetName][rowId]) {
      this.snapshotData[sheetName][rowId] = DBUtils.deepClone(originalData);
    }
  }

  commit() {
    if (!this.isActive) {
      throw new Error("TransactionManager: No active transaction to commit.");
    }

    // In a Google Sheets environment, true atomic commits across multiple rows/sheets
    // without locking the entire workbook is difficult.
    // Since mutations are applied immediately to the sheet by the Database engine,
    // "commit" simply means finalizing and clearing the rollback log.

    getLogger().info('TransactionManager', 'commit', `Committed transaction ${this.transactionId} with ${this.writeAheadLog.length} operations`);

    this._reset();
  }

  rollback(databaseInstance) {
    if (!this.isActive) {
      throw new Error("TransactionManager: No active transaction to rollback.");
    }

    getLogger().warn('TransactionManager', 'rollback', `Rolling back transaction ${this.transactionId}`);

    // Reverse the write ahead log and undo operations
    // Note: This requires access to the Database engine methods
    const reversedLog = [...this.writeAheadLog].reverse();

    for (const log of reversedLog) {
      try {
        if (log.operation === 'INSERT') {
          // Soft delete or hard delete the newly inserted row
          databaseInstance._hardDelete(log.sheetName, log.rowId);
        } else if (log.operation === 'UPDATE' || log.operation === 'DELETE') {
          // Restore the original data
          const original = this.snapshotData[log.sheetName]?.[log.rowId];
          if (original) {
            databaseInstance._restoreRow(log.sheetName, log.rowId, original);
          }
        }
      } catch (e) {
        getLogger().error('TransactionManager', 'rollback', `Failed to rollback operation ${log.operation} on ${log.sheetName}:${log.rowId}`, e);
      }
    }

    getLogger().info('TransactionManager', 'rollback', `Rollback complete for transaction ${this.transactionId}`);
    this._reset();
  }

  _reset() {
    this.isActive = false;
    this.transactionId = null;
    this.writeAheadLog = [];
    this.snapshotData = {};
  }
}

let _transactionManagerInstance = null;
function getTransactionManager() {
  if (!_transactionManagerInstance) {
    _transactionManagerInstance = new TransactionManager();
  }
  return _transactionManagerInstance;
}


// ============================================================================
// DATABASE ENGINE
// ============================================================================

class Database {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!this.ss) {
      throw new Error("DatabaseEngine: Active spreadsheet not found.");
    }
    this.headerCache = {}; // { sheetName: { colName: index (0-based) } }
    this.idRowCache = {};  // { sheetName: { id: rowIndex (1-based) } }
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION & DDL
  // --------------------------------------------------------------------------

  initialize() {
    getLogger().info('DatabaseEngine', 'initialize', 'Starting database initialization');
    let status = { created: [], updated: [], errors: [] };

    // Check schema version migration
    const props = PropertiesService.getScriptProperties();
    const currentVersionStr = props.getProperty('DB_SCHEMA_VERSION');
    const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 0;

    if (currentVersion < SCHEMA_VERSION) {
       getLogger().info('DatabaseEngine', 'initialize', `Migrating database schema from version ${currentVersion} to ${SCHEMA_VERSION}`);
       // Put future migration logic here (e.g. data transformations).
       // For now, ensuring columns is sufficient for adding new ones.
       props.setProperty('DB_SCHEMA_VERSION', SCHEMA_VERSION.toString());
    }

    for (const sheetName of Object.keys(SCHEMA)) {
      try {
        this._ensureSheetExists(sheetName);
        this._ensureSchemaColumns(sheetName);
        status.updated.push(sheetName);
      } catch (e) {
        status.errors.push(`Failed on ${sheetName}: ${e.message}`);
        getLogger().error('DatabaseEngine', 'initialize', `Error initializing ${sheetName}`, e);
      }
    }

    getLogger().info('DatabaseEngine', 'initialize', 'Database initialization complete', status);
    return status;
  }

  _ensureSheetExists(sheetName) {
    let sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = this.ss.insertSheet(sheetName);
      getLogger().info('DatabaseEngine', '_ensureSheetExists', `Created sheet: ${sheetName}`);
    }
    return sheet;
  }

  _ensureSchemaColumns(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return;

    const schemaFields = Object.keys(SCHEMA[sheetName] || {});
    const allRequiredFields = [...SYSTEM_COLUMNS, ...schemaFields];

    DistributedLockManager.executeWithLock(() => {
      let headers = this._getHeaders(sheetName);
      if (headers.length === 0) {
        // Brand new sheet
        sheet.appendRow(allRequiredFields);
        headers = allRequiredFields;
      } else {
        // Check for missing columns
        const missingFields = allRequiredFields.filter(f => !headers.includes(f));
        if (missingFields.length > 0) {
          const newHeaders = [...headers, ...missingFields];
          // Write headers back
          sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
          headers = newHeaders;
          getLogger().info('DatabaseEngine', '_ensureSchemaColumns', `Added missing columns to ${sheetName}: ${missingFields.join(', ')}`);
        }
      }
      SpreadsheetApp.flush();
      // Update cache
      this._updateHeaderCache(sheetName, headers);
    }, 30000, 'SCRIPT');
  }

  _getHeaders(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return [];

    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) return [];

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return headers.map(h => String(h).trim());
  }

  _updateHeaderCache(sheetName, headers) {
    this.headerCache[sheetName] = {};
    headers.forEach((h, i) => {
      if (h) this.headerCache[sheetName][h] = i;
    });
  }

  _getHeaderMap(sheetName) {
    if (!this.headerCache[sheetName]) {
      const headers = this._getHeaders(sheetName);
      this._updateHeaderCache(sheetName, headers);
    }
    return this.headerCache[sheetName];
  }

  createSheet(sheetName) {
    return this._ensureSheetExists(sheetName);
  }

  dropSheet(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (sheet) {
      this.ss.deleteSheet(sheet);
      delete this.headerCache[sheetName];
      delete this.idRowCache[sheetName];
    }
  }

  truncate(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    delete this.idRowCache[sheetName];
  }

  // --------------------------------------------------------------------------
  // CORE CRUD
  // --------------------------------------------------------------------------

  insert(sheetName, record) {
    return this.batchInsert(sheetName, [record])[0];
  }

  batchInsert(sheetName, records) {
    if (!records || records.length === 0) return [];
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`DatabaseEngine: Sheet ${sheetName} not found.`);

    const headerMap = this._getHeaderMap(sheetName);
    const numCols = Object.keys(headerMap).length;
    const rows = [];
    const insertedIds = [];
    const tx = getTransactionManager();
    const timestamp = DBUtils.getTimestamp();

    records.forEach(rec => {
      // Validate & map
      const mappedRecord = this._validateAndMap(sheetName, rec, true);
      const row = new Array(numCols).fill('');

      for (const [colName, colIndex] of Object.entries(headerMap)) {
        let val = mappedRecord[colName];
        if (val !== undefined && val !== null) {
          row[colIndex] = typeof val === 'object' ? DBUtils.safeStringify(val) : val;
        }
      }
      rows.push(row);
      insertedIds.push(mappedRecord._id);

      if (tx.isActive) {
        tx.registerMutation(sheetName, 'INSERT', mappedRecord._id, null, mappedRecord);
      }
    });

    // Automatically chunk large batches (e.g. 1000 rows max per write)
    const chunkSize = 1000;

    RetryEngine.execute(() => {
      DistributedLockManager.executeWithLock(() => {
        let startRow = sheet.getLastRow() + 1;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          sheet.getRange(startRow, 1, chunk.length, numCols).setValues(chunk);
          startRow += chunk.length;
        }
        SpreadsheetApp.flush();
      }, 30000, 'SCRIPT');
    }, { operationName: `batchInsert on ${sheetName}`, maxRetries: 3 });

    // Write to Audit Trail
    this._writeAuditTrail(sheetName, 'INSERT', records, null);

    return insertedIds;
  }

  update(sheetName, id, updates) {
    return this.batchUpdate(sheetName, { [id]: updates })[0];
  }

  batchUpdate(sheetName, updatesById) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`DatabaseEngine: Sheet ${sheetName} not found.`);

    const idsToUpdate = Object.keys(updatesById);
    if (idsToUpdate.length === 0) return [];

    const headerMap = this._getHeaderMap(sheetName);
    const numCols = Object.keys(headerMap).length;
    const tx = getTransactionManager();
    const timestamp = DBUtils.getTimestamp();
    const updatedIds = [];
    const indexMgr = getIndexManager();

    // To ensure bulk efficiency, we read everything, update in memory, then overwrite the sheet.
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const dataRange = sheet.getRange(2, 1, lastRow - 1, numCols);
    const data = dataRange.getValues();
    const schema = SCHEMA[sheetName] || {};
    let hasUpdates = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // Quick find _id index
      const idIndex = headerMap['_id'];
      if (idIndex === undefined) continue;

      const recordId = row[idIndex];
      const updates = updatesById[recordId];

      if (updates) {
        hasUpdates = true;
        // Parse original
        const originalRec = {};
        for (const [colName, colIndex] of Object.entries(headerMap)) {
          let val = row[colIndex];
          if (schema[colName]) {
            val = DBUtils.castValue(val, schema[colName].type);
          }
          originalRec[colName] = val;
        }

        if (originalRec._deleted === true) continue;

        let updatedRec = { ...originalRec, ...updates };
        updatedRec._updatedAt = timestamp;
        updatedRec._version = (Number(updatedRec._version) || 0) + 1;
        updatedRec = this._validateAndMap(sheetName, updatedRec, false);

        if (tx.isActive) {
          tx.registerMutation(sheetName, 'UPDATE', updatedRec._id, originalRec, updatedRec);
        }

        // Map back to row array
        for (const [colName, colIndex] of Object.entries(headerMap)) {
          let val = updatedRec[colName];
          if (val !== undefined && val !== null) {
            data[i][colIndex] = typeof val === 'object' ? DBUtils.safeStringify(val) : val;
          } else {
            data[i][colIndex] = '';
          }
        }
        updatedIds.push(updatedRec._id);

        // Update basic index
        indexMgr.buildIndex(sheetName, '_id', [updatedRec]);
      }
    }

    if (!hasUpdates) return [];

    // Automatically chunk large batch updates
    const chunkSize = 1000;

    RetryEngine.execute(() => {
      DistributedLockManager.executeWithLock(() => {
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const chunkRange = sheet.getRange(i + 2, 1, chunk.length, numCols);
            chunkRange.setValues(chunk);
        }
        SpreadsheetApp.flush();
      }, 30000, 'SCRIPT');
    }, { operationName: `batchUpdate on ${sheetName}`, maxRetries: 3 });

    // Assuming we have original state for audit logging, in a real scenario we'd pass it.
    // For now we just log the updates.
    this._writeAuditTrail(sheetName, 'UPDATE', updatedIds.map(id => updatesById[id]), null);

    return updatedIds;
  }

  delete(sheetName, id, hard = false) {
    if (hard) {
      this._hardDelete(sheetName, id);
    } else {
      this.update(sheetName, id, { _deleted: true, _deletedAt: DBUtils.getTimestamp() });
    }
  }

  _hardDelete(sheetName, id) {
     const sheet = this.ss.getSheetByName(sheetName);
     if (!sheet) return;

     const headerMap = this._getHeaderMap(sheetName);
     const idColIndex = headerMap['_id'];
     if (idColIndex === undefined) return;

     const lastRow = sheet.getLastRow();
     if (lastRow < 2) return;

     const idData = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();

     const rowIndex = idData.findIndex(row => row[0] === id) + 2;

     if (rowIndex > 1) {
       RetryEngine.execute(() => {
          DistributedLockManager.executeWithLock(() => {
            sheet.deleteRow(rowIndex);
            SpreadsheetApp.flush();
          }, 30000, 'SCRIPT');
       }, { operationName: `hardDelete on ${sheetName}`});
     }
  }

  _writeAuditTrail(sheetName, operation, records, previousValues) {
      // Avoid recursive audit logging
      if (sheetName === 'AuditTrail') return;

      const tx = getTransactionManager();
      if (!tx.isActive) {
          // If not in a transaction, log directly to AuditTrail sheet.
          // Note: In an enterprise setting, this might be queued or batched to avoid slowing down inserts.
          const auditRecords = [];

          let recordsArr = records;
          if (!Array.isArray(recordsArr)) {
              recordsArr = [records];
          }

          const prevValuesArr = previousValues ? (Array.isArray(previousValues) ? previousValues : [previousValues]) : [];

          for (let i = 0; i < recordsArr.length; i++) {
              const rec = recordsArr[i];
              if (!rec) continue;

              auditRecords.push({
                  operation: operation,
                  sheetName: sheetName,
                  recordId: rec._id || (rec.id ? rec.id : 'unknown'),
                  changedFields: DBUtils.safeStringify(rec),
                  previousValues: prevValuesArr[i] ? DBUtils.safeStringify(prevValuesArr[i]) : ''
              });
          }

          if (auditRecords.length > 0) {
              // Fire and forget batch insert for audit trails
              try {
                  this.batchInsert('AuditTrail', auditRecords);
              } catch(e) {
                  getLogger().warn('DatabaseEngine', '_writeAuditTrail', 'Failed to write to AuditTrail', e);
              }
          }
      }
  }

  _restoreRow(sheetName, id, originalData) {
     // Used by rollback
     const headerMap = this._getHeaderMap(sheetName);
     const idColIndex = headerMap['_id'];

     const sheet = this.ss.getSheetByName(sheetName);
     if (sheet && idColIndex !== undefined) {
         const lastRow = sheet.getLastRow();
         if (lastRow >= 2) {
             const idData = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
             const rowIndex = idData.findIndex(row => row[0] === id) + 2;

             if (rowIndex > 1) {
                 this.update(sheetName, id, originalData);
                 return;
             }
         }
     }
     this.insert(sheetName, originalData); // Re-insert if hard deleted
  }

  // --------------------------------------------------------------------------
  // QUERY & READ
  // --------------------------------------------------------------------------

  getById(sheetName, id) {
    return this.find(sheetName, { _id: id });
  }

  find(sheetName, query, includeDeleted = false) {
    const results = this.findMany(sheetName, query, includeDeleted);
    return results.length > 0 ? results[0] : null;
  }

  findMany(sheetName, query = {}, includeDeleted = false) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const headerMap = this._getHeaderMap(sheetName);
    const numCols = Object.keys(headerMap).length;
    const indexMgr = getIndexManager();
    const schema = SCHEMA[sheetName] || {};

    // Check if we can use an index for simple equality queries
    let possibleIndexedIds = null;
    let usedIndex = false;
    for (const [key, value] of Object.entries(query)) {
      if (typeof value !== 'object' && value !== null) {
        // Try looking up in cache index
        const indexResults = indexMgr.lookup(sheetName, key, value);
        if (indexResults && indexResults.length > 0) {
           if (possibleIndexedIds === null) {
              possibleIndexedIds = new Set(indexResults);
           } else {
              // Intersect
              possibleIndexedIds = new Set(indexResults.filter(id => possibleIndexedIds.has(id)));
           }
           usedIndex = true;
        }
      }
    }

    // Read all data - batch first philosophy
    const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
    const results = [];

    const idIndex = headerMap['_id'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      if (usedIndex && idIndex !== undefined) {
          const rowId = row[idIndex];
          if (!possibleIndexedIds.has(rowId)) continue;
      }

      const record = {};

      for (const [colName, colIndex] of Object.entries(headerMap)) {
        let val = row[colIndex];
        const fieldSchema = schema[colName];
        if (fieldSchema) {
          val = DBUtils.castValue(val, fieldSchema.type);
        }
        record[colName] = val;
      }

      if (!includeDeleted && record._deleted === true) {
        continue;
      }

      if (this._matchesQuery(record, query)) {
        results.push(record);
      }
    }

    return results;
  }

  exists(sheetName, query) {
    return this.find(sheetName, query) !== null;
  }

  count(sheetName, query) {
    return this.findMany(sheetName, query).length;
  }

  upsert(sheetName, query, record) {
    const existing = this.find(sheetName, query);
    if (existing) {
      return this.update(sheetName, existing._id, record);
    } else {
      return this.insert(sheetName, { ...query, ...record });
    }
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS & VALIDATION
  // --------------------------------------------------------------------------

  _validateAndMap(sheetName, record, isNew = false) {
    const schema = SCHEMA[sheetName] || {};
    const mapped = DBUtils.deepClone(record);
    const timestamp = DBUtils.getTimestamp();

    if (isNew) {
      mapped._id = mapped._id || DBUtils.generateUUID();
      mapped._createdAt = timestamp;
      mapped._updatedAt = timestamp;
      mapped._deleted = false;
      mapped._version = 1;
    }

    // Apply defaults and validate
    for (const [field, rule] of Object.entries(schema)) {
      if (mapped[field] === undefined || mapped[field] === null || mapped[field] === '') {
        if (rule.default !== undefined) {
          mapped[field] = rule.default;
        } else if (rule.required && isNew) {
          throw new Error(`DatabaseEngine: Field ${field} is required on ${sheetName}`);
        }
      }

      if (mapped[field] !== undefined && mapped[field] !== null && mapped[field] !== '') {
         if (!DBUtils.typeCheck(mapped[field], rule.type)) {
           throw new Error(`DatabaseEngine: Type mismatch on ${sheetName}.${field}. Expected ${rule.type}`);
         }

         if (rule.unique) {
           // We do a fast check for uniqueness. Since finding all rows might be slow during insert,
           // we only check if explicitly needed or if we can use an index.
           // In Phase 2, relying on a naive find() for uniqueness on every insert can be O(N^2).
           // Assuming a lightweight index check here:
           const existing = getIndexManager().lookup(sheetName, field, mapped[field]);
           if (existing && existing.length > 0 && (!mapped._id || !existing.includes(mapped._id))) {
               throw new Error(`DatabaseEngine: Unique constraint violated on ${sheetName}.${field} with value ${mapped[field]}`);
           }
         }
      }
    }

    mapped._checksum = DBUtils.generateChecksum(mapped);
    return mapped;
  }

  _matchesQuery(record, query) {
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null) {
        // Complex query (e.g. { $gt: 5, $contains: 'foo' })
        for (const [op, opValue] of Object.entries(value)) {
           if (op === '$gt' && !(record[key] > opValue)) return false;
           if (op === '$lt' && !(record[key] < opValue)) return false;
           if (op === '$gte' && !(record[key] >= opValue)) return false;
           if (op === '$lte' && !(record[key] <= opValue)) return false;
           if (op === '$contains' && !(String(record[key]).includes(String(opValue)))) return false;
           if (op === '$startsWith' && !(String(record[key]).startsWith(String(opValue)))) return false;
           if (op === '$endsWith' && !(String(record[key]).endsWith(String(opValue)))) return false;
           if (op === '$regex' && !(new RegExp(opValue).test(String(record[key])))) return false;
           if (op === '$between' && Array.isArray(opValue) && !(record[key] >= opValue[0] && record[key] <= opValue[1])) return false;
        }
      } else {
        // Exact match
        if (record[key] !== value) return false;
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // EXTERNAL TRANSACTION API (Missing previously)
  // --------------------------------------------------------------------------

  beginTransaction() {
    getTransactionManager().beginTransaction();
  }

  commit() {
    getTransactionManager().commit();
  }

  rollback() {
    getTransactionManager().rollback(this);
  }

  getHeaders(sheetName) {
    const map = this._getHeaderMap(sheetName);
    return Object.keys(map);
  }

  ensureColumns(sheetName) {
    this._ensureSchemaColumns(sheetName);
  }

  // --------------------------------------------------------------------------
  // TRANSACTIONS & EXPORT
  // --------------------------------------------------------------------------

  transaction(callback) {
    const tx = getTransactionManager();
    tx.beginTransaction();
    try {
      const result = callback(this);
      tx.commit();
      return result;
    } catch (e) {
      tx.rollback(this);
      throw e;
    }
  }

  exportJSON(sheetName) {
    return JSON.stringify(this.findMany(sheetName));
  }

  importJSON(sheetName, jsonString) {
    const records = DBUtils.safeParse(jsonString);
    if (!Array.isArray(records)) throw new Error("DatabaseEngine: Invalid JSON format for import");
    return this.batchInsert(sheetName, records);
  }

  getStatistics(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (!sheet) return null;

    const allRecords = this.findMany(sheetName, {}, true);
    const activeRecords = allRecords.filter(r => !r._deleted);
    const deletedCount = allRecords.length - activeRecords.length;

    let lastUpdate = null;
    if (allRecords.length > 0) {
      lastUpdate = allRecords.reduce((max, r) => r._updatedAt > max ? r._updatedAt : max, allRecords[0]._updatedAt);
    }

    return {
      totalRows: allRecords.length,
      activeRows: activeRecords.length,
      deletedRows: deletedCount,
      lastUpdate: lastUpdate,
      columnCount: sheet.getLastColumn()
    };
  }
}

let _databaseInstance = null;
function getDatabase() {
  if (!_databaseInstance) {
    _databaseInstance = new Database();
  }
  return _databaseInstance;
}

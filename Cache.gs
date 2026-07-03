/**
 * Cache Manager.
 * Abstracts Google Apps Script CacheService with automatic JSON serialization.
 */
class CacheManager {
  /**
   * Initializes the cache manager for a specific cache scope.
   * @param {string} [scope='SCRIPT'] - The cache scope: 'SCRIPT', 'USER', or 'DOCUMENT'.
   */
  constructor(scope = 'SCRIPT') {
    Validation.assertString(scope, 'Cache Scope');
    this.scope = scope.toUpperCase();
    this.logger = AppLogger.getLogger(`CacheManager[${this.scope}]`);
    this._cache = this._getService();
  }

  /**
   * Internal method to get the native GAS CacheService instance.
   * @returns {GoogleAppsScript.Cache.Cache} The cache service instance.
   */
  _getService() {
    if (typeof CacheService === 'undefined') {
      this.logger.warn('CacheService is undefined. Using in-memory mock cache.');
      return {
        _store: {},
        get: function(k) { return this._store[k] || null; },
        put: function(k, v, exp) { this._store[k] = v; },
        remove: function(k) { delete this._store[k]; }
      };
    }

    switch (this.scope) {
      case 'SCRIPT':
        return CacheService.getScriptCache();
      case 'USER':
        return CacheService.getUserCache();
      case 'DOCUMENT':
        return CacheService.getDocumentCache();
      default:
        throw new ConfigurationError(`Unsupported cache scope: ${this.scope}`);
    }
  }

  /**
   * Retrieves and deserializes a value from the cache.
   * @param {string} key - The cache key.
   * @returns {*} The cached value, or null if not found/expired.
   */
  get(key) {
    Validation.assertString(key, 'Cache Key');
    try {
      const cachedStr = this._cache.get(key);
      if (!cachedStr) {
        return null;
      }
      return JSON.parse(cachedStr);
    } catch (e) {
      this.logger.warn(`Failed to retrieve or parse cache key '${key}': ${e.message}`);
      return null;
    }
  }

  /**
   * Serializes and stores a value in the cache.
   * @param {string} key - The cache key.
   * @param {*} value - The value to cache.
   * @param {number} [expirationInSeconds=600] - Cache expiration time in seconds (max 21600).
   */
  put(key, value, expirationInSeconds = 600) {
    Validation.assertString(key, 'Cache Key');
    Validation.assertNotNull(value, 'Cache Value');
    Validation.assertNumber(expirationInSeconds, 'Expiration Time');

    if (expirationInSeconds < 1 || expirationInSeconds > 21600) {
      this.logger.warn(`Invalid expiration time ${expirationInSeconds}s. Clamping to valid range.`);
      expirationInSeconds = Math.max(1, Math.min(expirationInSeconds, 21600));
    }

    try {
      const stringified = JSON.stringify(value);
      // GAS Cache limit is 100KB per item. Checking approx size.
      if (stringified.length > 100000) {
         this.logger.warn(`Value for key '${key}' exceeds 100KB cache limit. Skipping cache put.`);
         return;
      }
      this._cache.put(key, stringified, expirationInSeconds);
    } catch (e) {
      this.logger.error(`Failed to put value into cache for key '${key}'`, { error: e.message });
    }
  }

  /**
   * Removes a value from the cache.
   * @param {string} key - The cache key.
   */
  remove(key) {
    Validation.assertString(key, 'Cache Key');
    try {
      this._cache.remove(key);
    } catch (e) {
      this.logger.warn(`Failed to remove cache key '${key}': ${e.message}`);
    }
  }
}

// Export pre-configured managers for common scopes
function getScriptCache() {
  if (!getScriptCache.instance) {
    getScriptCache.instance = new CacheManager('SCRIPT');
  }
  return getScriptCache.instance;
}

/**
 * Properties Manager.
 * Abstracts Google Apps Script PropertiesService for secure credential and script property management.
 */
class PropertiesManager {
  /**
   * Initializes the manager for a specific property store.
   * @param {string} [storeType='SCRIPT'] - The property store type: 'SCRIPT', 'USER', or 'DOCUMENT'.
   */
  constructor(storeType = 'SCRIPT') {
    Validation.assertString(storeType, 'Store Type');
    this.storeType = storeType.toUpperCase();
    this.logger = AppLogger.getLogger(`PropertiesManager[${this.storeType}]`);
    this._properties = this._getService();
  }

  /**
   * Internal method to get the native GAS PropertiesService instance.
   * @returns {GoogleAppsScript.Properties.Properties} The properties service instance.
   */
  _getService() {
    if (typeof PropertiesService === 'undefined') {
      // Mock for non-GAS environments
      this.logger.warn('PropertiesService is undefined. Using in-memory mock.');
      return {
        _mock: {},
        getProperty: function(k) { return this._mock[k] || null; },
        setProperty: function(k, v) { this._mock[k] = v; return this; },
        deleteProperty: function(k) { delete this._mock[k]; return this; },
        getProperties: function() { return Utils.deepClone(this._mock); },
        setProperties: function(obj, del) {
          if (del) this._mock = {};
          Object.assign(this._mock, obj);
          return this;
        }
      };
    }

    switch (this.storeType) {
      case 'SCRIPT':
        return PropertiesService.getScriptProperties();
      case 'USER':
        return PropertiesService.getUserProperties();
      case 'DOCUMENT':
        return PropertiesService.getDocumentProperties();
      default:
        throw new ConfigurationError(`Unsupported store type: ${this.storeType}`);
    }
  }

  /**
   * Gets a property value by key.
   * @param {string} key - The property key.
   * @param {string} [defaultValue=null] - Default value if not found.
   * @returns {string|null} The property value.
   */
  get(key, defaultValue = null) {
    Validation.assertString(key, 'Property Key');
    try {
      const value = this._properties.getProperty(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      throw new BaseError(`Failed to read property: ${key}`, { originalError: e.message });
    }
  }

  /**
   * Sets a property value.
   * @param {string} key - The property key.
   * @param {string} value - The property value.
   */
  set(key, value) {
    Validation.assertString(key, 'Property Key');
    Validation.assertString(value, 'Property Value');
    try {
      this._properties.setProperty(key, value);
    } catch (e) {
      throw new BaseError(`Failed to set property: ${key}`, { originalError: e.message });
    }
  }

  /**
   * Deletes a property by key.
   * @param {string} key - The property key.
   */
  delete(key) {
    Validation.assertString(key, 'Property Key');
    try {
      this._properties.deleteProperty(key);
    } catch (e) {
      throw new BaseError(`Failed to delete property: ${key}`, { originalError: e.message });
    }
  }

  /**
   * Gets all properties as an object.
   * @returns {Object} All properties.
   */
  getAll() {
    try {
      return this._properties.getProperties();
    } catch (e) {
      throw new BaseError('Failed to get all properties', { originalError: e.message });
    }
  }
}

// Export pre-configured managers for common stores
function getScriptProps() {
  if (!getScriptProps.instance) {
    getScriptProps.instance = new PropertiesManager('SCRIPT');
  }
  return getScriptProps.instance;
}
function getUserProps() {
  if (!getUserProps.instance) {
    getUserProps.instance = new PropertiesManager('USER');
  }
  return getUserProps.instance;
}

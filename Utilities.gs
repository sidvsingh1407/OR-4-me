/**
 * General purpose utilities for the application.
 */
class Utils {
  /**
   * Generates a pseudo-random UUID-like string.
   * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * @returns {string} The generated ID.
   */
    static generateId() {
    if (typeof Utilities !== 'undefined' && Utilities.getUuid) {
      return Utilities.getUuid();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Suspends execution for the specified number of milliseconds.
   * @param {number} ms - The number of milliseconds to sleep.
   */
  static sleep(ms) {
    Validation.assertNumber(ms, 'Sleep duration (ms)');
    if (ms < 0) {
      throw new ValidationError('Sleep duration cannot be negative.');
    }
    // Utilities.sleep is a built-in Google Apps Script service.
    // We wrap it to provide validation and a standard namespace.
    if (typeof Utilities !== 'undefined' && Utilities.sleep) {
      Utilities.sleep(ms);
    } else {
       // Fallback for environments outside GAS if needed, though this is primarily for GAS.
       const start = new Date().getTime();
       while (new Date().getTime() < start + ms) {
         // Busy wait
       }
    }
  }

  /**
   * Splits an array into smaller arrays of a specified chunk size.
   * @param {Array} array - The array to chunk.
   * @param {number} size - The maximum size of each chunk.
   * @returns {Array<Array>} An array of chunks.
   */
  static chunkArray(array, size) {
    Validation.assertArray(array, 'Array to chunk');
    Validation.assertNumber(size, 'Chunk size');
    if (size <= 0) {
      throw new ValidationError('Chunk size must be greater than zero.');
    }

    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  /**
   * Creates a deep copy of an object or array.
   * Note: This method uses JSON serialization and will not preserve functions, Dates, or specific object instances.
   * @param {*} obj - The object to clone.
   * @returns {*} A deep copy of the object.
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      throw new BaseError('Failed to deep clone object.', { originalError: e.message });
    }
  }
}

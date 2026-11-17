/**
 * Defensive programming module providing assertion utilities.
 * Throws ValidationError for any failed assertions.
 */
class Validation {
  /**
   * Asserts that a value is not null and not undefined.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertNotNull(value, name = 'Value') {
    if (value === null || value === undefined) {
      throw new ValidationError(`${name} cannot be null or undefined.`);
    }
  }

  /**
   * Asserts that a value is a non-empty string.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertString(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'string') {
      throw new ValidationError(`${name} must be a string. Received: ${typeof value}`);
    }
    if (value.trim() === '') {
      throw new ValidationError(`${name} cannot be an empty string.`);
    }
  }

  /**
   * Asserts that a value is a finite number.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertNumber(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      throw new ValidationError(`${name} must be a finite number. Received: ${value}`);
    }
  }

  /**
   * Asserts that a value is an object and not an array or null.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertObject(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new ValidationError(`${name} must be an object. Received: ${typeof value}`);
    }
  }

  /**
   * Asserts that a value is an array.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertArray(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (!Array.isArray(value)) {
      throw new ValidationError(`${name} must be an array.`);
    }
  }

  /**
   * Asserts that a value is a function.
   * @param {*} value - The value to check.
   * @param {string} [name="Value"] - The name of the variable for error reporting.
   * @throws {ValidationError}
   */
  static assertFunction(value, name = 'Value') {
    Validation.assertNotNull(value, name);
    if (typeof value !== 'function') {
      throw new ValidationError(`${name} must be a function. Received: ${typeof value}`);
    }
  }
}

/**
 * AI Provider Abstraction
 *
 * Defines the contract for all AI interactions within the system.
 * This guarantees the system is not hard-coupled to any specific LLM provider.
 */

class AIProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generates a single text completion or structured output based on a prompt.
   * @param {string} prompt - The prompt to send to the LLM.
   * @param {Object} [options={}] - Provider-specific options (temperature, max_tokens, etc.).
   * @returns {string} The generated response text.
   */
  generate(prompt, options = {}) {
    throw new Error('Method "generate()" must be implemented by the subclass.');
  }

  /**
   * Engages in a multi-turn conversation.
   * @param {Array<Object>} messages - Array of message objects (e.g., {role: 'user', content: '...'}).
   * @param {Object} [options={}] - Options.
   * @returns {string} The assistant's response.
   */
  chat(messages, options = {}) {
    throw new Error('Method "chat()" must be implemented by the subclass.');
  }

  /**
   * Simpler completion method, potentially used for fast inline completions.
   * @param {string} text - Input text.
   * @returns {string} Completed text.
   */
  complete(text) {
    throw new Error('Method "complete()" must be implemented by the subclass.');
  }

  /**
   * Embeds text into vector representation if supported.
   * @param {string} text - Text to embed.
   * @returns {Array<number>} Vector embedding.
   */
  embed(text) {
     throw new Error('Method "embed()" must be implemented by the subclass.');
  }

  /**
   * Verifies the provider is reachable and credentials are valid.
   * @returns {boolean} True if healthy.
   */
  health() {
    throw new Error('Method "health()" must be implemented by the subclass.');
  }

  /**
   * Generates a matrix of enterprise search concepts.
   * Designed specifically for the Discovery Engine.
   * @param {Object} context - The context for generation (e.g., industry, role).
   * @returns {Array<Object>} Array of search concepts.
   */
  generateSearchMatrix(context = {}) {
    throw new Error('Method "generateSearchMatrix()" must be implemented by the subclass.');
  }

  /**
   * Generates raw boolean search queries based on concepts.
   * Designed specifically for the Discovery Engine.
   * @param {Array<string>} concepts - Concepts to turn into queries.
   * @param {Object} parameters - Parameters for boolean generation.
   * @returns {Array<string>} Array of boolean strings.
   */
  generateBooleanQueries(concepts, parameters = {}) {
    throw new Error('Method "generateBooleanQueries()" must be implemented by the subclass.');
  }
}

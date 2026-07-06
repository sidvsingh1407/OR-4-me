/**
 * Gemini Provider Implementation
 *
 * Implements the AIProvider contract for Google's Gemini models.
 * Uses the standard REST API via UrlFetchApp (HttpClient).
 */

class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.logger = AppLogger.getLogger('GeminiProvider');
    this.httpClient = new HttpClient();

    // Resolve configuration with fallbacks
    this.apiKey = config.API_KEY || getAppConfig().get('AI.API_KEY');
    this.baseUrl = config.BASE_URL || getAppConfig().get('AI.BASE_URL', 'https://generativelanguage.googleapis.com/v1beta');
    this.model = config.MODEL || getAppConfig().get('AI.MODEL', 'gemini-2.5-flash');
    this.temperature = config.TEMPERATURE !== undefined ? config.TEMPERATURE : getAppConfig().getNumber('AI.TEMPERATURE', 0.2);
    this.maxTokens = config.MAX_TOKENS || getAppConfig().getNumber('AI.MAX_TOKENS', 4096);
    this.timeoutMs = config.TIMEOUT_MS || getAppConfig().getNumber('AI.TIMEOUT_MS', 30000);

    if (!this.apiKey) {
      throw new ConfigurationError('Gemini API Key is missing.');
    }
  }

  /**
   * Helper to construct the full API URL for a given operation
   */
  _buildUrl(operation) {
    return `${this.baseUrl}/models/${this.model}:${operation}?key=${this.apiKey}`;
  }

  /**
   * Cleans backticks and markdown formatting from JSON output
   */
  _extractJson(text) {
    if (!text) return "";
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  generate(prompt, options = {}) {
    Validation.assertString(prompt, 'Prompt');

    const url = this._buildUrl('generateContent');
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature !== undefined ? options.temperature : this.temperature,
        maxOutputTokens: options.maxTokens !== undefined ? options.maxTokens : this.maxTokens
      }
    };

    if (options.responseMimeType) {
        payload.generationConfig.responseMimeType = options.responseMimeType;
    }

    try {
      const response = this.httpClient.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });

      if (!response.isSuccess) {
        throw new Error(`Gemini API Error: ${response.statusCode} - ${response.text}`);
      }
      const data = JSON.parse(response.text);
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      return '';
    } catch (e) {
      this.logger.error('GeminiProvider', 'Generate', 'Failed to generate content', e);
      throw e;
    }
  }

  chat(messages, options = {}) {
    Validation.assertArray(messages, 'Messages');

    const url = this._buildUrl('generateContent');

    // Map abstract role to Gemini role
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: options.temperature !== undefined ? options.temperature : this.temperature,
        maxOutputTokens: options.maxTokens !== undefined ? options.maxTokens : this.maxTokens
      }
    };

    try {
      const response = this.httpClient.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });

      if (!response.isSuccess) {
        throw new Error(`Gemini API Error: ${response.statusCode} - ${response.text}`);
      }
      const data = JSON.parse(response.text);
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      return '';
    } catch (e) {
      this.logger.error('GeminiProvider', 'Chat', 'Failed to chat', e);
      throw e;
    }
  }

  complete(text) {
    return this.generate(text);
  }

  embed(text) {
    // Basic embedding if needed later (uses text-embedding-004 generally)
    throw new Error('Method "embed()" not implemented in this version of GeminiProvider.');
  }

  health() {
    try {
      // Just request a tiny completion to check API key and reachability
      const url = this._buildUrl('generateContent');
      const payload = {
        contents: [{ parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 5 }
      };
      const response = this.httpClient.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(payload)
      });
      return response.statusCode === 200;
    } catch (e) {
      this.logger.warn('GeminiProvider', 'Health', 'Health check failed', e);
      return false;
    }
  }

  generateSearchMatrix(context = {}) {
    const prompt = `
      You are an expert Enterprise AI Search Specialist.
      Generate a matrix of high-value search concepts to discover companies struggling with AI implementation or showing strong buying intent for AI transformation.

      Context parameters:
      Industry: ${context.industry || 'Any'}
      Target Roles: ${context.roles ? context.roles.join(', ') : 'Any Executive'}
      Focus: ${context.focus || 'AI pain points and adoption'}

      Respond strictly in JSON format matching this structure:
      [
        {
          "concept": "Name of concept",
          "category": "Pain Point | Transformation | Hiring | Tooling",
          "keywords": ["keyword 1", "keyword 2"]
        }
      ]
    `;

    const rawResponse = this.generate(prompt, { responseMimeType: 'application/json' });
    const jsonString = this._extractJson(rawResponse);

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      this.logger.error('GeminiProvider', 'GenerateSearchMatrix', 'Failed to parse JSON', e);
      return [];
    }
  }

  generateBooleanQueries(concepts, parameters = {}) {
    const prompt = `
      You are an expert in Boolean search strings for enterprise sales prospecting and OSINT.
      Create complex, precise Boolean queries using the provided concepts.
      Include operators like AND, OR, site:, intitle:, intext: where appropriate.

      Concepts:
      ${concepts.join(', ')}

      Requirements:
      - Max ${parameters.count || 5} queries.
      - Return ONLY a JSON array of strings. No markdown, no explanation.

      Example output:
      ["(AI OR LLM) AND \\"failed project\\" site:linkedin.com/in", "intitle:\\"Director of AI\\" (compliance OR risk)"]
    `;

    const rawResponse = this.generate(prompt, { responseMimeType: 'application/json' });
    const jsonString = this._extractJson(rawResponse);

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      this.logger.error('GeminiProvider', 'GenerateBooleanQueries', 'Failed to parse JSON', e);
      return [];
    }
  }
}

// Global factory for standard DI pattern
function getAIProvider() {
  if (!getAIProvider.instance) {
    const providerName = getAppConfig().get('AI.PROVIDER', 'gemini').toLowerCase();

    if (providerName === 'gemini') {
      getAIProvider.instance = new GeminiProvider();
    } else {
      throw new ConfigurationError(`Unknown AI Provider specified: ${providerName}`);
    }
  }
  return getAIProvider.instance;
}

/**
 * HTTP Client Engine.
 * Wraps Google Apps Script UrlFetchApp to provide built-in retries, validation, and standard error handling.
 */
class HttpClient {
  /**
   * Initializes the HttpClient.
   * @param {Object} [config={}] - Optional configuration for the client.
   */
  constructor(config = {}) {
    this.logger = AppLogger.getLogger('HttpClient');
  }

  /**
   * Internal wrapper for UrlFetchApp.
   * @param {string} url - The URL to fetch.
   * @param {Object} params - The UrlFetchApp parameters.
   * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse} The response.
   * @throws {NetworkError}
   */
  _fetchNative(url, params) {
    if (typeof UrlFetchApp === 'undefined') {
       throw new NetworkError('UrlFetchApp is undefined in this environment.');
    }

    try {
      return UrlFetchApp.fetch(url, params);
    } catch (e) {
      throw new NetworkError(`Failed to fetch URL: ${url}`, { originalError: e.message, isNative: true });
    }
  }

  /**
   * Executes an HTTP request with built-in retries.
   * @param {string} url - The URL to request.
   * @param {Object} [options={}] - Request options (headers, method, payload, etc.).
   * @returns {Object} The parsed response object containing status, headers, and text/json.
   * @throws {NetworkError} If the request fails after all retries.
   */
  request(url, options = {}) {
    Validation.assertString(url, 'Request URL');

    // Construct default UrlFetchApp params
    const params = {
      method: options.method ? options.method.toLowerCase() : 'get',
      headers: options.headers || {},
      muteHttpExceptions: true, // We handle status codes manually
      followRedirects: options.followRedirects !== false
    };

    if (options.payload) {
      // If payload is an object and content-type isn't form-encoded, stringify it
      if (typeof options.payload === 'object' && !params.headers['Content-Type']) {
         params.payload = JSON.stringify(options.payload);
         params.headers['Content-Type'] = 'application/json';
      } else {
         params.payload = options.payload;
      }
    }

    if (options.contentType) {
      params.contentType = options.contentType;
    }

    this.logger.debug(`Starting HTTP ${params.method.toUpperCase()} request to ${url}`);

    const operation = () => {
      const response = this._fetchNative(url, params);
      const statusCode = response.getResponseCode();
      const headers = response.getHeaders();

      // Treat 429 (Too Many Requests), 408 (Timeout) and 5xx as retryable
      if (statusCode === 429 || statusCode === 408 || statusCode >= 500) {
         let retryAfterMs = null;
         if (statusCode === 429) {
            // Check Retry-After header
            let retryAfterStr = headers['Retry-After'] || headers['retry-after'];
            if (retryAfterStr) {
               const parsed = parseInt(retryAfterStr, 10);
               if (!isNaN(parsed)) {
                  retryAfterMs = parsed * 1000; // usually in seconds
               } else {
                  // Might be an HTTP date, but let's fallback to default backoff
               }
            }
         }
         throw new NetworkError(`HTTP Error ${statusCode}`, { statusCode, url, retryAfterMs });
      }

      // Return unified response structure
      let data = response.getContentText();
      let parsedJson = null;

      try {
        parsedJson = JSON.parse(data);
      } catch (e) {
        // Not JSON, ignore
      }

      return {
        statusCode: statusCode,
        headers: headers,
        text: data,
        json: parsedJson,
        isSuccess: statusCode >= 200 && statusCode < 300
      };
    };

    const isRetryable = (error) => {
      if (error instanceof NetworkError && error.details) {
         if (error.details.isNative) return true;
         if (error.details.statusCode) {
             const code = error.details.statusCode;
             return code === 429 || code === 408 || code >= 500;
         }
      }
      return false; // For HTTP errors < 500 except 429 and 408, do not retry
    };

    return RetryEngine.execute(operation, {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      operationName: `HTTP ${params.method.toUpperCase()} ${url}`,
      shouldRetryPredicate: isRetryable
    });
  }

  /**
   * Helper method for GET requests.
   * @param {string} url - The URL to fetch.
   * @param {Object} [headers={}] - Optional headers.
   * @returns {Object} The response object.
   */
  get(url, headers = {}) {
    return this.request(url, { method: 'get', headers });
  }

  /**
   * Helper method for POST requests.
   * @param {string} url - The URL to fetch.
   * @param {*} payload - The request payload.
   * @param {Object} [headers={}] - Optional headers.
   * @returns {Object} The response object.
   */
  post(url, payload, headers = {}) {
    return this.request(url, { method: 'post', payload, headers });
  }
}

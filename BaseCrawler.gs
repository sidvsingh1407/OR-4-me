/**
 * Base Crawler Plugin
 *
 * Provides standard boilerplate and lifecycle methods for all crawlers.
 * Plugins extend this to implement source-specific fetching and parsing.
 */

class BaseCrawler {
  constructor(name) {
    this.name = name;
    this.logger = AppLogger.getLogger(this.name);
    this.config = getAppConfig();
    this.httpClient = new HttpClient();
    this.checkpointEngine = getCheckpointEngine();
    this.queueManager = getQueueManager();
    this.state = {};
  }

  /**
   * Initializes the crawler.
   * Loads the saved checkpoint to resume processing.
   */
  initialize() {
    this.logger.info(this.name, 'Initialize', `Initializing ${this.name}`);
    const savedState = this.resume();
    this.state = savedState || this._getDefaultState();
  }

  /**
   * Defines the default state for a fresh execution.
   * Should be overridden by subclasses if they need more properties.
   */
  _getDefaultState() {
    return {
      currentUrl: null,
      cursor: null,
      page: 1,
      processed: 0,
      timestamp: Date.now()
    };
  }

  /**
   * The core fetching logic. Must be implemented by the subclass.
   * Should return raw items.
   */
  crawl() {
    throw new Error(`${this.name} must implement crawl()`);
  }

  /**
   * Normalizes raw items into the standard schema.
   * Must be implemented by subclass.
   * @param {Object} rawItem
   * @returns {Object} Normalized item.
   */
  normalize(rawItem) {
    throw new Error(`${this.name} must implement normalize()`);
  }

  /**
   * Base normalization wrapper ensuring common structure.
   */
  _createNormalizedRecord(data) {
    return {
      id: data.id || Utils.generateId(),
      source: data.source || this.name,
      sourceType: data.sourceType || 'Unknown',
      company: data.company || null,
      organization: data.organization || null,
      title: data.title || null,
      description: data.description || null,
      content: data.content || null,
      url: data.url || null,
      author: data.author || null,
      publishedAt: data.publishedAt || new Date().toISOString(),
      collectedAt: new Date().toISOString(),
      language: data.language || 'en',
      country: data.country || null,
      technologyTags: data.technologyTags || [],
      rawJson: data.rawJson ? JSON.stringify(data.rawJson) : null,
      crawlerName: this.name,
      confidence: data.confidence || 0.8
    };
  }

  /**
   * Validates a normalized record.
   * Drops duplicates, short content, broken URLs, etc.
   */
  validate(normalizedItem) {
    if (!normalizedItem) return false;
    if (!normalizedItem.url || !normalizedItem.title) return false;

    // Very short content rejection
    const textToCheck = normalizedItem.content || normalizedItem.description || '';
    if (textToCheck.length < 20) return false;

    // Validations like duplicate URLs are managed by the ValidationEngine down the line.

    return true;
  }

  /**
   * Persists the current cursor/state via the Checkpoint Engine.
   */
  checkpoint() {
    this.checkpointEngine.saveCheckpoint({
      currentModule: 'CrawlerEngine',
      currentTask: this.name,
      apiState: this.state
    });
    this.logger.debug(this.name, 'Checkpoint', `Saved checkpoint for ${this.name}`, this.state);
  }

  /**
   * Loads the previous state to resume execution.
   */
  resume() {
    const cp = this.checkpointEngine.loadCheckpoint();
    if (cp && cp.currentTask === this.name && cp.apiState) {
       this.logger.info(this.name, 'Resume', `Resuming ${this.name} from checkpoint`);
       return cp.apiState;
    }
    return null;
  }

  /**
   * Cleans up after the crawler is fully complete (e.g., reached the end of all feeds).
   */
  cleanup() {
    this.state = this._getDefaultState();
    this.checkpoint();
    this.logger.info(this.name, 'Cleanup', `${this.name} completed and cleaned up.`);
  }

  /**
   * Executes an HTTP request using shared client and configuration headers.
   */
  fetch(url, options = {}) {
    // Inject default Crawler headers
    const headers = options.headers || {};
    if (!headers['User-Agent']) {
      headers['User-Agent'] = this.config.get('CRAWLER.USER_AGENT', 'TarkaX/1.0');
    }
    options.headers = headers;

    // Automatic retry and backoff is handled by HttpClient / RetryEngine
    return this.httpClient.request(url, options);
  }
}

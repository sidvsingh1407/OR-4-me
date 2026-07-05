/**
 * Data Validation Engine for Crawler Payload
 * Assures only valid, non-duplicate, meaningful data reaches enrichment.
 */
class CrawlerValidationEngine {
  constructor() {
    this.logger = AppLogger.getLogger('CrawlerValidationEngine');
    this.db = getDatabase();
    this.cache = CacheService.getScriptCache();
  }

  /**
   * Validates a normalized record against standard rules.
   * @param {Object} item Normalized Crawler output
   * @returns {Object} Validation result { isValid: boolean, reason: string|null }
   */
  validate(item) {
    if (!item || typeof item !== 'object') {
       return { isValid: false, reason: 'Malformed object' };
    }

    if (!item.url || item.url.trim() === '') {
       return { isValid: false, reason: 'Empty or missing URL' };
    }

    if (!item.title || item.title.trim() === '') {
       return { isValid: false, reason: 'Empty title' };
    }

    const textContent = `${item.title || ''} ${item.description || ''} ${item.content || ''}`;
    if (textContent.trim().length < 50) {
       return { isValid: false, reason: 'Very short content' };
    }

    // Check language config if available (Naive check)
    // Complex check uses NLP/AI in Enrichment phase. We just allow pass through here if not trivially spam.

    if (this._isDuplicate(item.url, item.title)) {
       return { isValid: false, reason: 'Duplicate URL or Title' };
    }

    return { isValid: true, reason: null };
  }

  /**
   * Checks if URL was recently crawled.
   * Leverages CacheService for fast lookups.
   */
  _isDuplicate(url, title) {
    const urlHash = Utils.generateHash(url);

    // 1. Check cache
    const cacheHit = this.cache.get(`crawl_url_${urlHash}`);
    if (cacheHit) return true;

    // 2. Check Database directly (if not in cache)
    // To minimize API calls in loop, we rely mostly on DB indices or batch checking if implemented.
    // For now we check the Sources/Leads table if needed, though DiscoveryHistory is active.
    // Assumption: we append to a Staging Table or rely purely on fast cache.
    // Let's implement a dummy query against standard DB table "Sources" (as per Phase 5 prompt spec)
    try {
      const records = this.db.findMany('Sources', { url: url });
      if (records && records.length > 0) {
         // Add to cache for next time
         this.cache.put(`crawl_url_${urlHash}`, '1', 21600); // 6 hours
         return true;
      }
    } catch (e) {
      // Table might not exist yet or no rows
    }

    // Mark as seen for immediate next iterations
    this.cache.put(`crawl_url_${urlHash}`, '1', 21600);
    return false;
  }
}

function getCrawlerValidationEngine() {
  if (!getCrawlerValidationEngine.instance) {
    getCrawlerValidationEngine.instance = new CrawlerValidationEngine();
  }
  return getCrawlerValidationEngine.instance;
}

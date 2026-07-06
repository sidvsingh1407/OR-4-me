/**
 * Entity Resolution Engine
 *
 * Dedicated engine responsible for:
 * - Alias normalization
 * - Canonicalization
 * - Duplicate detection
 * - Similarity scoring
 * - Confidence scoring
 * - Merge recommendations
 */

class EntityResolver {
  constructor() {
    this.db = getDatabase();
    this.cache = CacheService.getScriptCache();
    this.ALIAS_CACHE_KEY = 'GRAPH_ALIASES_CACHE';
    this.CACHE_TTL = 3600; // 1 hour

    // Minimal common suffixes to strip for canonicalization
    this.commonSuffixes = [' inc', ' inc.', ' corp', ' corp.', ' llc', ' ltd', ' ltd.', ' corporation', ' company'];
  }

  /**
   * Initializes or refreshes the alias cache from the GraphAliases sheet.
   */
  refreshAliasCache() {
    try {
      const records = this.db.findMany('GraphAliases');
      const aliasMap = {};

      for (const record of records) {
        if (record.alias && record.canonicalName) {
          const key = record.alias.toLowerCase().trim();
          aliasMap[key] = {
            canonicalName: record.canonicalName,
            nodeType: record.nodeType,
            confidence: record.confidence
          };
        }
      }

      const payload = JSON.stringify(aliasMap);
      if (payload.length < 90000) {
        this.cache.put(this.ALIAS_CACHE_KEY, payload, this.CACHE_TTL);
      } else {
        getExecutionLogger().warn('EntityResolver', 'refreshAliasCache', 'Alias map too large for single cache key.');
      }
      return aliasMap;
    } catch (e) {
      getExecutionLogger().error('EntityResolver', 'refreshAliasCache', 'Failed to refresh alias cache.', e);
      return {};
    }
  }

  _getAliasMap() {
    const cached = this.cache.get(this.ALIAS_CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return this.refreshAliasCache();
  }

  resolveEntity(rawName, expectedNodeType) {
    if (!rawName) return null;

    const normalizedRaw = rawName.toLowerCase().trim();
    const aliasMap = this._getAliasMap();

    // 1. Check exact alias match
    if (aliasMap[normalizedRaw]) {
      const match = aliasMap[normalizedRaw];
      if (!expectedNodeType || match.nodeType === expectedNodeType) {
        return {
          canonicalName: match.canonicalName,
          confidence: match.confidence || 1.0,
          isAliasMatch: true
        };
      }
    }

    // 2. Fallback to heuristic string canonicalization
    let heuristicName = normalizedRaw;
    if (expectedNodeType === 'Companies') {
      for (const suffix of this.commonSuffixes) {
        if (heuristicName.endsWith(suffix)) {
          heuristicName = heuristicName.substring(0, heuristicName.length - suffix.length).trim();
        }
      }
    }

    const titleCased = this._titleCase(heuristicName);
    return {
      canonicalName: titleCased,
      confidence: 0.7,
      isAliasMatch: false
    };
  }

  computeSimilarity(str1, str2) {
    if (!str1 || !str2) return 0.0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;

    const tokenize = (s) => new Set(s.split(/\s+/));
    const set1 = tokenize(s1);
    const set2 = tokenize(s2);

    let intersection = 0;
    for (const token of set1) {
      if (set2.has(token)) intersection++;
    }

    const union = set1.size + set2.size - intersection;
    if (union === 0) return 0.0;
    return intersection / union;
  }

  _titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  /**
   * Complex deduplication checking.
   * Compares names, domains, websites, and semantic similarity.
   */
  findDuplicates(nodeType, candidateProps) {
    const indexMgr = getGraphIndexManager();
    const results = new Set();

    // 1. Check Exact Name Match or Domain/LinkedIn matches via index
    if (candidateProps.canonicalName) {
       indexMgr.lookup(nodeType, 'canonicalName', candidateProps.canonicalName).forEach(id => results.add(id));
       const dbHits = this.db.findMany(nodeType, { canonicalName: candidateProps.canonicalName });
       dbHits.forEach(r => results.add(r.uuid));
    }

    if (candidateProps.domain) {
       indexMgr.lookup(nodeType, 'domain', candidateProps.domain).forEach(id => results.add(id));
       const dbHits = this.db.findMany(nodeType, { domain: candidateProps.domain });
       dbHits.forEach(r => results.add(r.uuid));
    }

    if (candidateProps.linkedInUrl) {
       indexMgr.lookup(nodeType, 'linkedInUrl', candidateProps.linkedInUrl).forEach(id => results.add(id));
       const dbHits = this.db.findMany(nodeType, { linkedInUrl: candidateProps.linkedInUrl });
       dbHits.forEach(r => results.add(r.uuid));
    }

    if (candidateProps.website) {
       indexMgr.lookup(nodeType, 'website', candidateProps.website).forEach(id => results.add(id));
       const dbHits = this.db.findMany(nodeType, { website: candidateProps.website });
       dbHits.forEach(r => results.add(r.uuid));
    }

    // 2. Semantic Similarity Fallback (if no strict matches and node is small dataset like PainPoints)
    if (results.size === 0 && candidateProps.canonicalName) {
        // Read all nodes for fuzzy match. Only do this for smaller tables to prevent O(N) issues
        if (nodeType !== 'Companies') {
           const allNodes = this.db.findMany(nodeType);
           for (const node of allNodes) {
               const sim = this.computeSimilarity(node.canonicalName, candidateProps.canonicalName);
               if (sim > 0.85) {
                   results.add(node.uuid);
               }
           }
        }
    }

    return Array.from(results);
  }
}

function getEntityResolver() {
  if (!getEntityResolver.instance) {
    getEntityResolver.instance = new EntityResolver();
  }
  return getEntityResolver.instance;
}

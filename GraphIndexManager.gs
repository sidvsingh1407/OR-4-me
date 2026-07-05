/**
 * Graph Index Manager
 *
 * Maintains secondary indexes for O(1) graph lookups and inbound/outbound relationship indexes.
 * Uses CacheService for fast reads. Handles chunking if the index grows beyond Cache limits.
 * Falls back to dedicated DB Sheets if Cache misses.
 */

class GraphIndexManager {
  constructor() {
    this.cache = CacheService.getScriptCache();
    this.props = PropertiesService.getScriptProperties();
    this.db = getDatabase();

    // Hard limits in GAS
    this.MAX_CACHE_SIZE = 90000;
  }

  _getIndexKey(nodeType, field) {
    return `G_IDX_${nodeType}_${field}`;
  }

  _getRelIndexKey(nodeId, direction) {
    return `G_REL_${nodeId}_${direction}`;
  }

  // ==========================================================================
  // NODE INDEXING
  // ==========================================================================

  lookup(nodeType, field, value) {
    if (!value) return [];

    const indexData = this._loadIndex(nodeType, field);
    const searchKey = String(value).toLowerCase().trim();

    return indexData[searchKey] || [];
  }

  updateIndex(nodeType, field, value, uuid) {
    if (!value || !uuid) return;

    const indexData = this._loadIndex(nodeType, field);
    const searchKey = String(value).toLowerCase().trim();

    if (!indexData[searchKey]) {
      indexData[searchKey] = [];
    }

    if (!indexData[searchKey].includes(uuid)) {
      indexData[searchKey].push(uuid);
      this._saveIndex(nodeType, field, indexData);
    }
  }

  removeFromIndex(nodeType, field, value, uuid) {
    if (!value || !uuid) return;

    const indexData = this._loadIndex(nodeType, field);
    const searchKey = String(value).toLowerCase().trim();

    if (indexData[searchKey]) {
      const idx = indexData[searchKey].indexOf(uuid);
      if (idx !== -1) {
        indexData[searchKey].splice(idx, 1);
        if (indexData[searchKey].length === 0) {
          delete indexData[searchKey];
        }
        this._saveIndex(nodeType, field, indexData);
      }
    }
  }

  rebuildIndex(nodeType, field) {
    getExecutionLogger().info('GraphIndexManager', 'rebuildIndex', `Rebuilding index for ${nodeType}.${field}`);
    try {
      const records = this.db.read(nodeType);
      const indexData = {};

      for (const record of records) {
        const val = record[field];
        const uuid = record.uuid;

        if (val && uuid) {
          const searchKey = String(val).toLowerCase().trim();
          if (!indexData[searchKey]) {
            indexData[searchKey] = [];
          }
          if (!indexData[searchKey].includes(uuid)) {
            indexData[searchKey].push(uuid);
          }
        }
      }

      this._saveIndex(nodeType, field, indexData);
      getExecutionLogger().info('GraphIndexManager', 'rebuildIndex', `Index rebuilt with ${Object.keys(indexData).length} unique keys.`);
    } catch (e) {
      getExecutionLogger().error('GraphIndexManager', 'rebuildIndex', `Failed to rebuild index for ${nodeType}.${field}`, e);
    }
  }

  // ==========================================================================
  // RELATIONSHIP INDEXING
  // ==========================================================================

  getRelationships(nodeId, direction) {
     const key = this._getRelIndexKey(nodeId, direction);
     const cached = this.cache.get(key);
     if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
     }

     const query = direction === 'IN' ? { targetNodeId: nodeId } : { sourceNodeId: nodeId };
     const edges = this.db.read('Relationships', query);
     this._safeCachePut(key, JSON.stringify(edges));
     return edges;
  }

  updateRelationshipIndex(sourceNodeId, targetNodeId, edgeRecord) {
     const outKey = this._getRelIndexKey(sourceNodeId, 'OUT');
     const cachedOut = this.cache.get(outKey);
     if (cachedOut) {
         try {
            const outEdges = JSON.parse(cachedOut);
            outEdges.push(edgeRecord);
            this._safeCachePut(outKey, JSON.stringify(outEdges));
         } catch(e) {}
     }

     const inKey = this._getRelIndexKey(targetNodeId, 'IN');
     const cachedIn = this.cache.get(inKey);
     if (cachedIn) {
         try {
            const inEdges = JSON.parse(cachedIn);
            inEdges.push(edgeRecord);
            this._safeCachePut(inKey, JSON.stringify(inEdges));
         } catch(e) {}
     }
  }

  removeRelationshipFromIndex(sourceNodeId, targetNodeId, relationshipId) {
     const outKey = this._getRelIndexKey(sourceNodeId, 'OUT');
     const cachedOut = this.cache.get(outKey);
     if (cachedOut) {
         try {
            let outEdges = JSON.parse(cachedOut);
            outEdges = outEdges.filter(e => e.relationshipId !== relationshipId);
            this._safeCachePut(outKey, JSON.stringify(outEdges));
         } catch(e) {}
     }

     const inKey = this._getRelIndexKey(targetNodeId, 'IN');
     const cachedIn = this.cache.get(inKey);
     if (cachedIn) {
         try {
            let inEdges = JSON.parse(cachedIn);
            inEdges = inEdges.filter(e => e.relationshipId !== relationshipId);
            this._safeCachePut(inKey, JSON.stringify(inEdges));
         } catch(e) {}
     }
  }

  // ==========================================================================
  // INTERNAL CACHE STORAGE
  // ==========================================================================

  _loadIndex(nodeType, field) {
    const key = this._getIndexKey(nodeType, field);
    let fullPayload = "";

    let chunk0 = this.cache.get(`${key}_0`);
    if (!chunk0) chunk0 = this.props.getProperty(`${key}_0`);

    if (chunk0) {
      try {
        const meta = JSON.parse(chunk0);
        fullPayload += meta.data;
        for (let i = 1; i < meta.totalChunks; i++) {
           let chunk = this.cache.get(`${key}_${i}`);
           if (!chunk) chunk = this.props.getProperty(`${key}_${i}`);
           if (chunk) fullPayload += chunk;
        }
        return JSON.parse(fullPayload);
      } catch (e) {}
    }

    return {};
  }

  _saveIndex(nodeType, field, indexData) {
    const key = this._getIndexKey(nodeType, field);
    const payload = JSON.stringify(indexData);

    const chunks = [];
    const MAX_CHUNK = 8000;
    for (let i = 0; i < payload.length; i += MAX_CHUNK) {
       chunks.push(payload.substring(i, i + MAX_CHUNK));
    }

    for (let i = 0; i < chunks.length; i++) {
       const chunkKey = `${key}_${i}`;
       const chunkVal = i === 0
           ? JSON.stringify({ totalChunks: chunks.length, data: chunks[i] })
           : chunks[i];

       try { this.props.setProperty(chunkKey, chunkVal); } catch(e) {}
       this._safeCachePut(chunkKey, chunkVal);
    }
  }

  _safeCachePut(key, value) {
      if (value.length < this.MAX_CACHE_SIZE) {
          try {
             this.cache.put(key, value, 21600);
          } catch(e) {}
      }
  }
}

function getGraphIndexManager() {
  if (!getGraphIndexManager.instance) {
    getGraphIndexManager.instance = new GraphIndexManager();
  }
  return getGraphIndexManager.instance;
}

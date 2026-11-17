/**
 * Knowledge Graph Engine
 *
 * Core engine for Knowledge Graph (Phase 9).
 * Transforms independent lead records into an enterprise-wide relational graph.
 */

class KnowledgeGraphEngine {
  constructor() {
    this.db = getDatabase();
    this.resolver = getEntityResolver();
    this.indexManager = getGraphIndexManager();
  }

  // ==========================================================================
  // NODE OPERATIONS
  // ==========================================================================

  createNode(nodeType, rawName, properties = {}) {
    Validation.assertString(nodeType, 'Node Type');
    Validation.assertString(rawName, 'Raw Name');

    const resolution = this.resolver.resolveEntity(rawName, nodeType);
    const canonicalName = resolution ? resolution.canonicalName : rawName;

    // First consult EntityResolver's rigorous duplicate detection
    const existingIds = this.resolver.findDuplicates(nodeType, { canonicalName: canonicalName, ...properties });

    if (existingIds.length > 0) {
      this._emitEvent('NODE_MERGED', existingIds[0], { canonicalName, originalName: rawName });
      return existingIds[0];
    }

    const uuid = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    const record = {
      uuid: uuid,
      nodeType: nodeType,
      canonicalName: canonicalName,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: JSON.stringify(properties)
    };

    for (const [key, val] of Object.entries(properties)) {
      if (key !== 'metadata') record[key] = val;
    }

    this.db.withLock(() => {
      this.db.beginTransaction();
      this.db.create(nodeType, record);
      this.db.commitTransaction();
    });

    this.indexManager.updateIndex(nodeType, 'canonicalName', canonicalName, uuid);
    if (properties.domain) this.indexManager.updateIndex(nodeType, 'domain', properties.domain, uuid);
    if (properties.linkedInUrl) this.indexManager.updateIndex(nodeType, 'linkedInUrl', properties.linkedInUrl, uuid);
    if (properties.website) this.indexManager.updateIndex(nodeType, 'website', properties.website, uuid);

    this._emitEvent('NODE_CREATED', uuid, { nodeType, canonicalName });
    return uuid;
  }

  updateNode(nodeType, uuid, properties) {
    Validation.assertString(nodeType, 'Node Type');
    Validation.assertString(uuid, 'UUID');

    this.db.withLock(() => {
      this.db.beginTransaction();

      const records = this.db.read(nodeType, { uuid: uuid });
      if (records.length === 0) throw new Error(`KnowledgeGraphEngine: Node ${uuid} not found in ${nodeType}`);

      const existingRecord = records[0];
      const updatedMetadata = { ...JSON.parse(existingRecord.metadata || '{}'), ...properties };

      this.db.update(nodeType, existingRecord._id, {
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(updatedMetadata),
        ...properties
      });

      this.db.commitTransaction();
    });

    this._emitEvent('NODE_UPDATED', uuid, properties);
  }

  deleteNode(nodeType, uuid) {
    Validation.assertString(nodeType, 'Node Type');
    Validation.assertString(uuid, 'UUID');

    this.db.withLock(() => {
      this.db.beginTransaction();

      const records = this.db.read(nodeType, { uuid: uuid });
      if (records.length > 0) {
        this.db.delete(nodeType, records[0]._id);

        // Invalidate Node Indexes
        if (records[0].canonicalName) this.indexManager.removeFromIndex(nodeType, 'canonicalName', records[0].canonicalName, uuid);
        if (records[0].domain) this.indexManager.removeFromIndex(nodeType, 'domain', records[0].domain, uuid);
      }

      const edges = this.findRelationships(uuid);
      for (const edge of edges) {
        this.db.delete('Relationships', edge._id);
        // Invalidate Rel Index
        this.indexManager.removeRelationshipFromIndex(edge.sourceNodeId, edge.targetNodeId, edge.relationshipId);
      }

      this.db.commitTransaction();
    });

    this._emitEvent('NODE_DELETED', uuid, { nodeType });
  }

  findNode(nodeType, uuid) {
    const records = this.db.read(nodeType, { uuid: uuid });
    return records.length > 0 ? records[0] : null;
  }

  nodeExists(nodeType, uuid) {
    return this.findNode(nodeType, uuid) !== null;
  }

  // ==========================================================================
  // RELATIONSHIP OPERATIONS
  // ==========================================================================

  createRelationship(sourceNodeId, targetNodeId, relationshipType, metadata = {}) {
    Validation.assertString(sourceNodeId, 'Source Node ID');
    Validation.assertString(targetNodeId, 'Target Node ID');
    Validation.assertString(relationshipType, 'Relationship Type');

    const outEdges = this.indexManager.getRelationships(sourceNodeId, 'OUT');
    const existingEdges = outEdges.filter(e => e.targetNodeId === targetNodeId && e.relationshipType === relationshipType);

    if (existingEdges.length > 0) {
      const edge = existingEdges[0];
      this.db.withLock(() => {
         const dbEdges = this.db.read('Relationships', { relationshipId: edge.relationshipId });
         if (dbEdges.length > 0) {
            this.db.update('Relationships', dbEdges[0]._id, {
               updatedAt: new Date().toISOString(),
               confidence: Math.min((dbEdges[0].confidence || 1) + 0.1, 1.0),
               metadata: JSON.stringify({ ...JSON.parse(dbEdges[0].metadata || '{}'), ...metadata })
            });
         }
      });
      this._emitEvent('RELATIONSHIP_UPDATED', edge.relationshipId, { sourceNodeId, targetNodeId });
      return edge.relationshipId;
    }

    const relId = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    const record = {
      relationshipId: relId,
      sourceNodeId: sourceNodeId,
      targetNodeId: targetNodeId,
      relationshipType: relationshipType,
      confidence: metadata.confidence || 1.0,
      sourceSystem: metadata.sourceSystem || 'Unknown',
      evidence: metadata.evidence || '',
      metadata: JSON.stringify(metadata),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.db.withLock(() => {
      this.db.beginTransaction();
      this.db.create('Relationships', record);
      this.db.commitTransaction();
    });

    // Update indexes dynamically
    this.indexManager.updateRelationshipIndex(sourceNodeId, targetNodeId, record);

    this._emitEvent('RELATIONSHIP_CREATED', relId, { sourceNodeId, targetNodeId, relationshipType });
    return relId;
  }

  deleteRelationship(relationshipId) {
    Validation.assertString(relationshipId, 'Relationship ID');

    this.db.withLock(() => {
      this.db.beginTransaction();
      const records = this.db.read('Relationships', { relationshipId: relationshipId });
      if (records.length > 0) {
         this.db.delete('Relationships', records[0]._id);

         // Invalidate Rel Index
         this.indexManager.removeRelationshipFromIndex(records[0].sourceNodeId, records[0].targetNodeId, relationshipId);
      }
      this.db.commitTransaction();
    });
    this._emitEvent('RELATIONSHIP_DELETED', relationshipId);
  }

  relationshipExists(sourceNodeId, targetNodeId, relationshipType) {
    const outEdges = this.indexManager.getRelationships(sourceNodeId, 'OUT');
    return outEdges.some(e => e.targetNodeId === targetNodeId && e.relationshipType === relationshipType);
  }

  findRelationships(nodeId) {
    const inEdges = this.indexManager.getRelationships(nodeId, 'IN');
    const outEdges = this.indexManager.getRelationships(nodeId, 'OUT');
    return [...inEdges, ...outEdges];
  }

  // ==========================================================================
  // TRAVERSAL AND ALGORITHMS
  // ==========================================================================

  findNeighbors(nodeId, relationshipType = null, direction = 'BOTH') {
    let edges = [];
    if (direction === 'OUT' || direction === 'BOTH') {
        edges = edges.concat(this.indexManager.getRelationships(nodeId, 'OUT'));
    }
    if (direction === 'IN' || direction === 'BOTH') {
        edges = edges.concat(this.indexManager.getRelationships(nodeId, 'IN'));
    }

    if (relationshipType) {
        edges = edges.filter(e => e.relationshipType === relationshipType);
    }

    const neighbors = [];
    for (const edge of edges) {
      if (edge.sourceNodeId === nodeId) {
        neighbors.push({ edge, neighborId: edge.targetNodeId, dir: 'OUT' });
      } else if (edge.targetNodeId === nodeId) {
        neighbors.push({ edge, neighborId: edge.sourceNodeId, dir: 'IN' });
      }
    }
    return neighbors;
  }

  graphTraversal(startNodeId, maxDepth = 2) {
    const visited = new Set();
    const queue = [{ id: startNodeId, depth: 0 }];
    const subgraph = { nodes: [], edges: [] };

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id)) continue;

      visited.add(id);
      subgraph.nodes.push(id);

      if (depth < maxDepth) {
        const neighbors = this.findNeighbors(id);
        for (const n of neighbors) {
          subgraph.edges.push(n.edge);
          if (!visited.has(n.neighborId)) {
            queue.push({ id: n.neighborId, depth: depth + 1 });
          }
        }
      }
    }
    return subgraph;
  }

  exportSubgraph(startNodeId, maxDepth = 2) {
    const subgraph = this.graphTraversal(startNodeId, maxDepth);
    const nodeDetails = [];

    for (const nodeId of subgraph.nodes) {
       let nodeFound = false;
       for (const type of Object.keys(getGraphSchemaRegistry().nodeTypes)) {
          const node = this.findNode(type, nodeId);
          if (node) {
             nodeDetails.push(node);
             nodeFound = true;
             break;
          }
       }
       if (!nodeFound) {
          nodeDetails.push({ uuid: nodeId, unknown: true });
       }
    }
    return { nodes: nodeDetails, edges: subgraph.edges };
  }

  expandGraph(payload) {
    const companyId = this.createNode('Companies', payload.company, { domain: payload.domain, website: payload.website });

    if (payload.industry) {
      const industryId = this.createNode('Industries', payload.industry);
      this.createRelationship(companyId, industryId, 'COMPANY_OPERATES_IN');
    }

    if (payload.aiPainCategories) {
      const pains = payload.aiPainCategories.split(',').map(s => s.trim());
      pains.forEach(pain => {
         if(pain) {
            const painId = this.createNode('PainPoints', pain);
            this.createRelationship(companyId, painId, 'COMPANY_HAS_PAIN', { sourceSystem: payload.sourceType || 'Crawler' });
         }
      });
    }

    if (payload.technologiesMentioned) {
      const techs = payload.technologiesMentioned.split(',').map(s => s.trim());
      techs.forEach(tech => {
         if(tech) {
            const techId = this.createNode('Technologies', tech);
            this.createRelationship(companyId, techId, 'COMPANY_USES_TECH');
         }
      });
    }

    this._emitEvent('GRAPH_EXPANDED', companyId, { nodesAdded: true });
    return companyId;
  }

  mergeNodes(targetNodeId, sourceNodeId) {
     if (targetNodeId === sourceNodeId) return;

     this.db.withLock(() => {
        this.db.beginTransaction();

        const inEdges = this.indexManager.getRelationships(sourceNodeId, 'IN');
        const outEdges = this.indexManager.getRelationships(sourceNodeId, 'OUT');
        const edges = [...inEdges, ...outEdges];

        for (const edge of edges) {
           const dbEdges = this.db.read('Relationships', { relationshipId: edge.relationshipId });
           if (dbEdges.length > 0) {
              if (edge.sourceNodeId === sourceNodeId) {
                 this.db.update('Relationships', dbEdges[0]._id, { sourceNodeId: targetNodeId });
              } else {
                 this.db.update('Relationships', dbEdges[0]._id, { targetNodeId: targetNodeId });
              }
              // Invalidate rel index for updated relationships
              this.indexManager.removeRelationshipFromIndex(edge.sourceNodeId, edge.targetNodeId, edge.relationshipId);
           }
        }

        for (const type of Object.keys(getGraphSchemaRegistry().nodeTypes)) {
           const records = this.db.read(type, { uuid: sourceNodeId });
           if (records.length > 0) {
              this.db.delete(type, records[0]._id);
              if (records[0].canonicalName) this.indexManager.removeFromIndex(type, 'canonicalName', records[0].canonicalName, sourceNodeId);
              break;
           }
        }

        this.db.commitTransaction();
     });
     this._emitEvent('NODE_MERGED', targetNodeId, { mergedFrom: sourceNodeId });
  }

  // ==========================================================================
  // SPECIFIC BUSINESS QUERIES
  // ==========================================================================

  findCompaniesByPain(canonicalPainName) {
    const painIds = this._resolveNodeIdsSafe('PainPoints', 'canonicalName', canonicalPainName);
    if (painIds.length === 0) return [];

    const companies = new Set();
    for (const painId of painIds) {
      const neighbors = this.findNeighbors(painId, 'COMPANY_HAS_PAIN', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesByTechnology(canonicalTechName) {
    const techIds = this._resolveNodeIdsSafe('Technologies', 'canonicalName', canonicalTechName);
    if (techIds.length === 0) return [];

    const companies = new Set();
    for (const techId of techIds) {
      const neighbors = this.findNeighbors(techId, 'COMPANY_USES_TECH', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesByIndustry(canonicalIndustryName) {
    const indIds = this._resolveNodeIdsSafe('Industries', 'canonicalName', canonicalIndustryName);
    if (indIds.length === 0) return [];

    const companies = new Set();
    for (const indId of indIds) {
      const neighbors = this.findNeighbors(indId, 'COMPANY_OPERATES_IN', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesHiring(jobRole) {
    const indIds = this._resolveNodeIdsSafe('HiringSignals', 'canonicalName', jobRole);
    if (indIds.length === 0) return [];

    const companies = new Set();
    for (const indId of indIds) {
      const neighbors = this.findNeighbors(indId, 'COMPANY_HIRING_FOR', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  findCompaniesByFunding(fundingStage) {
    const indIds = this._resolveNodeIdsSafe('FundingSignals', 'canonicalName', fundingStage);
    if (indIds.length === 0) return [];

    const companies = new Set();
    for (const indId of indIds) {
      const neighbors = this.findNeighbors(indId, 'COMPANY_FUNDED_BY', 'IN');
      neighbors.forEach(n => companies.add(n.neighborId));
    }
    return Array.from(companies);
  }

  _resolveNodeIdsSafe(nodeType, field, value) {
     let existingIds = this.resolver.findDuplicates(nodeType, { [field]: value });
     return existingIds;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  _emitEvent(eventType, entityId, details = {}) {
    getExecutionLogger().info('KnowledgeGraphEngine', eventType, `Entity: ${entityId}`, details);
    try {
      this.db.create('GraphLogs', {
        logId: Utilities.getUuid(),
        eventType: eventType,
        entityId: entityId,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString()
      });
    } catch(e) {}
  }
}

function getKnowledgeGraphEngine() {
  if (!getKnowledgeGraphEngine.instance) {
    getKnowledgeGraphEngine.instance = new KnowledgeGraphEngine();
  }
  return getKnowledgeGraphEngine.instance;
}

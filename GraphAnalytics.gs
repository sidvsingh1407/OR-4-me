/**
 * Graph Analytics Engine
 *
 * Dedicated engine for generating metrics and insights from the Knowledge Graph.
 * Supports:
 * - Centrality and Connectivity
 * - Node/Relationship counts
 * - Pain and Industry Clustering
 * - Executive influence
 * - Company influence
 * - Growth velocity
 */

class GraphAnalytics {
  constructor() {
    this.db = getDatabase();
    this.graphEngine = getKnowledgeGraphEngine();
    this.indexManager = getGraphIndexManager();
  }

  generateGraphMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      nodeCounts: {},
      totalRelationships: 0,
      relationshipTypes: {}
    };

    try {
      const registry = getGraphSchemaRegistry();
      for (const nodeType of Object.keys(registry.nodeTypes)) {
        const records = this.db.findMany(nodeType);
        metrics.nodeCounts[nodeType] = records.length;
      }

      const relationships = this.db.findMany('Relationships');
      metrics.totalRelationships = relationships.length;

      for (const rel of relationships) {
        metrics.relationshipTypes[rel.relationshipType] = (metrics.relationshipTypes[rel.relationshipType] || 0) + 1;
      }

      return metrics;
    } catch (e) {
      getExecutionLogger().error('GraphAnalytics', 'generateGraphMetrics', 'Failed to generate metrics', e);
      return metrics;
    }
  }

  getMostConnectedCompanies(limit = 10) {
    const relationships = this.db.findMany('Relationships');
    const degreeMap = {};

    for (const rel of relationships) {
      if (rel.relationshipType.startsWith('COMPANY_')) {
        degreeMap[rel.sourceNodeId] = (degreeMap[rel.sourceNodeId] || 0) + 1;
      }
    }

    const sortedNodeIds = Object.entries(degreeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const results = [];
    for (const [nodeId, degree] of sortedNodeIds) {
      const node = this.graphEngine.findNode('Companies', nodeId);
      if (node) {
        results.push({
          companyName: node.canonicalName,
          uuid: node.uuid,
          degree: degree
        });
      }
    }

    return results;
  }

  getMostCommonPainPoints(limit = 10) {
    const relationships = this.db.findMany('Relationships', { relationshipType: 'COMPANY_HAS_PAIN' });
    const painMap = {};

    for (const rel of relationships) {
      painMap[rel.targetNodeId] = (painMap[rel.targetNodeId] || 0) + 1;
    }

    const sortedPains = Object.entries(painMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const results = [];
    for (const [nodeId, count] of sortedPains) {
      const node = this.graphEngine.findNode('PainPoints', nodeId);
      if (node) {
        results.push({
          painName: node.canonicalName,
          uuid: node.uuid,
          occurrences: count
        });
      }
    }

    return results;
  }

  detectTrends(days = 7) {
    const logs = this.db.findMany('GraphLogs', { eventType: 'RELATIONSHIP_CREATED' });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = logs.filter(log => new Date(log.timestamp) >= cutoffDate);

    const trendMap = {};
    for (const event of recentEvents) {
      let details = {};
      try { details = JSON.parse(event.details || '{}'); } catch(e) {}

      const relType = details.relationshipType || 'UNKNOWN';
      trendMap[relType] = (trendMap[relType] || 0) + 1;
    }

    return trendMap;
  }

  // --- Requested Features ---

  getIndustryClustering(limit = 10) {
     const relationships = this.db.findMany('Relationships', { relationshipType: 'COMPANY_OPERATES_IN' });
     const industryMap = {};
     for (const rel of relationships) {
        industryMap[rel.targetNodeId] = (industryMap[rel.targetNodeId] || 0) + 1;
     }

     const sortedInd = Object.entries(industryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

     return sortedInd.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Industries', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', count };
     });
  }

  getExecutiveInfluence(limit = 10) {
      const relationships = this.db.findMany('Relationships', { relationshipType: 'EXECUTIVE_WORKS_AT' });
      const execMap = {};
      for (const rel of relationships) {
          execMap[rel.sourceNodeId] = (execMap[rel.sourceNodeId] || 0) + 1;
      }

      const sortedExec = Object.entries(execMap)
         .sort((a, b) => b[1] - a[1])
         .slice(0, limit);

      return sortedExec.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Executives', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', companies: count };
      });
  }

  getCompanyInfluence(limit = 10) {
      const relationships = this.db.findMany('Relationships');
      const infMap = {};

      for (const rel of relationships) {
          if (rel.relationshipType === 'COMPANY_INTERESTED_IN' || rel.relationshipType === 'COMPANY_EVALUATING') {
              infMap[rel.targetNodeId] = (infMap[rel.targetNodeId] || 0) + 1;
          }
      }

      const sortedComp = Object.entries(infMap)
         .sort((a, b) => b[1] - a[1])
         .slice(0, limit);

      return sortedComp.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Companies', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', followers: count };
      });
  }

  getGrowthVelocity(days = 30) {
      const relationships = this.db.findMany('Relationships', { relationshipType: 'COMPANY_HIRING_FOR' });
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const velocityMap = {};
      for (const rel of relationships) {
          if (new Date(rel.createdAt) >= cutoffDate) {
              velocityMap[rel.sourceNodeId] = (velocityMap[rel.sourceNodeId] || 0) + 1;
          }
      }

      const sortedVel = Object.entries(velocityMap)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 10);

      return sortedVel.map(([nodeId, count]) => {
         const node = this.graphEngine.findNode('Companies', nodeId);
         return { name: node ? node.canonicalName : 'Unknown', hiringSignals: count };
      });
  }
}

function getGraphAnalytics() {
  if (!getGraphAnalytics.instance) {
    getGraphAnalytics.instance = new GraphAnalytics();
  }
  return getGraphAnalytics.instance;
}

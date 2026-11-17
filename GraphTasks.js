/**
 * Graph Tasks Registration
 *
 * Registers Knowledge Graph task handlers with the TaskDispatcher.
 * Enables the ExecutionEngine to asynchronously orchestrate graph updates.
 */

function registerGraphTasks() {
  const dispatcher = getTaskDispatcher();
  const graphEngine = getKnowledgeGraphEngine();
  const indexManager = getGraphIndexManager();
  const resolver = getEntityResolver();

  // Task: CREATE_GRAPH_NODE
  // Payload: { nodeType, rawName, properties }
  dispatcher.registerTask('CREATE_GRAPH_NODE', (payload) => {
    Validation.assertObject(payload, 'Graph Node Payload');
    const uuid = graphEngine.createNode(payload.nodeType, payload.rawName, payload.properties || {});
    return { status: 'COMPLETED', result: uuid };
  });

  // Task: UPDATE_GRAPH_NODE
  // Payload: { nodeType, uuid, properties }
  dispatcher.registerTask('UPDATE_GRAPH_NODE', (payload) => {
    Validation.assertObject(payload, 'Graph Node Update Payload');
    graphEngine.updateNode(payload.nodeType, payload.uuid, payload.properties || {});
    return { status: 'COMPLETED' };
  });

  // Task: CREATE_RELATIONSHIP
  // Payload: { sourceNodeId, targetNodeId, relationshipType, metadata }
  dispatcher.registerTask('CREATE_RELATIONSHIP', (payload) => {
    Validation.assertObject(payload, 'Graph Relationship Payload');
    const relId = graphEngine.createRelationship(
      payload.sourceNodeId,
      payload.targetNodeId,
      payload.relationshipType,
      payload.metadata || {}
    );
    return { status: 'COMPLETED', result: relId };
  });

  // Task: REBUILD_INDEX
  // Payload: { nodeType, field }
  dispatcher.registerTask('REBUILD_INDEX', (payload) => {
    Validation.assertObject(payload, 'Rebuild Index Payload');
    indexManager.rebuildIndex(payload.nodeType, payload.field);
    return { status: 'COMPLETED' };
  });

  // Task: REFRESH_ALIAS_CACHE
  // Payload: {}
  dispatcher.registerTask('REFRESH_ALIAS_CACHE', (payload) => {
    resolver.refreshAliasCache();
    return { status: 'COMPLETED' };
  });
}

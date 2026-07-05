/**
 * GraphSchema Registry
 *
 * Defines the Knowledge Graph taxonomy and dynamically registers it with the Database Engine.
 * Provides extensible configuration for Node Types, Relationship Types, and Indexes
 * without hardcoding them into the Database Engine.
 */

class GraphSchemaRegistry {
  constructor() {
    this.nodeTypes = {};
    this.relationshipTypes = {};
    this.indexes = [];

    this._initializeDefaults();
  }

  registerNodeType(nodeType, schemaDefinition = {}) {
    Validation.assertString(nodeType, 'Node Type');

    const baseSchema = {
      uuid: { type: 'string', required: true, unique: true },
      nodeType: { type: 'string', required: true },
      canonicalName: { type: 'string', required: true },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
      metadata: { type: 'string' }
    };

    this.nodeTypes[nodeType] = { ...baseSchema, ...schemaDefinition };
  }

  registerRelationshipType(relationshipType, schemaDefinition = {}) {
    Validation.assertString(relationshipType, 'Relationship Type');
    this.relationshipTypes[relationshipType] = schemaDefinition;
  }

  registerIndex(nodeType, field) {
    Validation.assertString(nodeType, 'Node Type for Index');
    Validation.assertString(field, 'Field for Index');
    this.indexes.push({ nodeType, field });
  }

  injectIntoDatabaseSchema() {
    if (typeof SCHEMA === 'undefined') {
      throw new Error('GraphSchemaRegistry: Global SCHEMA is not defined. Cannot inject graph schemas.');
    }

    for (const [nodeType, schemaDef] of Object.entries(this.nodeTypes)) {
      SCHEMA[nodeType] = schemaDef;
    }

    SCHEMA['Relationships'] = {
      relationshipId: { type: 'string', required: true, unique: true },
      sourceNodeId: { type: 'string', required: true },
      targetNodeId: { type: 'string', required: true },
      relationshipType: { type: 'string', required: true },
      confidence: { type: 'number', default: 1.0 },
      sourceSystem: { type: 'string' },
      evidence: { type: 'string' },
      metadata: { type: 'string' },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' }
    };

    SCHEMA['GraphAliases'] = {
      aliasId: { type: 'string', required: true, unique: true },
      alias: { type: 'string', required: true },
      canonicalName: { type: 'string', required: true },
      nodeType: { type: 'string', required: true },
      confidence: { type: 'number', default: 1.0 },
      lastUpdated: { type: 'string' }
    };

    SCHEMA['GraphLogs'] = {
      logId: { type: 'string', required: true, unique: true },
      eventType: { type: 'string', required: true },
      entityId: { type: 'string', required: true },
      details: { type: 'string' },
      timestamp: { type: 'string' }
    };
  }

  _initializeDefaults() {
    this.registerNodeType('Companies', { domain: { type: 'string' }, website: { type: 'string' } });
    this.registerNodeType('PainPoints', {});
    this.registerNodeType('Technologies', {});
    this.registerNodeType('Industries', {});
    this.registerNodeType('Executives', { linkedInUrl: { type: 'string' } });
    this.registerNodeType('Sources', {});
    this.registerNodeType('HiringSignals', {});
    this.registerNodeType('FundingSignals', {});
    this.registerNodeType('Products', {});
    this.registerNodeType('AIFrameworks', {});

    this.registerRelationshipType('COMPANY_HAS_PAIN');
    this.registerRelationshipType('COMPANY_USES_TECH');
    this.registerRelationshipType('COMPANY_HIRING_FOR');
    this.registerRelationshipType('COMPANY_FUNDED_BY');
    this.registerRelationshipType('COMPANY_LOCATED_IN');
    this.registerRelationshipType('COMPANY_OPERATES_IN');
    this.registerRelationshipType('EXECUTIVE_WORKS_AT');
    this.registerRelationshipType('PRODUCT_BUILT_ON');
    this.registerRelationshipType('TECH_RELATED_TO');
    this.registerRelationshipType('PAIN_IMPACTS');
    this.registerRelationshipType('PAIN_CAUSED_BY');
    this.registerRelationshipType('WORKFLOW_USES');
    this.registerRelationshipType('WORKFLOW_BLOCKED_BY');
    this.registerRelationshipType('SOURCE_MENTIONS');
    this.registerRelationshipType('COMPANY_USING_MODEL');
    this.registerRelationshipType('MODEL_HAS_LIMITATION');
    this.registerRelationshipType('AI_TOOL_CAUSES');
    this.registerRelationshipType('PAIN_RESOLVED_BY');
    this.registerRelationshipType('FRAMEWORK_SUPPORTS');
    this.registerRelationshipType('DEPARTMENT_USING');
    this.registerRelationshipType('COMPANY_INTERESTED_IN');
    this.registerRelationshipType('COMPANY_EVALUATING');

    this.registerIndex('Companies', 'canonicalName');
    this.registerIndex('Companies', 'domain');
    this.registerIndex('PainPoints', 'canonicalName');
    this.registerIndex('Technologies', 'canonicalName');
    this.registerIndex('GraphAliases', 'alias');
  }
}

function getGraphSchemaRegistry() {
  if (!getGraphSchemaRegistry.instance) {
    getGraphSchemaRegistry.instance = new GraphSchemaRegistry();
  }
  return getGraphSchemaRegistry.instance;
}

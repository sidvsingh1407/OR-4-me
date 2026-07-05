/**
 * AI Pain Ontology Engine
 *
 * Provides a highly structured, hierarchical ontology of enterprise AI adoption pain points.
 * Includes a semantic matching engine to identify these signals from unstructured text.
 */

class AIPainOntologyEngine {
  constructor() {
    this.ontology = [
    {
        "id": "PAIN-001",
        "canonicalName": "Lack of AI Vision",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Stalled Growth",
        "synonyms": [
            "no ai vision",
            "lack of ai strategy",
            "missing ai roadmap",
            "without ai plan",
            "don't have an ai strategy"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no ai vision",
            "lack of ai strategy",
            "missing ai roadmap",
            "without ai plan",
            "don't have an ai strategy"
        ],
        "negativeKeywords": [
            "have a vision",
            "vision is clear"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-002",
        "canonicalName": "Misaligned AI Goals",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Resources",
        "synonyms": [
            "goals don't align",
            "misaligned objectives",
            "not aligned with business",
            "ai projects disjointed"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "goals don't align",
            "misaligned objectives",
            "not aligned with business",
            "ai projects disjointed"
        ],
        "negativeKeywords": [
            "perfectly aligned"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-003",
        "canonicalName": "No AI Roadmap",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Delayed Adoption",
        "synonyms": [
            "no roadmap",
            "missing roadmap",
            "lack of roadmap",
            "don't have a roadmap",
            "roadmap is undefined"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no roadmap",
            "missing roadmap",
            "lack of roadmap",
            "don't have a roadmap",
            "roadmap is undefined"
        ],
        "negativeKeywords": [
            "roadmap in place",
            "clear roadmap"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-004",
        "canonicalName": "Unclear AI Value Proposition",
        "category": "AI Strategy",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Low Investment",
        "synonyms": [
            "unclear value",
            "struggle to see value",
            "roi is unclear",
            "what is the value of ai"
        ],
        "relatedTerms": [
            "ai strategy",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unclear value",
            "struggle to see value",
            "roi is unclear",
            "what is the value of ai"
        ],
        "negativeKeywords": [
            "value is obvious",
            "clear roi"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Strategy Solutions"
    },
    {
        "id": "PAIN-005",
        "canonicalName": "No AI Committee",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Fragmented Decision Making",
        "synonyms": [
            "no ai committee",
            "lack of steering committee",
            "no governance board"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no ai committee",
            "lack of steering committee",
            "no governance board"
        ],
        "negativeKeywords": [
            "committee established"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-006",
        "canonicalName": "Unclear AI Ownership",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Accountability Gap",
        "synonyms": [
            "who owns ai",
            "unclear ownership",
            "nobody owns ai",
            "lack of owner"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "who owns ai",
            "unclear ownership",
            "nobody owns ai",
            "lack of owner"
        ],
        "negativeKeywords": [
            "clear owner",
            "ownership established"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-007",
        "canonicalName": "Missing AI Policies",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Compliance Risk",
        "synonyms": [
            "no ai policy",
            "missing policies",
            "lack of guidelines",
            "no ai rules"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no ai policy",
            "missing policies",
            "lack of guidelines",
            "no ai rules"
        ],
        "negativeKeywords": [
            "policies in place",
            "strict policies"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-008",
        "canonicalName": "Inconsistent AI Guidelines",
        "category": "AI Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Confusion",
        "synonyms": [
            "inconsistent guidelines",
            "conflicting rules",
            "unclear guidelines",
            "vagueness in ai policy"
        ],
        "relatedTerms": [
            "ai governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inconsistent guidelines",
            "conflicting rules",
            "unclear guidelines",
            "vagueness in ai policy"
        ],
        "negativeKeywords": [
            "clear guidelines"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Governance Solutions"
    },
    {
        "id": "PAIN-009",
        "canonicalName": "Data Leakage to LLMs",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "Data Breach",
        "synonyms": [
            "data leakage",
            "leaking data",
            "sensitive data exposed",
            "pii in chatgpt",
            "sending pii to llm"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "data leakage",
            "leaking data",
            "sensitive data exposed",
            "pii in chatgpt",
            "sending pii to llm"
        ],
        "negativeKeywords": [
            "secured data",
            "no leakage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-010",
        "canonicalName": "Prompt Injection Vulnerability",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Security Breach",
        "synonyms": [
            "prompt injection",
            "jailbreak",
            "injection attack",
            "malicious prompt"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "prompt injection",
            "jailbreak",
            "injection attack",
            "malicious prompt"
        ],
        "negativeKeywords": [
            "protected against injection",
            "injection blocked"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-011",
        "canonicalName": "Unsecured AI Endpoints",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Unauthorized Access",
        "synonyms": [
            "unsecured endpoint",
            "open ai api",
            "exposed api keys",
            "no auth on model"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unsecured endpoint",
            "open ai api",
            "exposed api keys",
            "no auth on model"
        ],
        "negativeKeywords": [
            "secured endpoints",
            "auth in place"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-012",
        "canonicalName": "Model Poisoning Risk",
        "category": "AI Security",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Compromised AI",
        "synonyms": [
            "model poisoning",
            "data poisoning",
            "corrupted training data",
            "adversarial attack"
        ],
        "relatedTerms": [
            "ai security",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "model poisoning",
            "data poisoning",
            "corrupted training data",
            "adversarial attack"
        ],
        "negativeKeywords": [
            "poisoning defense"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Security Solutions"
    },
    {
        "id": "PAIN-013",
        "canonicalName": "GDPR Violations via AI",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "Fines",
        "synonyms": [
            "gdpr violation",
            "violating gdpr",
            "not gdpr compliant",
            "ai privacy issues",
            "breaching gdpr"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "gdpr violation",
            "violating gdpr",
            "not gdpr compliant",
            "ai privacy issues",
            "breaching gdpr"
        ],
        "negativeKeywords": [
            "gdpr compliant"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-014",
        "canonicalName": "Copyright Infringement Risk",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Legal Action",
        "synonyms": [
            "copyright infringement",
            "ip theft",
            "plagiarized content",
            "using copyrighted data"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "copyright infringement",
            "ip theft",
            "plagiarized content",
            "using copyrighted data"
        ],
        "negativeKeywords": [
            "ip cleared",
            "no copyright issues"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-015",
        "canonicalName": "Lack of AI Auditability",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Regulatory Failure",
        "synonyms": [
            "cannot audit ai",
            "black box",
            "no audit trail",
            "unexplainable ai"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "cannot audit ai",
            "black box",
            "no audit trail",
            "unexplainable ai"
        ],
        "negativeKeywords": [
            "fully auditable",
            "audit trail exists"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-016",
        "canonicalName": "Regulatory Non-compliance",
        "category": "AI Compliance",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Legal Fines",
        "synonyms": [
            "non-compliant",
            "regulatory issues",
            "failing compliance",
            "eu ai act violation"
        ],
        "relatedTerms": [
            "ai compliance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "non-compliant",
            "regulatory issues",
            "failing compliance",
            "eu ai act violation"
        ],
        "negativeKeywords": [
            "fully compliant"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Compliance Solutions"
    },
    {
        "id": "PAIN-017",
        "canonicalName": "Stalled AI PoCs",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Wasted Investment",
        "synonyms": [
            "stalled poc",
            "poc stuck",
            "proof of concept going nowhere",
            "pilot stuck"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stalled poc",
            "poc stuck",
            "proof of concept going nowhere",
            "pilot stuck"
        ],
        "negativeKeywords": [
            "poc successful",
            "pilot completed"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-018",
        "canonicalName": "Low AI Usage Rates",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor ROI",
        "synonyms": [
            "low usage",
            "nobody is using",
            "low adoption",
            "poor adoption metrics"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low usage",
            "nobody is using",
            "low adoption",
            "poor adoption metrics"
        ],
        "negativeKeywords": [
            "high usage",
            "wide adoption"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-019",
        "canonicalName": "Resistance to AI Tools",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Cultural Friction",
        "synonyms": [
            "pushback",
            "resistance to ai",
            "employees hate ai",
            "refusing to use"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "pushback",
            "resistance to ai",
            "employees hate ai",
            "refusing to use"
        ],
        "negativeKeywords": [
            "embracing ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-020",
        "canonicalName": "Failed AI Rollouts",
        "category": "AI Adoption",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Lost Credibility",
        "synonyms": [
            "failed rollout",
            "botched launch",
            "unsuccessful deployment",
            "disastrous rollout"
        ],
        "relatedTerms": [
            "ai adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "failed rollout",
            "botched launch",
            "unsuccessful deployment",
            "disastrous rollout"
        ],
        "negativeKeywords": [
            "successful rollout"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Adoption Solutions"
    },
    {
        "id": "PAIN-021",
        "canonicalName": "Fear of AI Job Loss",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Low Morale",
        "synonyms": [
            "fear of job loss",
            "ai taking jobs",
            "job security fears",
            "anxious about ai"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "fear of job loss",
            "ai taking jobs",
            "job security fears",
            "anxious about ai"
        ],
        "negativeKeywords": [
            "excited about ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-022",
        "canonicalName": "AI Skepticism",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Slow Adoption",
        "synonyms": [
            "ai skeptic",
            "don't trust ai",
            "skeptical of results",
            "ai is hype"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ai skeptic",
            "don't trust ai",
            "skeptical of results",
            "ai is hype"
        ],
        "negativeKeywords": [
            "believe in ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-023",
        "canonicalName": "Lack of AI Trust",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Manual Workarounds",
        "synonyms": [
            "don't trust the model",
            "lack of trust",
            "distrust ai",
            "no confidence in ai"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "don't trust the model",
            "lack of trust",
            "distrust ai",
            "no confidence in ai"
        ],
        "negativeKeywords": [
            "fully trust"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-024",
        "canonicalName": "Siloed AI Knowledge",
        "category": "AI Culture",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "siloed knowledge",
            "only one guy knows",
            "bottlenecked knowledge",
            "knowledge hoarding"
        ],
        "relatedTerms": [
            "ai culture",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed knowledge",
            "only one guy knows",
            "bottlenecked knowledge",
            "knowledge hoarding"
        ],
        "negativeKeywords": [
            "shared knowledge"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Culture Solutions"
    },
    {
        "id": "PAIN-025",
        "canonicalName": "Unsanctioned ChatGPT Usage",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Data Risk",
        "synonyms": [
            "unsanctioned chatgpt",
            "using chatgpt on personal",
            "shadow ai",
            "rogue chatgpt"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unsanctioned chatgpt",
            "using chatgpt on personal",
            "shadow ai",
            "rogue chatgpt"
        ],
        "negativeKeywords": [
            "banned shadow ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-026",
        "canonicalName": "Hidden AI SaaS Costs",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Overrun",
        "synonyms": [
            "hidden costs",
            "surprise bills",
            "shadow spend",
            "untracked saas"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hidden costs",
            "surprise bills",
            "shadow spend",
            "untracked saas"
        ],
        "negativeKeywords": [
            "costs optimized"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-027",
        "canonicalName": "Untracked AI Workloads",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Resource Waste",
        "synonyms": [
            "untracked workloads",
            "hidden compute",
            "rogue servers",
            "unknown models"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "untracked workloads",
            "hidden compute",
            "rogue servers",
            "unknown models"
        ],
        "negativeKeywords": [
            "fully tracked"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-028",
        "canonicalName": "Rogue AI Deployments",
        "category": "Shadow AI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Security Risk",
        "synonyms": [
            "rogue deployment",
            "unapproved models",
            "shadow deployments"
        ],
        "relatedTerms": [
            "shadow ai",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rogue deployment",
            "unapproved models",
            "shadow deployments"
        ],
        "negativeKeywords": [
            "approved only"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Shadow AI Solutions"
    },
    {
        "id": "PAIN-029",
        "canonicalName": "Broken AI Workflows",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Process Failure",
        "synonyms": [
            "broken workflow",
            "ai workflow failing",
            "automation stopped",
            "workflow breaks"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "broken workflow",
            "ai workflow failing",
            "automation stopped",
            "workflow breaks"
        ],
        "negativeKeywords": [
            "seamless workflow"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-030",
        "canonicalName": "Manual Handoffs",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "manual handoff",
            "human in the loop bottleneck",
            "swivel chair integration",
            "manual copy paste"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual handoff",
            "human in the loop bottleneck",
            "swivel chair integration",
            "manual copy paste"
        ],
        "negativeKeywords": [
            "fully automated"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-031",
        "canonicalName": "Brittle RPA Integration",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "High Maintenance",
        "synonyms": [
            "brittle rpa",
            "bot breaks",
            "fragile bots",
            "rpa failing"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "brittle rpa",
            "bot breaks",
            "fragile bots",
            "rpa failing"
        ],
        "negativeKeywords": [
            "robust automation"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-032",
        "canonicalName": "Inefficient Task Routing",
        "category": "Workflow Automation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Slow Processing",
        "synonyms": [
            "inefficient routing",
            "poor routing",
            "tasks sent to wrong person"
        ],
        "relatedTerms": [
            "workflow automation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inefficient routing",
            "poor routing",
            "tasks sent to wrong person"
        ],
        "negativeKeywords": [
            "smart routing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Workflow Automation Solutions"
    },
    {
        "id": "PAIN-033",
        "canonicalName": "Poor Prompt Quality",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Low Output Quality",
        "synonyms": [
            "poor prompt",
            "bad prompt",
            "garbage prompt",
            "ineffective prompt"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor prompt",
            "bad prompt",
            "garbage prompt",
            "ineffective prompt"
        ],
        "negativeKeywords": [
            "great prompt"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-034",
        "canonicalName": "Inconsistent Prompt Results",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Unreliable Output",
        "synonyms": [
            "inconsistent results",
            "flaky output",
            "random responses",
            "non-deterministic"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inconsistent results",
            "flaky output",
            "random responses",
            "non-deterministic"
        ],
        "negativeKeywords": [
            "consistent results"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-035",
        "canonicalName": "Lack of Prompt Standards",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Confusion",
        "synonyms": [
            "no prompt standards",
            "everyone prompts differently",
            "missing best practices"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no prompt standards",
            "everyone prompts differently",
            "missing best practices"
        ],
        "negativeKeywords": [
            "standardized prompts"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-036",
        "canonicalName": "High Prompt Iteration Time",
        "category": "Prompt Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lost Productivity",
        "synonyms": [
            "takes forever to prompt",
            "too much time prompting",
            "endless tweaking",
            "prompt hacking"
        ],
        "relatedTerms": [
            "prompt engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "takes forever to prompt",
            "too much time prompting",
            "endless tweaking",
            "prompt hacking"
        ],
        "negativeKeywords": [
            "quick prompting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Engineering Solutions"
    },
    {
        "id": "PAIN-037",
        "canonicalName": "Lost Prompts",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Lost IP",
        "synonyms": [
            "lost prompts",
            "where did the prompt go",
            "forgot the prompt",
            "cannot find prompt"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lost prompts",
            "where did the prompt go",
            "forgot the prompt",
            "cannot find prompt"
        ],
        "negativeKeywords": [
            "prompt library"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-038",
        "canonicalName": "No Prompt Versioning",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Regression",
        "synonyms": [
            "no versioning",
            "overwrote prompt",
            "lost previous prompt",
            "prompt regression"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no versioning",
            "overwrote prompt",
            "lost previous prompt",
            "prompt regression"
        ],
        "negativeKeywords": [
            "version controlled"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-039",
        "canonicalName": "Hardcoded Prompts",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Brittle Code",
        "synonyms": [
            "hardcoded prompt",
            "prompts in code",
            "difficult to update prompt",
            "baked in prompt"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hardcoded prompt",
            "prompts in code",
            "difficult to update prompt",
            "baked in prompt"
        ],
        "negativeKeywords": [
            "dynamic prompts"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-040",
        "canonicalName": "Unshared Prompt Libraries",
        "category": "Prompt Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Duplication",
        "synonyms": [
            "unshared prompts",
            "personal prompt library",
            "can't access prompts",
            "siloed prompts"
        ],
        "relatedTerms": [
            "prompt management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unshared prompts",
            "personal prompt library",
            "can't access prompts",
            "siloed prompts"
        ],
        "negativeKeywords": [
            "shared library"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Prompt Management Solutions"
    },
    {
        "id": "PAIN-041",
        "canonicalName": "Lack of MLOps",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Slow Deployment",
        "synonyms": [
            "no mlops",
            "missing mlops",
            "lack of model ops",
            "poor ops practices"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no mlops",
            "missing mlops",
            "lack of model ops",
            "poor ops practices"
        ],
        "negativeKeywords": [
            "mature mlops"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-042",
        "canonicalName": "Manual Model Deployment",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "High Risk",
        "synonyms": [
            "manual deployment",
            "deploying by hand",
            "no ci/cd for models",
            "painful deployments"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual deployment",
            "deploying by hand",
            "no ci/cd for models",
            "painful deployments"
        ],
        "negativeKeywords": [
            "automated deployment"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-043",
        "canonicalName": "No AI Pipeline Automation",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "no pipeline",
            "manual pipeline",
            "broken pipeline",
            "lack of automation"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no pipeline",
            "manual pipeline",
            "broken pipeline",
            "lack of automation"
        ],
        "negativeKeywords": [
            "automated pipeline"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-044",
        "canonicalName": "Operational Silos",
        "category": "AI Operations",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Friction",
        "synonyms": [
            "operational silos",
            "dev throws over wall",
            "data science vs engineering",
            "ops silos"
        ],
        "relatedTerms": [
            "ai operations",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "operational silos",
            "dev throws over wall",
            "data science vs engineering",
            "ops silos"
        ],
        "negativeKeywords": [
            "devops aligned"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Operations Solutions"
    },
    {
        "id": "PAIN-045",
        "canonicalName": "High Token Latency",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Poor UX",
        "synonyms": [
            "high latency",
            "slow response",
            "takes too long to generate",
            "laggy llm"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high latency",
            "slow response",
            "takes too long to generate",
            "laggy llm"
        ],
        "negativeKeywords": [
            "low latency",
            "fast response"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-046",
        "canonicalName": "GPU Scarcity",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Stalled Dev",
        "synonyms": [
            "gpu scarcity",
            "can't get gpus",
            "no h100s",
            "waiting for compute",
            "gpu shortage"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "gpu scarcity",
            "can't get gpus",
            "no h100s",
            "waiting for compute",
            "gpu shortage"
        ],
        "negativeKeywords": [
            "plenty of gpus"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-047",
        "canonicalName": "Inflexible LLM Hosting",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Vendor Lock-in",
        "synonyms": [
            "inflexible hosting",
            "stuck on one cloud",
            "can't move models",
            "hosting challenges"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inflexible hosting",
            "stuck on one cloud",
            "can't move models",
            "hosting challenges"
        ],
        "negativeKeywords": [
            "multi-cloud"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-048",
        "canonicalName": "Compute Cost Overruns",
        "category": "LLM Infrastructure",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "Budget Crisis",
        "synonyms": [
            "cost overrun",
            "insane cloud bill",
            "gpu costs out of control",
            "burning cash on compute"
        ],
        "relatedTerms": [
            "llm infrastructure",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "cost overrun",
            "insane cloud bill",
            "gpu costs out of control",
            "burning cash on compute"
        ],
        "negativeKeywords": [
            "costs controlled"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "LLM Infrastructure Solutions"
    },
    {
        "id": "PAIN-049",
        "canonicalName": "AI Hallucinations",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Lost Trust",
        "synonyms": [
            "hallucination",
            "making things up",
            "spitting out garbage",
            "fake facts",
            "model lies"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hallucination",
            "making things up",
            "spitting out garbage",
            "fake facts",
            "model lies"
        ],
        "negativeKeywords": [
            "grounded",
            "factually accurate"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-050",
        "canonicalName": "Low AI Accuracy",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Useless Output",
        "synonyms": [
            "low accuracy",
            "inaccurate",
            "wrong answers",
            "poor performance"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low accuracy",
            "inaccurate",
            "wrong answers",
            "poor performance"
        ],
        "negativeKeywords": [
            "high accuracy"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-051",
        "canonicalName": "Biased AI Outputs",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Brand Damage",
        "synonyms": [
            "biased output",
            "racist model",
            "sexist model",
            "unfair ai"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "biased output",
            "racist model",
            "sexist model",
            "unfair ai"
        ],
        "negativeKeywords": [
            "unbiased"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-052",
        "canonicalName": "Incoherent AI Responses",
        "category": "Model Quality",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Frustration",
        "synonyms": [
            "incoherent",
            "rambling",
            "doesn't make sense",
            "word salad"
        ],
        "relatedTerms": [
            "model quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "incoherent",
            "rambling",
            "doesn't make sense",
            "word salad"
        ],
        "negativeKeywords": [
            "coherent"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Quality Solutions"
    },
    {
        "id": "PAIN-053",
        "canonicalName": "Degrading AI Performance",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Lost Value",
        "synonyms": [
            "degrading performance",
            "model getting worse",
            "used to work better",
            "decaying"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "degrading performance",
            "model getting worse",
            "used to work better",
            "decaying"
        ],
        "negativeKeywords": [
            "stable performance"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-054",
        "canonicalName": "Concept Drift",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Irrelevance",
        "synonyms": [
            "concept drift",
            "world changed",
            "assumptions broken",
            "model drift"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "concept drift",
            "world changed",
            "assumptions broken",
            "model drift"
        ],
        "negativeKeywords": [
            "drift mitigated"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-055",
        "canonicalName": "Data Distribution Shifts",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Errors",
        "synonyms": [
            "distribution shift",
            "data changed",
            "input is different now"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "distribution shift",
            "data changed",
            "input is different now"
        ],
        "negativeKeywords": [
            "stable distribution"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-056",
        "canonicalName": "Stale AI Models",
        "category": "Model Drift",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Outdated Answers",
        "synonyms": [
            "stale model",
            "outdated model",
            "old weights",
            "needs retraining"
        ],
        "relatedTerms": [
            "model drift",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stale model",
            "outdated model",
            "old weights",
            "needs retraining"
        ],
        "negativeKeywords": [
            "fresh models"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Model Drift Solutions"
    },
    {
        "id": "PAIN-057",
        "canonicalName": "Garbage In Garbage Out",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Poor Models",
        "synonyms": [
            "gigo",
            "garbage in",
            "bad data",
            "poor data quality",
            "dirty data"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "gigo",
            "garbage in",
            "bad data",
            "poor data quality",
            "dirty data"
        ],
        "negativeKeywords": [
            "clean data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-058",
        "canonicalName": "Unstructured Data Mess",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Unusable Assets",
        "synonyms": [
            "unstructured mess",
            "data swamp",
            "can't parse data",
            "messy documents"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unstructured mess",
            "data swamp",
            "can't parse data",
            "messy documents"
        ],
        "negativeKeywords": [
            "structured data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-059",
        "canonicalName": "Missing Training Data",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Stalled Training",
        "synonyms": [
            "missing data",
            "not enough data",
            "lack of training data",
            "data scarcity"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "missing data",
            "not enough data",
            "lack of training data",
            "data scarcity"
        ],
        "negativeKeywords": [
            "abundant data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-060",
        "canonicalName": "Inaccurate RAG Context",
        "category": "Data Quality",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Hallucinations",
        "synonyms": [
            "inaccurate context",
            "wrong documents retrieved",
            "bad context",
            "irrelevant rag context"
        ],
        "relatedTerms": [
            "data quality",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inaccurate context",
            "wrong documents retrieved",
            "bad context",
            "irrelevant rag context"
        ],
        "negativeKeywords": [
            "perfect context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Quality Solutions"
    },
    {
        "id": "PAIN-061",
        "canonicalName": "Unclassified AI Data",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Security Risk",
        "synonyms": [
            "unclassified data",
            "don't know what data is",
            "unknown sensitivity",
            "unlabeled data"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unclassified data",
            "don't know what data is",
            "unknown sensitivity",
            "unlabeled data"
        ],
        "negativeKeywords": [
            "classified data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-062",
        "canonicalName": "Poor Data Access Controls",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Data Leakage",
        "synonyms": [
            "poor access controls",
            "anyone can access",
            "no rbac",
            "missing acls"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor access controls",
            "anyone can access",
            "no rbac",
            "missing acls"
        ],
        "negativeKeywords": [
            "strict access"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-063",
        "canonicalName": "Siloed AI Data Sources",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Incomplete Context",
        "synonyms": [
            "siloed data",
            "data in different systems",
            "fragmented data",
            "disconnected databases"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed data",
            "data in different systems",
            "fragmented data",
            "disconnected databases"
        ],
        "negativeKeywords": [
            "unified data"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-064",
        "canonicalName": "No Data Lineage",
        "category": "Data Governance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Compliance Failure",
        "synonyms": [
            "no data lineage",
            "where did this data come from",
            "unknown origin",
            "untraceable data"
        ],
        "relatedTerms": [
            "data governance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no data lineage",
            "where did this data come from",
            "unknown origin",
            "untraceable data"
        ],
        "negativeKeywords": [
            "clear lineage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Data Governance Solutions"
    },
    {
        "id": "PAIN-065",
        "canonicalName": "Lost Context in Chat",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Frustrating UX",
        "synonyms": [
            "lost context",
            "bot forgot",
            "short memory",
            "forgets previous messages"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lost context",
            "bot forgot",
            "short memory",
            "forgets previous messages"
        ],
        "negativeKeywords": [
            "retains context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-066",
        "canonicalName": "Token Limit Truncation",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Incomplete Analysis",
        "synonyms": [
            "token limit",
            "exceeded tokens",
            "truncated context",
            "cut off"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "token limit",
            "exceeded tokens",
            "truncated context",
            "cut off"
        ],
        "negativeKeywords": [
            "infinite context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-067",
        "canonicalName": "Poor Context Relevance",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Bad Answers",
        "synonyms": [
            "poor relevance",
            "irrelevant context",
            "fetching wrong info",
            "bad retrieved context"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor relevance",
            "irrelevant context",
            "fetching wrong info",
            "bad retrieved context"
        ],
        "negativeKeywords": [
            "highly relevant context"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-068",
        "canonicalName": "Ineffective Chunking",
        "category": "Context Engineering",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Missed Information",
        "synonyms": [
            "bad chunking",
            "split mid sentence",
            "ineffective chunking",
            "poor chunks"
        ],
        "relatedTerms": [
            "context engineering",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "bad chunking",
            "split mid sentence",
            "ineffective chunking",
            "poor chunks"
        ],
        "negativeKeywords": [
            "semantic chunking"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Context Engineering Solutions"
    },
    {
        "id": "PAIN-069",
        "canonicalName": "Slow Vector Search",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Latency",
        "synonyms": [
            "slow vector search",
            "pinecone is slow",
            "vector db lag",
            "ann search slow"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow vector search",
            "pinecone is slow",
            "vector db lag",
            "ann search slow"
        ],
        "negativeKeywords": [
            "fast vector search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-070",
        "canonicalName": "Irrelevant Search Results",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Useless RAG",
        "synonyms": [
            "irrelevant results",
            "bad search",
            "poor recall",
            "low precision"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "irrelevant results",
            "bad search",
            "poor recall",
            "low precision"
        ],
        "negativeKeywords": [
            "highly relevant results"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-071",
        "canonicalName": "Poor Embeddings",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Semantic Mismatch",
        "synonyms": [
            "poor embeddings",
            "bad embeddings",
            "weak representation",
            "embeddings don't capture meaning"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor embeddings",
            "bad embeddings",
            "weak representation",
            "embeddings don't capture meaning"
        ],
        "negativeKeywords": [
            "strong embeddings"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-072",
        "canonicalName": "Missing Vector DB Indexes",
        "category": "Retrieval",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Performance Hit",
        "synonyms": [
            "missing index",
            "no vector index",
            "full scan",
            "unindexed db"
        ],
        "relatedTerms": [
            "retrieval",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "missing index",
            "no vector index",
            "full scan",
            "unindexed db"
        ],
        "negativeKeywords": [
            "indexed db"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Retrieval Solutions"
    },
    {
        "id": "PAIN-073",
        "canonicalName": "RAG Hallucinations",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Lost Trust",
        "synonyms": [
            "rag hallucination",
            "making up facts from context",
            "hallucinating with context"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rag hallucination",
            "making up facts from context",
            "hallucinating with context"
        ],
        "negativeKeywords": [
            "grounded rag"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-074",
        "canonicalName": "Complex RAG Pipelines",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Maintenance Nightmare",
        "synonyms": [
            "complex rag",
            "convoluted pipeline",
            "too many rag steps",
            "overengineered rag"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "complex rag",
            "convoluted pipeline",
            "too many rag steps",
            "overengineered rag"
        ],
        "negativeKeywords": [
            "simple rag"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-075",
        "canonicalName": "Inaccurate RAG Grounding",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Errors",
        "synonyms": [
            "poor grounding",
            "not grounded in facts",
            "ungrounded responses",
            "fails grounding test"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor grounding",
            "not grounded in facts",
            "ungrounded responses",
            "fails grounding test"
        ],
        "negativeKeywords": [
            "solid grounding"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-076",
        "canonicalName": "RAG Pipeline Latency",
        "category": "RAG",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Slow UX",
        "synonyms": [
            "rag latency",
            "slow rag",
            "pipeline takes too long",
            "slow retrieval"
        ],
        "relatedTerms": [
            "rag",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rag latency",
            "slow rag",
            "pipeline takes too long",
            "slow retrieval"
        ],
        "negativeKeywords": [
            "fast rag"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "RAG Solutions"
    },
    {
        "id": "PAIN-077",
        "canonicalName": "Runaway AI Agents",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 1.0,
        "businessImpact": "System Damage",
        "synonyms": [
            "runaway agent",
            "agent out of control",
            "infinite loop agent",
            "uncontrollable agent"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "runaway agent",
            "agent out of control",
            "infinite loop agent",
            "uncontrollable agent"
        ],
        "negativeKeywords": [
            "controlled agent"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-078",
        "canonicalName": "Agent Infinite Loops",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Compute Waste",
        "synonyms": [
            "infinite loop",
            "stuck in loop",
            "agent looping",
            "repetitive agent actions"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "infinite loop",
            "stuck in loop",
            "agent looping",
            "repetitive agent actions"
        ],
        "negativeKeywords": [
            "loop prevention"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-079",
        "canonicalName": "Poor Agent Tool Use",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Task Failure",
        "synonyms": [
            "poor tool use",
            "hallucinating tools",
            "wrong api call",
            "failed to use tool"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor tool use",
            "hallucinating tools",
            "wrong api call",
            "failed to use tool"
        ],
        "negativeKeywords": [
            "perfect tool use"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-080",
        "canonicalName": "Lack of Agent Oversight",
        "category": "AI Agents",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Compliance Risk",
        "synonyms": [
            "no oversight",
            "unsupervised agent",
            "agent running wild",
            "no human in loop"
        ],
        "relatedTerms": [
            "ai agents",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no oversight",
            "unsupervised agent",
            "agent running wild",
            "no human in loop"
        ],
        "negativeKeywords": [
            "supervised agent"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Agents Solutions"
    },
    {
        "id": "PAIN-081",
        "canonicalName": "Unpredictable Token Costs",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Volatility",
        "synonyms": [
            "unpredictable cost",
            "volatile bill",
            "token cost spikes",
            "don't know how much it will cost"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unpredictable cost",
            "volatile bill",
            "token cost spikes",
            "don't know how much it will cost"
        ],
        "negativeKeywords": [
            "predictable costs"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-082",
        "canonicalName": "High API Bills",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Budget Crisis",
        "synonyms": [
            "high api bill",
            "openai bill is huge",
            "expensive api",
            "too much spent on anthropic"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high api bill",
            "openai bill is huge",
            "expensive api",
            "too much spent on anthropic"
        ],
        "negativeKeywords": [
            "low api bills"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-083",
        "canonicalName": "Inefficient Model Usage",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Money",
        "synonyms": [
            "inefficient usage",
            "using gpt4 for everything",
            "overpowered model",
            "wasteful prompts"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inefficient usage",
            "using gpt4 for everything",
            "overpowered model",
            "wasteful prompts"
        ],
        "negativeKeywords": [
            "efficient usage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-084",
        "canonicalName": "Wasted GPU Idle Time",
        "category": "AI Cost",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Sunk Cost",
        "synonyms": [
            "idle gpus",
            "wasted compute",
            "gpus doing nothing",
            "low utilization"
        ],
        "relatedTerms": [
            "ai cost",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "idle gpus",
            "wasted compute",
            "gpus doing nothing",
            "low utilization"
        ],
        "negativeKeywords": [
            "high utilization"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Cost Solutions"
    },
    {
        "id": "PAIN-085",
        "canonicalName": "Unproven AI Value",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Cuts",
        "synonyms": [
            "unproven value",
            "where is the roi",
            "ai is just hype",
            "no real value"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unproven value",
            "where is the roi",
            "ai is just hype",
            "no real value"
        ],
        "negativeKeywords": [
            "proven value"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-086",
        "canonicalName": "High AI TCO",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Unsustainable",
        "synonyms": [
            "high tco",
            "total cost of ownership too high",
            "too expensive to maintain",
            "ai costs too much"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high tco",
            "total cost of ownership too high",
            "too expensive to maintain",
            "ai costs too much"
        ],
        "negativeKeywords": [
            "low tco"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-087",
        "canonicalName": "Unmeasurable AI Impact",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Lost Funding",
        "synonyms": [
            "unmeasurable impact",
            "can't measure roi",
            "hard to quantify",
            "intangible benefits"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unmeasurable impact",
            "can't measure roi",
            "hard to quantify",
            "intangible benefits"
        ],
        "negativeKeywords": [
            "measurable impact"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-088",
        "canonicalName": "Failed Business Case",
        "category": "AI ROI",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Project Cancellation",
        "synonyms": [
            "failed business case",
            "roi is negative",
            "doesn't make financial sense",
            "business case rejected"
        ],
        "relatedTerms": [
            "ai roi",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "failed business case",
            "roi is negative",
            "doesn't make financial sense",
            "business case rejected"
        ],
        "negativeKeywords": [
            "strong business case"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI ROI Solutions"
    },
    {
        "id": "PAIN-089",
        "canonicalName": "AI Slowing Users Down",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Lost Time",
        "synonyms": [
            "slowing users down",
            "takes longer with ai",
            "ai makes it harder",
            "distracting ai"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slowing users down",
            "takes longer with ai",
            "ai makes it harder",
            "distracting ai"
        ],
        "negativeKeywords": [
            "speeding users up"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-090",
        "canonicalName": "Context Switching",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "context switching",
            "jumping between tools",
            "too many tabs",
            "switching apps"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "context switching",
            "jumping between tools",
            "too many tabs",
            "switching apps"
        ],
        "negativeKeywords": [
            "integrated workflow"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-091",
        "canonicalName": "Steep AI Learning Curve",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Low Adoption",
        "synonyms": [
            "steep learning curve",
            "hard to learn",
            "too complex to use",
            "difficult to master"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "steep learning curve",
            "hard to learn",
            "too complex to use",
            "difficult to master"
        ],
        "negativeKeywords": [
            "easy to learn"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-092",
        "canonicalName": "Unproductive AI Tinkering",
        "category": "Productivity",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Wasted Time",
        "synonyms": [
            "playing with ai",
            "wasting time prompting",
            "tinkering not working",
            "endless tweaking"
        ],
        "relatedTerms": [
            "productivity",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "playing with ai",
            "wasting time prompting",
            "tinkering not working",
            "endless tweaking"
        ],
        "negativeKeywords": [
            "productive usage"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Productivity Solutions"
    },
    {
        "id": "PAIN-093",
        "canonicalName": "Lack of AI Training",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Low Skill",
        "synonyms": [
            "lack of training",
            "no training provided",
            "employees don't know how to use",
            "untrained staff"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lack of training",
            "no training provided",
            "employees don't know how to use",
            "untrained staff"
        ],
        "negativeKeywords": [
            "comprehensive training"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-094",
        "canonicalName": "Low Tool Utilization",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Licenses",
        "synonyms": [
            "low utilization",
            "nobody logs in",
            "unused licenses",
            "shelfware"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low utilization",
            "nobody logs in",
            "unused licenses",
            "shelfware"
        ],
        "negativeKeywords": [
            "high utilization"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-095",
        "canonicalName": "Employee AI Frustration",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor Morale",
        "synonyms": [
            "employee frustration",
            "hates using ai",
            "annoyed by ai",
            "ai is frustrating"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "employee frustration",
            "hates using ai",
            "annoyed by ai",
            "ai is frustrating"
        ],
        "negativeKeywords": [
            "delighted employees"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-096",
        "canonicalName": "Ignored AI Features",
        "category": "Employee Adoption",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lost Value",
        "synonyms": [
            "ignored features",
            "no one uses the ai button",
            "blindness to ai",
            "overlooked features"
        ],
        "relatedTerms": [
            "employee adoption",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ignored features",
            "no one uses the ai button",
            "blindness to ai",
            "overlooked features"
        ],
        "negativeKeywords": [
            "highly used features"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Employee Adoption Solutions"
    },
    {
        "id": "PAIN-097",
        "canonicalName": "Poor AI Communication",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Confusion",
        "synonyms": [
            "poor communication",
            "unclear rollout plan",
            "bad messaging",
            "lack of comms"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor communication",
            "unclear rollout plan",
            "bad messaging",
            "lack of comms"
        ],
        "negativeKeywords": [
            "clear communication"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-098",
        "canonicalName": "Lack of Executive Sponsorship",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Stalled Initiatives",
        "synonyms": [
            "no exec sponsor",
            "lack of leadership support",
            "no champion",
            "c-suite doesn't care"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no exec sponsor",
            "lack of leadership support",
            "no champion",
            "c-suite doesn't care"
        ],
        "negativeKeywords": [
            "strong exec sponsorship"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-099",
        "canonicalName": "Ignored Process Changes",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "ignored process",
            "still doing it old way",
            "refusing to change",
            "stubborn habits"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ignored process",
            "still doing it old way",
            "refusing to change",
            "stubborn habits"
        ],
        "negativeKeywords": [
            "adopted new process"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-100",
        "canonicalName": "Resistance from Middle Management",
        "category": "Change Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Blockers",
        "synonyms": [
            "middle management resistance",
            "managers blocking",
            "frozen middle",
            "managers afraid"
        ],
        "relatedTerms": [
            "change management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "middle management resistance",
            "managers blocking",
            "frozen middle",
            "managers afraid"
        ],
        "negativeKeywords": [
            "manager support"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Change Management Solutions"
    },
    {
        "id": "PAIN-101",
        "canonicalName": "Slow AI Vendor Vetting",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Delayed Adoption",
        "synonyms": [
            "slow vetting",
            "procurement takes forever",
            "compliance bottleneck",
            "stuck in legal"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow vetting",
            "procurement takes forever",
            "compliance bottleneck",
            "stuck in legal"
        ],
        "negativeKeywords": [
            "fast vetting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-102",
        "canonicalName": "Unclear AI Vendor Terms",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Legal Risk",
        "synonyms": [
            "unclear terms",
            "bad terms of service",
            "data usage rights unclear",
            "vendor t&cs"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unclear terms",
            "bad terms of service",
            "data usage rights unclear",
            "vendor t&cs"
        ],
        "negativeKeywords": [
            "clear terms"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-103",
        "canonicalName": "Duplicative AI Licenses",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Wasted Spend",
        "synonyms": [
            "duplicate licenses",
            "paying twice",
            "overlapping tools",
            "too many ai tools"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "duplicate licenses",
            "paying twice",
            "overlapping tools",
            "too many ai tools"
        ],
        "negativeKeywords": [
            "consolidated licenses"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-104",
        "canonicalName": "Vendor Lock-in",
        "category": "AI Procurement",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Inflexibility",
        "synonyms": [
            "vendor lock-in",
            "stuck with openai",
            "can't switch models",
            "locked in"
        ],
        "relatedTerms": [
            "ai procurement",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "vendor lock-in",
            "stuck with openai",
            "can't switch models",
            "locked in"
        ],
        "negativeKeywords": [
            "vendor agnostic"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Procurement Solutions"
    },
    {
        "id": "PAIN-105",
        "canonicalName": "Unresponsive AI Support",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Downtime",
        "synonyms": [
            "unresponsive support",
            "bad vendor support",
            "openai won't reply",
            "no sla"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unresponsive support",
            "bad vendor support",
            "openai won't reply",
            "no sla"
        ],
        "negativeKeywords": [
            "great support"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-106",
        "canonicalName": "SaaS Price Hikes",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Budget Overrun",
        "synonyms": [
            "price hike",
            "vendor raised prices",
            "api got more expensive",
            "subscription increased"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "price hike",
            "vendor raised prices",
            "api got more expensive",
            "subscription increased"
        ],
        "negativeKeywords": [
            "stable pricing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-107",
        "canonicalName": "Hidden Vendor Fees",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Unexpected Cost",
        "synonyms": [
            "hidden fees",
            "surprise charges",
            "overage fees",
            "hidden limits"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "hidden fees",
            "surprise charges",
            "overage fees",
            "hidden limits"
        ],
        "negativeKeywords": [
            "transparent pricing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-108",
        "canonicalName": "Poor Vendor SLAs",
        "category": "AI Vendor Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Reliability Issues",
        "synonyms": [
            "poor sla",
            "missed sla",
            "vendor downtime",
            "unreliable vendor"
        ],
        "relatedTerms": [
            "ai vendor management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor sla",
            "missed sla",
            "vendor downtime",
            "unreliable vendor"
        ],
        "negativeKeywords": [
            "strict slas"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Vendor Management Solutions"
    },
    {
        "id": "PAIN-109",
        "canonicalName": "Broken Semantic Search",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Information Hiding",
        "synonyms": [
            "broken semantic search",
            "semantic search fails",
            "vector search sucks",
            "meaning search broken"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "broken semantic search",
            "semantic search fails",
            "vector search sucks",
            "meaning search broken"
        ],
        "negativeKeywords": [
            "working semantic search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-110",
        "canonicalName": "Keyword Search Limitations",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Poor Results",
        "synonyms": [
            "keyword search limitations",
            "exact match only",
            "synonyms fail",
            "lexical search failing"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "keyword search limitations",
            "exact match only",
            "synonyms fail",
            "lexical search failing"
        ],
        "negativeKeywords": [
            "hybrid search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-111",
        "canonicalName": "Siloed Search Indexes",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Fragmented Knowledge",
        "synonyms": [
            "siloed search",
            "can't search across apps",
            "fragmented search",
            "disconnected search"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed search",
            "can't search across apps",
            "fragmented search",
            "disconnected search"
        ],
        "negativeKeywords": [
            "unified search"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-112",
        "canonicalName": "Low Search Click-through",
        "category": "Enterprise Search",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Poor UX",
        "synonyms": [
            "low ctr",
            "no one clicks results",
            "search abandoned",
            "users give up searching"
        ],
        "relatedTerms": [
            "enterprise search",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "low ctr",
            "no one clicks results",
            "search abandoned",
            "users give up searching"
        ],
        "negativeKeywords": [
            "high ctr"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Enterprise Search Solutions"
    },
    {
        "id": "PAIN-113",
        "canonicalName": "Stale Knowledge Bases",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Bad AI Answers",
        "synonyms": [
            "stale knowledge",
            "outdated wiki",
            "old confluence pages",
            "documentation is wrong"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stale knowledge",
            "outdated wiki",
            "old confluence pages",
            "documentation is wrong"
        ],
        "negativeKeywords": [
            "fresh knowledge"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-114",
        "canonicalName": "Undiscoverable Documents",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Lost Productivity",
        "synonyms": [
            "undiscoverable docs",
            "can't find documents",
            "buried files",
            "lost sharepoint"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "undiscoverable docs",
            "can't find documents",
            "buried files",
            "lost sharepoint"
        ],
        "negativeKeywords": [
            "discoverable docs"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-115",
        "canonicalName": "Fragmented Knowledge",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inconsistency",
        "synonyms": [
            "fragmented knowledge",
            "scattered information",
            "knowledge everywhere",
            "no single source of truth"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "fragmented knowledge",
            "scattered information",
            "knowledge everywhere",
            "no single source of truth"
        ],
        "negativeKeywords": [
            "centralized knowledge"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-116",
        "canonicalName": "Manual Knowledge Updates",
        "category": "Knowledge Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Maintenance Overhead",
        "synonyms": [
            "manual updates",
            "updating wiki by hand",
            "laborious documentation",
            "painful to document"
        ],
        "relatedTerms": [
            "knowledge management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual updates",
            "updating wiki by hand",
            "laborious documentation",
            "painful to document"
        ],
        "negativeKeywords": [
            "automated updates"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Knowledge Management Solutions"
    },
    {
        "id": "PAIN-117",
        "canonicalName": "No AI Upskilling",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Skill Gap",
        "synonyms": [
            "no upskilling",
            "lack of upskilling",
            "not teaching ai",
            "falling behind in skills"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no upskilling",
            "lack of upskilling",
            "not teaching ai",
            "falling behind in skills"
        ],
        "negativeKeywords": [
            "continuous upskilling"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-118",
        "canonicalName": "Outdated Training Materials",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Ineffectiveness",
        "synonyms": [
            "outdated training",
            "old tutorials",
            "training is stale",
            "learning old models"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "outdated training",
            "old tutorials",
            "training is stale",
            "learning old models"
        ],
        "negativeKeywords": [
            "up to date training"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-119",
        "canonicalName": "Lack of Hands-on Practice",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Low Confidence",
        "synonyms": [
            "no hands on",
            "all theory",
            "no sandbox",
            "can't practice ai"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no hands on",
            "all theory",
            "no sandbox",
            "can't practice ai"
        ],
        "negativeKeywords": [
            "sandbox environment"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-120",
        "canonicalName": "No AI Best Practices",
        "category": "AI Training",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Errors",
        "synonyms": [
            "no best practices",
            "no standards",
            "winging it",
            "lack of guardrails"
        ],
        "relatedTerms": [
            "ai training",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no best practices",
            "no standards",
            "winging it",
            "lack of guardrails"
        ],
        "negativeKeywords": [
            "established best practices"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Training Solutions"
    },
    {
        "id": "PAIN-121",
        "canonicalName": "Blind AI Deployments",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Unknown Risks",
        "synonyms": [
            "blind deployment",
            "no visibility",
            "don't know what ai is doing",
            "black box ops"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "blind deployment",
            "no visibility",
            "don't know what ai is doing",
            "black box ops"
        ],
        "negativeKeywords": [
            "full observability"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-122",
        "canonicalName": "No Token Tracking",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Uncontrolled Spend",
        "synonyms": [
            "no token tracking",
            "can't track usage",
            "untracked tokens",
            "who is using tokens"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no token tracking",
            "can't track usage",
            "untracked tokens",
            "who is using tokens"
        ],
        "negativeKeywords": [
            "detailed token tracking"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-123",
        "canonicalName": "Missing Error Alerts",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Silent Failures",
        "synonyms": [
            "missing alerts",
            "no alerts",
            "silent failure",
            "didn't know it was down"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "missing alerts",
            "no alerts",
            "silent failure",
            "didn't know it was down"
        ],
        "negativeKeywords": [
            "robust alerting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-124",
        "canonicalName": "Unmonitored AI Chatbots",
        "category": "AI Monitoring",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Brand Risk",
        "synonyms": [
            "unmonitored chatbot",
            "rogue bot",
            "bot saying crazy things",
            "no oversight on bot"
        ],
        "relatedTerms": [
            "ai monitoring",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unmonitored chatbot",
            "rogue bot",
            "bot saying crazy things",
            "no oversight on bot"
        ],
        "negativeKeywords": [
            "monitored bots"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Monitoring Solutions"
    },
    {
        "id": "PAIN-125",
        "canonicalName": "API Downtime",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Service Outage",
        "synonyms": [
            "api downtime",
            "openai is down",
            "anthropic outage",
            "llm api broken"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "api downtime",
            "openai is down",
            "anthropic outage",
            "llm api broken"
        ],
        "negativeKeywords": [
            "high availability"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-126",
        "canonicalName": "Inconsistent LLM Latency",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor UX",
        "synonyms": [
            "inconsistent latency",
            "sometimes fast sometimes slow",
            "latency spikes",
            "unpredictable speed"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inconsistent latency",
            "sometimes fast sometimes slow",
            "latency spikes",
            "unpredictable speed"
        ],
        "negativeKeywords": [
            "consistent low latency"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-127",
        "canonicalName": "Model Rate Limits",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Throttling",
        "synonyms": [
            "rate limit",
            "hit rate limit",
            "throttled",
            "too many requests 429"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "rate limit",
            "hit rate limit",
            "throttled",
            "too many requests 429"
        ],
        "negativeKeywords": [
            "rate limits managed"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-128",
        "canonicalName": "Fragile AI Pipelines",
        "category": "AI Reliability",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Brittle Systems",
        "synonyms": [
            "fragile pipeline",
            "pipeline breaks often",
            "brittle architecture",
            "failing jobs"
        ],
        "relatedTerms": [
            "ai reliability",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "fragile pipeline",
            "pipeline breaks often",
            "brittle architecture",
            "failing jobs"
        ],
        "negativeKeywords": [
            "resilient pipelines"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Reliability Solutions"
    },
    {
        "id": "PAIN-129",
        "canonicalName": "Slow Time to First Token",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Poor UX",
        "synonyms": [
            "ttft",
            "slow time to first token",
            "takes forever to start typing",
            "laggy start"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "ttft",
            "slow time to first token",
            "takes forever to start typing",
            "laggy start"
        ],
        "negativeKeywords": [
            "fast ttft"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-130",
        "canonicalName": "Lagging AI Interfaces",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Frustration",
        "synonyms": [
            "lagging interface",
            "ui freeze",
            "slow chat ui",
            "janky interface"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "lagging interface",
            "ui freeze",
            "slow chat ui",
            "janky interface"
        ],
        "negativeKeywords": [
            "snappy ui"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-131",
        "canonicalName": "High Processing Overhead",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "high overhead",
            "cpu bound",
            "too much processing",
            "heavy compute"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "high overhead",
            "cpu bound",
            "too much processing",
            "heavy compute"
        ],
        "negativeKeywords": [
            "optimized processing"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-132",
        "canonicalName": "Unoptimized Models",
        "category": "AI Performance",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Wasted Compute",
        "synonyms": [
            "unoptimized model",
            "bloated model",
            "not quantized",
            "too large model"
        ],
        "relatedTerms": [
            "ai performance",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unoptimized model",
            "bloated model",
            "not quantized",
            "too large model"
        ],
        "negativeKeywords": [
            "optimized models"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Performance Solutions"
    },
    {
        "id": "PAIN-133",
        "canonicalName": "Inability to Scale AI",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Growth Cap",
        "synonyms": [
            "inability to scale",
            "can't scale ai",
            "stuck in poc",
            "fails at scale"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "inability to scale",
            "can't scale ai",
            "stuck in poc",
            "fails at scale"
        ],
        "negativeKeywords": [
            "infinitely scalable"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-134",
        "canonicalName": "Bottlenecked Endpoints",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Throttling",
        "synonyms": [
            "bottlenecked endpoint",
            "api bottleneck",
            "proxy bottleneck",
            "chokepoint"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "bottlenecked endpoint",
            "api bottleneck",
            "proxy bottleneck",
            "chokepoint"
        ],
        "negativeKeywords": [
            "load balanced"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-135",
        "canonicalName": "Concurrency Issues",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Dropped Requests",
        "synonyms": [
            "concurrency issue",
            "can't handle concurrent",
            "fails under load",
            "drops requests"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "concurrency issue",
            "can't handle concurrent",
            "fails under load",
            "drops requests"
        ],
        "negativeKeywords": [
            "high concurrency"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-136",
        "canonicalName": "Database Overload",
        "category": "AI Scaling",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "System Crash",
        "synonyms": [
            "database overload",
            "vector db crashed",
            "db connection limit",
            "overwhelmed db"
        ],
        "relatedTerms": [
            "ai scaling",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "database overload",
            "vector db crashed",
            "db connection limit",
            "overwhelmed db"
        ],
        "negativeKeywords": [
            "scalable database"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Scaling Solutions"
    },
    {
        "id": "PAIN-137",
        "canonicalName": "Legacy System Incompatibility",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Integration Failure",
        "synonyms": [
            "legacy incompatibility",
            "doesn't work with mainframe",
            "old system integration",
            "legacy API issues"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "legacy incompatibility",
            "doesn't work with mainframe",
            "old system integration",
            "legacy API issues"
        ],
        "negativeKeywords": [
            "seamless integration"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-138",
        "canonicalName": "Brittle API Connections",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Frequent Breakages",
        "synonyms": [
            "brittle api",
            "connections break",
            "flaky webhooks",
            "api changes break integration"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "brittle api",
            "connections break",
            "flaky webhooks",
            "api changes break integration"
        ],
        "negativeKeywords": [
            "robust apis"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-139",
        "canonicalName": "Complex Auth Workflows",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Delayed Implementation",
        "synonyms": [
            "complex auth",
            "oauth hell",
            "authentication nightmare",
            "hard to authenticate"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "complex auth",
            "oauth hell",
            "authentication nightmare",
            "hard to authenticate"
        ],
        "negativeKeywords": [
            "easy auth"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-140",
        "canonicalName": "Data Silos",
        "category": "AI Integration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Incomplete Context",
        "synonyms": [
            "data silos",
            "can't access other data",
            "isolated databases",
            "walled gardens"
        ],
        "relatedTerms": [
            "ai integration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "data silos",
            "can't access other data",
            "isolated databases",
            "walled gardens"
        ],
        "negativeKeywords": [
            "unified data graph"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Integration Solutions"
    },
    {
        "id": "PAIN-141",
        "canonicalName": "Siloed Prompt Engineering",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Duplication",
        "synonyms": [
            "siloed prompting",
            "not sharing prompts",
            "working in isolation"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "siloed prompting",
            "not sharing prompts",
            "working in isolation"
        ],
        "negativeKeywords": [
            "collaborative prompting"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-142",
        "canonicalName": "No Shared AI Workspaces",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.5,
        "businessImpact": "Friction",
        "synonyms": [
            "no shared workspace",
            "individual accounts",
            "can't collaborate on chat",
            "single player mode"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no shared workspace",
            "individual accounts",
            "can't collaborate on chat",
            "single player mode"
        ],
        "negativeKeywords": [
            "multiplayer ai"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-143",
        "canonicalName": "Duplicated AI Efforts",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Wasted Resources",
        "synonyms": [
            "duplicated effort",
            "building the same thing twice",
            "reinventing the wheel",
            "redundant ai projects"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "duplicated effort",
            "building the same thing twice",
            "reinventing the wheel",
            "redundant ai projects"
        ],
        "negativeKeywords": [
            "coordinated efforts"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-144",
        "canonicalName": "Poor Team Alignment",
        "category": "AI Collaboration",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Conflicting Goals",
        "synonyms": [
            "poor alignment",
            "teams not aligned",
            "disjointed ai strategy",
            "working at cross purposes"
        ],
        "relatedTerms": [
            "ai collaboration",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "poor alignment",
            "teams not aligned",
            "disjointed ai strategy",
            "working at cross purposes"
        ],
        "negativeKeywords": [
            "aligned teams"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "AI Collaboration Solutions"
    },
    {
        "id": "PAIN-145",
        "canonicalName": "No Exec AI Champion",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Stalled Progress",
        "synonyms": [
            "no exec champion",
            "no c-level support",
            "leadership doesn't care",
            "lacking sponsorship"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no exec champion",
            "no c-level support",
            "leadership doesn't care",
            "lacking sponsorship"
        ],
        "negativeKeywords": [
            "strong exec champion"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-146",
        "canonicalName": "Conflicting AI Priorities",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Confusion",
        "synonyms": [
            "conflicting priorities",
            "mixed signals from leadership",
            "c-suite disagrees",
            "no clear priority"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "conflicting priorities",
            "mixed signals from leadership",
            "c-suite disagrees",
            "no clear priority"
        ],
        "negativeKeywords": [
            "clear priorities"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-147",
        "canonicalName": "Unrealistic AI Expectations",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Disappointment",
        "synonyms": [
            "unrealistic expectations",
            "execs think it's magic",
            "hype driven expectations",
            "expecting agi"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unrealistic expectations",
            "execs think it's magic",
            "hype driven expectations",
            "expecting agi"
        ],
        "negativeKeywords": [
            "grounded expectations"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-148",
        "canonicalName": "Lack of Budget",
        "category": "Executive Alignment",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Stalled Initiatives",
        "synonyms": [
            "no budget",
            "zero budget",
            "denied funding",
            "can't afford ai"
        ],
        "relatedTerms": [
            "executive alignment",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no budget",
            "zero budget",
            "denied funding",
            "can't afford ai"
        ],
        "negativeKeywords": [
            "fully funded"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Executive Alignment Solutions"
    },
    {
        "id": "PAIN-149",
        "canonicalName": "Stalled Digital Initiatives",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Lost Competitiveness",
        "synonyms": [
            "stalled transformation",
            "digital transformation failed",
            "stuck in old ways"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stalled transformation",
            "digital transformation failed",
            "stuck in old ways"
        ],
        "negativeKeywords": [
            "accelerated transformation"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-150",
        "canonicalName": "Outdated Tech Stack",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Technical Debt",
        "synonyms": [
            "outdated tech",
            "legacy stack",
            "tech debt",
            "archaic systems"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "outdated tech",
            "legacy stack",
            "tech debt",
            "archaic systems"
        ],
        "negativeKeywords": [
            "modern stack"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-151",
        "canonicalName": "Manual Legacy Processes",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Inefficiency",
        "synonyms": [
            "manual legacy",
            "paper processes",
            "still using excel for everything",
            "manual routing"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "manual legacy",
            "paper processes",
            "still using excel for everything",
            "manual routing"
        ],
        "negativeKeywords": [
            "digital workflows"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-152",
        "canonicalName": "Slow Modernization",
        "category": "Digital Transformation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lagging Behind",
        "synonyms": [
            "slow modernization",
            "moving too slowly",
            "takes years to upgrade",
            "snail pace"
        ],
        "relatedTerms": [
            "digital transformation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow modernization",
            "moving too slowly",
            "takes years to upgrade",
            "snail pace"
        ],
        "negativeKeywords": [
            "agile modernization"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Digital Transformation Solutions"
    },
    {
        "id": "PAIN-153",
        "canonicalName": "Slow AI Prototyping",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Lost Opportunities",
        "synonyms": [
            "slow prototyping",
            "takes too long to build poc",
            "can't iterate fast",
            "slow dev cycle"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "slow prototyping",
            "takes too long to build poc",
            "can't iterate fast",
            "slow dev cycle"
        ],
        "negativeKeywords": [
            "rapid prototyping"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-154",
        "canonicalName": "Lack of AI Experimentation",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Stagnation",
        "synonyms": [
            "no experimentation",
            "afraid to try ai",
            "no sandbox culture",
            "stifled innovation"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no experimentation",
            "afraid to try ai",
            "no sandbox culture",
            "stifled innovation"
        ],
        "negativeKeywords": [
            "culture of experimentation"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-155",
        "canonicalName": "Competitor Outpacing",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "CRITICAL",
        "buyingIntentWeight": 0.9,
        "businessImpact": "Market Share Loss",
        "synonyms": [
            "competitor outpacing",
            "falling behind competitors",
            "rivals using ai better",
            "losing edge"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "competitor outpacing",
            "falling behind competitors",
            "rivals using ai better",
            "losing edge"
        ],
        "negativeKeywords": [
            "market leadership"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-156",
        "canonicalName": "Stifled Creativity",
        "category": "Innovation",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Status Quo",
        "synonyms": [
            "stifled creativity",
            "not allowed to innovate",
            "rigid culture",
            "no outside the box"
        ],
        "relatedTerms": [
            "innovation",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "stifled creativity",
            "not allowed to innovate",
            "rigid culture",
            "no outside the box"
        ],
        "negativeKeywords": [
            "creative freedom"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Innovation Solutions"
    },
    {
        "id": "PAIN-157",
        "canonicalName": "Unquantified AI Risks",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Unknown Liabilities",
        "synonyms": [
            "unquantified risks",
            "don't know the risks",
            "blind to ai risk",
            "unmeasured risk"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "unquantified risks",
            "don't know the risks",
            "blind to ai risk",
            "unmeasured risk"
        ],
        "negativeKeywords": [
            "quantified risks"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    },
    {
        "id": "PAIN-158",
        "canonicalName": "No AI Contingency Plan",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.8,
        "businessImpact": "Unpreparedness",
        "synonyms": [
            "no contingency plan",
            "no backup plan",
            "if ai goes down we fail",
            "single point of failure"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no contingency plan",
            "no backup plan",
            "if ai goes down we fail",
            "single point of failure"
        ],
        "negativeKeywords": [
            "solid contingency"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    },
    {
        "id": "PAIN-159",
        "canonicalName": "Lack of Red Teaming",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "HIGH",
        "buyingIntentWeight": 0.7,
        "businessImpact": "Security Blindspots",
        "synonyms": [
            "no red teaming",
            "untested models",
            "didn't jailbreak test",
            "no adversarial testing"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "no red teaming",
            "untested models",
            "didn't jailbreak test",
            "no adversarial testing"
        ],
        "negativeKeywords": [
            "continuous red teaming"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    },
    {
        "id": "PAIN-160",
        "canonicalName": "Uninsured AI Liabilities",
        "category": "Risk Management",
        "parentCategory": "AI Challenges",
        "severity": "MEDIUM",
        "buyingIntentWeight": 0.6,
        "businessImpact": "Financial Exposure",
        "synonyms": [
            "uninsured liability",
            "no cyber insurance for ai",
            "exposed to lawsuits",
            "legal liability"
        ],
        "relatedTerms": [
            "risk management",
            "ai challenge",
            "ai problem"
        ],
        "triggerPhrases": [
            "uninsured liability",
            "no cyber insurance for ai",
            "exposed to lawsuits",
            "legal liability"
        ],
        "negativeKeywords": [
            "fully insured"
        ],
        "confidenceModifier": 1.0,
        "suggestedResolutionCategory": "Risk Management Solutions"
    }
];
    this.initialized = false;
    this.lookupMap = new Map();
    this.triggerPhrases = []; // Optimized structure for regex building
  }

  /**
   * Initializes the ontology and builds optimized search structures.
   * Caches reusable structures to avoid unnecessary loops during execution.
   */
  initializeOntology() {
    if (this.initialized) return;

    this.ontology.forEach(pain => {
      // Map for O(1) lookups by ID
      this.lookupMap.set(pain.id, pain);

      // Build trigger phrase lookup
      pain.triggerPhrases.forEach(phrase => {
         this.triggerPhrases.push({
             phrase: phrase.toLowerCase(),
             regex: new RegExp('\\b' + this._escapeRegExp(phrase) + '\\b', 'gi'),
             painId: pain.id,
             weight: pain.buyingIntentWeight
         });
      });

      // Add canonical name and synonyms to triggers
      const allTerms = [pain.canonicalName.toLowerCase(), ...(pain.synonyms || [])];
      allTerms.forEach(term => {
          this.triggerPhrases.push({
             phrase: term,
             regex: new RegExp('\\b' + this._escapeRegExp(term) + '\\b', 'gi'),
             painId: pain.id,
             weight: pain.buyingIntentWeight
          });
      });
    });

    // Sort by phrase length descending to match longest phrases first (exact phrase matching)
    this.triggerPhrases.sort((a, b) => b.phrase.length - a.phrase.length);

    this.initialized = true;
  }

  /**
   * Detects pain signals from unstructured text.
   * @param {string} text - Raw unstructured text to process.
   * @returns {Array} Array of normalized pain results.
   */
  detectPainSignals(text) {
    this.initializeOntology();
    if (!text || typeof text !== 'string') return [];

    const normalizedText = this._normalizeText(text);
    const rawMatches = [];

    // Semantic matching using optimized regex
    for (const trigger of this.triggerPhrases) {
        let match;
        // Reset regex state since it's global
        trigger.regex.lastIndex = 0;
        while ((match = trigger.regex.exec(normalizedText)) !== null) {
            rawMatches.push({
                painId: trigger.painId,
                matchedTerm: match[0],
                position: match.index,
                triggerContext: this._extractContext(normalizedText, match.index, match[0].length),
                weight: trigger.weight
            });
        }
    }

    // Filter false positives and calculate confidence
    const validatedMatches = this._validateAndScoreMatches(rawMatches);

    // Merge duplicates
    const mergedSignals = this.mergeDuplicateSignals(validatedMatches);

    // Normalize format
    return this.normalizePainResults(mergedSignals);
  }

  /**
   * Identifies all distinct categories represented in a text.
   * @param {string} text - Raw text to process.
   * @returns {Array} Array of unique category names.
   */
  detectCategories(text) {
      const signals = this.detectPainSignals(text);
      const categories = new Set();
      signals.forEach(s => categories.add(s.Category));
      return Array.from(categories);
  }

  /**
   * Calculates confidence score for a specific match, incorporating context and penalties.
   * @param {Object} match - Raw match object.
   * @param {Object} painDef - The ontology definition for the pain.
   * @returns {number} Confidence score (0.0 to 1.0).
   */
  calculatePainConfidence(match, painDef) {
      let confidence = 0.8; // Base confidence

      // False positive reduction: Check negative keywords in context
      if (painDef.negativeKeywords && painDef.negativeKeywords.length > 0) {
          const contextLower = match.triggerContext.toLowerCase();
          for (const neg of painDef.negativeKeywords) {
              if (contextLower.includes(neg.toLowerCase())) {
                  // Strong penalty for negative context (e.g. "no problem", "resolved")
                  confidence *= 0.1;
                  break;
              }
          }
      }

      // Confidence modifiers
      confidence *= (painDef.confidenceModifier || 1.0);

      // Exact phrase match length bonus (longer phrases are less likely to be accidental)
      if (match.matchedTerm.length > 20) confidence *= 1.1;

      // Stopword proximity check (basic handling) - penalize if surrounded by negation
      const negationWords = ["not", "never", "without", "lacking", "resolved", "fixed", "avoided"];
      const prefix = match.triggerContext.substring(0, 30).toLowerCase();
      if (negationWords.some(w => prefix.includes(w + " "))) {
           // If the preceding text has negations that aren't part of the trigger
           // e.g. "we are not experiencing [trigger]"
           // However, some triggers are "lack of...", so we must be careful.
           // Only penalize if the trigger itself doesn't contain a negation.
           const triggerHasNegation = negationWords.some(w => match.matchedTerm.toLowerCase().includes(w));
           if (!triggerHasNegation) {
               confidence *= 0.3;
           }
      }

      return Math.min(Math.max(confidence, 0), 1.0);
  }

  /**
   * Merges duplicate signals for the same pain ID found in the text.
   * @param {Array} signals - Array of validated match objects.
   * @returns {Array} Deduplicated and aggregated signals.
   */
  mergeDuplicateSignals(signals) {
      const merged = new Map();

      signals.forEach(sig => {
          if (!merged.has(sig.painId)) {
              merged.set(sig.painId, { ...sig, matchCount: 1, matchedTerms: new Set([sig.matchedTerm]) });
          } else {
              const existing = merged.get(sig.painId);
              existing.matchCount += 1;
              existing.matchedTerms.add(sig.matchedTerm);
              // Take highest confidence
              existing.confidence = Math.max(existing.confidence, sig.confidence);
              // Combine context if different
              if (existing.triggerContext !== sig.triggerContext) {
                  existing.triggerContext = existing.triggerContext + " | " + sig.triggerContext;
              }
          }
      });

      return Array.from(merged.values()).map(sig => ({
          ...sig,
          matchedTerms: Array.from(sig.matchedTerms)
      }));
  }

  /**
   * Normalizes the merged signals into the final required output structure.
   * @param {Array} signals - Deduplicated signals.
   * @returns {Array} Normalized output format.
   */
  normalizePainResults(signals) {
      return signals
          // Filter out low confidence matches after penalties
          .filter(sig => sig.confidence >= 0.5)
          .map(sig => {
              const painDef = this.lookupMap.get(sig.painId);

              return {
                  PainID: painDef.id,
                  PainName: painDef.canonicalName,
                  Category: painDef.category,
                  Subcategory: painDef.parentCategory,
                  Confidence: Math.round(sig.confidence * 100), // Normalize to 0-100
                  Severity: painDef.severity,
                  IntentWeight: painDef.buyingIntentWeight,
                  BusinessImpact: painDef.businessImpact,
                  Evidence: sig.triggerContext.substring(0, 200), // Cap evidence length
                  MatchedTerms: sig.matchedTerms,
                  Position: sig.position,
                  SuggestedResolution: painDef.suggestedResolutionCategory
              };
          })
          .sort((a, b) => b.Confidence - a.Confidence); // Sort by highest confidence
  }

  /**
   * Summarizes the distribution of pain categories from normalized results.
   * @param {Array} normalizedSignals - Output from normalizePainResults.
   * @returns {Object} Summary object mapping categories to count and max severity.
   */
  summarizePainDistribution(normalizedSignals) {
      const summary = {};

      normalizedSignals.forEach(sig => {
          if (!summary[sig.Category]) {
              summary[sig.Category] = {
                  count: 0,
                  highestSeverity: 'LOW',
                  totalIntentWeight: 0
              };
          }

          summary[sig.Category].count += 1;
          summary[sig.Category].totalIntentWeight += sig.IntentWeight;

          const severities = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
          const currentMax = severities[summary[sig.Category].highestSeverity];
          const sigSev = severities[sig.Severity];

          if (sigSev > currentMax) {
              summary[sig.Category].highestSeverity = sig.Severity;
          }
      });

      return summary;
  }

  // --- Private Helper Methods ---

  _normalizeText(text) {
      return text.replace(/\s+/g, ' ').toLowerCase().trim();
  }

  _escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _extractContext(text, position, length) {
      const contextWindow = 60; // characters before and after
      const start = Math.max(0, position - contextWindow);
      const end = Math.min(text.length, position + length + contextWindow);
      return text.substring(start, end).trim();
  }

  _validateAndScoreMatches(rawMatches) {
      const validated = [];

      rawMatches.forEach(match => {
          const painDef = this.lookupMap.get(match.painId);
          if (!painDef) return;

          const confidence = this.calculatePainConfidence(match, painDef);

          validated.push({
              ...match,
              confidence: confidence
          });
      });

      return validated;
  }
}

/**
 * Global getter for the singleton instance of AIPainOntologyEngine.
 * Complies with project rule: Global singleton exports must use getter functions (lazy evaluation).
 * @returns {AIPainOntologyEngine}
 */
let _aiPainOntologyEngineInstance = null;
function getAIPainOntologyEngine() {
  if (!_aiPainOntologyEngineInstance) {
    _aiPainOntologyEngineInstance = new AIPainOntologyEngine();
    _aiPainOntologyEngineInstance.initializeOntology();
  }
  return _aiPainOntologyEngineInstance;
}

# TarkaX AI Pain Intelligence Agent - System Architecture

## 1. Executive Overview
The TarkaX AI Pain Intelligence Agent is an autonomous, serverless B2B lead intelligence engine. Its purpose is to continuously and automatically discover organizations that are experiencing pain points related to AI adoption, implementation, governance, automation, workflows, or productivity.

The system solves the business problem of manual, inefficient lead generation and qualification in the AI services/software sector. Instead of relying on static lists or broad outreach, TarkaX acts as an intelligent radar. It dynamically crawls disparate sources, identifies explicit and implicit organizational "pains", maps these pains to a formalized ontology, scores the buying intent, and surfaces actionable leads.

The primary users are revenue teams (Sales, RevOps, and Marketing) who consume the output to prioritize outreach and tailor messaging based on the exact problems a prospect is facing.

The expected daily workflow is completely hands-off:
1. Scheduled Google Apps Script triggers wake the system.
2. The engine executes its state machine, progressing tasks such as discovery, crawling, enrichment, and analysis within execution time limits.
3. Checkpoints are saved before time limits expire, allowing seamless resumption on the next trigger.
4. Output is materialized into a native Google Sheets Dashboard containing highly qualified, enriched leads prioritized by a calculated Buying Intent Score.

## 2. Overall System Architecture
The system is built entirely within a single Google Apps Script (GAS) project, utilizing Google Sheets as its relational database. The architecture is modular, decoupled, and highly resilient.

The high-level subsystems include:
* **Scheduler & Execution Controller**: The entry point driven by Time-Driven Triggers. It manages quotas, time limits, and invokes the State Machine.
* **Deterministic State Machine & Queue Engine**: Controls the workflow pipeline, manages state transitions, checkpointing, and dead-letter queues.
* **Discovery Engine**: Generates dynamic search queries, expands keywords, and identifies targets.
* **Crawling Layer**: A plugin-based subsystem for polling RSS, APIs, and public feeds, equipped with rate limiters and pagination handling.
* **Parsing & Normalization Layer**: Standardizes raw payloads from various crawlers into a common schema.
* **AI Adapter Layer**: A provider-agnostic interface (supporting Gemini, OpenAI, Anthropic via configuration) that abstracts external LLM API calls, managing batching and retries.
* **Enrichment Engine**: Extracts entities (companies, technologies, people) and augments them with firmographic data using the AI Layer and external APIs.
* **Pain Detection & Ontology Mapping**: Analyzes normalized text against a structured AI Pain Ontology, identifying categories and confidence levels.
* **Buying Intent Engine**: A weighted scoring mechanism evaluating recency, pain severity, and accumulated signals to generate a dynamically decaying intent score.
* **Deduplication Engine**: Resolves entity duplicates and merges signals using fuzzy matching and primary keys.
* **Knowledge Graph Manager**: Translates relational data in Sheets into interconnected nodes (Company, Source, Pain, Technology) to establish relationships.
* **Google Sheets Database**: The unified persistence layer with structured tables, indexes (row numbers/keys), and defined read/write batch operations.
* **Monitoring & Logging**: Tracks execution health, quota usage, and errors, ensuring system survivability.
* **Reporting Dashboard**: A native Google Sheets presentation layer utilizing pivot tables and charts to surface leads and KPIs.

Subsystems communicate exclusively through the Google Sheets Database and in-memory payload passing. A subsystem reads its required input from the relevant Queue/State sheet, processes it, and writes the output back to the database, signaling the State Machine to progress.

## 3. End-to-End Pipeline
The pipeline operates as a continuous loop, designed to span multiple script executions.

* **Stage 1: Initialization & Quota Check**
  * *Purpose*: Determine if the system has enough quota (time, UrlFetch) to proceed.
  * *Input*: Trigger event, Google Workspace quotas.
  * *Processing*: Read configuration, calculate available quota, acquire script locks.
  * *Output*: Lock acquired, available quota metrics.
  * *Failure/Retry*: If lock fails, abort and retry on next trigger.
  * *Checkpoint*: None.
  * *Duration*: < 5 seconds.

* **Stage 2: Discovery & Queue Generation**
  * *Purpose*: Identify new targets and populate the Crawler Queue.
  * *Input*: Discovery configuration, historical searches.
  * *Processing*: AI-driven keyword expansion, generation of search queries, URL construction for enabled crawler plugins.
  * *Output*: New rows inserted into the CrawlerQueue sheet.
  * *Failure/Retry*: Skips failed expansions, logged as non-fatal.
  * *Checkpoint*: Updated discovery timestamp.
  * *Duration*: 1-2 minutes.

* **Stage 3: Crawling & Ingestion**
  * *Purpose*: Fetch raw data from external sources.
  * *Input*: Pending items from CrawlerQueue.
  * *Processing*: Execute specific crawler plugins, handle pagination, respect rate limits.
  * *Output*: Raw data written to temporary holding, queued for parsing.
  * *Failure/Retry*: Exponential backoff for API errors. Moves to dead-letter queue after max retries.
  * *Checkpoint*: Crawler cursor/pagination token saved to state sheet.
  * *Duration*: 2-3 minutes (monitored closely for timeout).

* **Stage 4: Parsing & Normalization**
  * *Purpose*: Convert raw vendor formats into a unified internal schema.
  * *Input*: Raw crawled data.
  * *Processing*: Apply schema mapping, strip HTML/noise.
  * *Output*: Normalized documents written to processing queue.
  * *Failure/Retry*: Discard unparseable documents, log error.
  * *Checkpoint*: Batch ID completion.
  * *Duration*: < 1 minute.

* **Stage 5: AI Enrichment & Entity Extraction**
  * *Purpose*: Identify companies, technologies, and metadata.
  * *Input*: Normalized documents.
  * *Processing*: Send batches to the AI Adapter Layer for structured extraction.
  * *Output*: Extracted entities (Company Name, Tech Stack, Size).
  * *Failure/Retry*: Retry on AI API timeouts. Scale down batch size on failure.
  * *Checkpoint*: Row-level completion flags.
  * *Duration*: 1-3 minutes.

* **Stage 6: Pain Analysis & Ontology Mapping**
  * *Purpose*: Detect problems and classify them.
  * *Input*: Enriched documents.
  * *Processing*: AI evaluates text against the Pain Ontology, returning categories and confidence scores.
  * *Output*: Pain records associated with Companies.
  * *Failure/Retry*: Retry on AI failure.
  * *Checkpoint*: Row-level completion flags.
  * *Duration*: 1-3 minutes.

* **Stage 7: Deduplication & Graph Update**
  * *Purpose*: Merge duplicate companies and update the knowledge graph.
  * *Input*: New extracted entities and pains.
  * *Processing*: Fuzzy match existing companies, insert new or update existing. Append new edges (Company -> Pain).
  * *Output*: Updated Companies and KnowledgeGraph sheets.
  * *Failure/Retry*: Lock contention retries.
  * *Checkpoint*: Transactional batch write.
  * *Duration*: < 1 minute.

* **Stage 8: Lead Scoring (Buying Intent)**
  * *Purpose*: Calculate and decay intent scores.
  * *Input*: Complete Knowledge Graph.
  * *Processing*: Apply weighted formulas to historical and new signals, apply time-decay.
  * *Output*: Updated scores in Leads sheet.
  * *Failure/Retry*: Full recalculation on next run if interrupted.
  * *Checkpoint*: Last scored timestamp.
  * *Duration*: < 1 minute.

* **Stage 9: Materialization & Dashboard Update**
  * *Purpose*: Refresh UI for end-users.
  * *Input*: Leads sheet, Metrics.
  * *Processing*: Force refresh pivot tables (if needed), update metric summary cells.
  * *Output*: Updated Dashboard.
  * *Failure/Retry*: Silent failure, retried next run.
  * *Checkpoint*: Execution Complete state.
  * *Duration*: < 10 seconds.

## 4. Deterministic State Machine
The core orchestrator of the system is a persistent State Machine stored in the ExecutionState sheet. Every execution of the GAS trigger evaluates the current state, performs work, and explicitly transitions to the next state, writing checkpoints to guarantee resumability within the 6-minute GAS limit.

**States & Transitions:**
* `INITIALIZE`: Validates quotas, reads config, acquires locks. Translates to `DISCOVERY` or `QUEUE_WORKER`.
* `DISCOVERY`: Runs AI keyword expansion. Transitions to `QUEUE_WORKER`.
* `QUEUE_WORKER`: Evaluates all queues (Crawl, Parse, Enrich). Transitions to specific operational states based on priority.
* `CRAWL`: Executes plugins. Yields back to `QUEUE_WORKER` or transitions to `PARSE` if quota is low.
* `PARSE`: Normalizes data. Transitions to `ENRICH`.
* `ENRICH`: Extracts entities via AI. Transitions to `PAIN_ANALYSIS`.
* `PAIN_ANALYSIS`: Classifies pain points. Transitions to `DEDUPLICATION`.
* `DEDUPLICATION`: Merges entities. Transitions to `GRAPH_UPDATE`.
* `GRAPH_UPDATE`: Writes relational edges. Transitions to `LEAD_SCORING`.
* `LEAD_SCORING`: Updates buying intent. Transitions to `DASHBOARD_UPDATE`.
* `DASHBOARD_UPDATE`: Refreshes metrics. Transitions to `COMPLETE`.
* `COMPLETE`: Run finished successfully. Resets for the next trigger cycle.
* `FAILED`: Hard failure detected (e.g., sheet corruption). Transitions to `RECOVERY`.
* `RECOVERY`: Attempts to clear locks, rewind to the last stable checkpoint, and transitions to `QUEUE_WORKER`.

**Rollback, Restart, and Resume:**
The system uses batching and transaction-like markers. A batch of IDs is marked `IN_PROGRESS`. If the script times out (exceeds 5.5 minutes), it fails to write the `COMPLETED` state. On the next execution (Restart), the state machine identifies stale `IN_PROGRESS` records, rolls them back to `PENDING` (Rollback), and resumes processing (Resume).

## 5. Google Sheets Database Design
The spreadsheet acts as a relational database. To maximize performance, reads and writes are heavily batched using `getValues()` and `setValues()`.

* **Config**
  * *Purpose*: Key-value store for system settings.
  * *Columns*: Key (PK), Value, Description, LastUpdated.
  * *Volume*: < 100 rows.
  * *Strategy*: Read once per execution, cached in memory.

* **Companies**
  * *Purpose*: Master list of unique organizations.
  * *Columns*: CompanyID (PK), Name, Domain, Industry, Size, AI_Maturity, FirstSeen, LastUpdated.
  * *Volume*: 10,000 - 100,000+ rows.
  * *Strategy*: Indexed by Domain/Name for deduplication. Batch appended.

* **Sources**
  * *Purpose*: Origin of the signals (e.g., GitHub issue URL, Job Posting).
  * *Columns*: SourceID (PK), SourceType (Plugin), URL, RawContent, DatePublished.
  * *Volume*: 100,000+ rows.
  * *Strategy*: Append-only. High volume, aggressive archiving policy (move to cold storage/hidden sheets after 90 days).

* **PainOntology**
  * *Purpose*: Hierarchical dictionary of AI pains.
  * *Columns*: NodeID (PK), ParentID, Category, Description, Keywords, Weight.
  * *Volume*: < 500 rows.
  * *Strategy*: Static read, manual updates by admins.

* **BuyingSignals (Knowledge Graph Edges)**
  * *Purpose*: Maps Companies to Pains based on Sources.
  * *Columns*: SignalID (PK), CompanyID (FK), SourceID (FK), PainNodeID (FK), ConfidenceScore, ExtractionDate, DecayStatus.
  * *Volume*: 50,000+ rows.
  * *Strategy*: Batch append, indexed by CompanyID for lead scoring.

* **Leads (Materialized View)**
  * *Purpose*: The final output table for revenue teams.
  * *Columns*: LeadID (PK), CompanyID, CompanyName, CurrentIntentScore, TopPainCategory, RecentSignalDate, Status (New, Contacted).
  * *Volume*: 1,000 - 5,000 rows.
  * *Strategy*: Updated via bulk overwrite or indexed updates during `LEAD_SCORING`.

* **CrawlerQueue**
  * *Purpose*: Manages URLs and API endpoints to be polled.
  * *Columns*: QueueID (PK), PluginName, TargetURL, Status (Pending, In_Progress, Done, Failed), RetryCount, NextRetry, Cursor.
  * *Volume*: 1,000 - 10,000 rows.
  * *Strategy*: Highly mutable. Read, updated, and purged regularly.

* **ExecutionState**
  * *Purpose*: Tracks the State Machine.
  * *Columns*: ExecutionID, CurrentState, StartTime, EndTime, LastCheckpoint, Status.
  * *Volume*: < 1000 rows (log rotated).
  * *Strategy*: Single row update for active run, append for history.

* **SystemLogs & Metrics**
  * *Purpose*: Diagnostics and health monitoring.
  * *Columns*: Timestamp, Level, Component, Message, ExecutionID.
  * *Volume*: 10,000+ rows.
  * *Strategy*: Batch append-only. Truncated on a 30-day rolling basis.

## 6. Configuration Architecture
Configuration is decoupled from code to allow non-technical operators to tune the system and to support varying Google Workspace tiers. It is stored in the `Config` sheet and synchronized with GAS Script Properties for fast access.

**Key Configurable Domains:**
* **Execution & Quotas**:
  * `MAX_EXECUTION_TIME_MS` (e.g., 300000 for 5 mins to allow safe shutdown).
  * `MAX_DAILY_TRIGGERS`, `MAX_URL_FETCHES_PER_RUN`.
* **AI Provider Abstraction**:
  * `ACTIVE_AI_PROVIDER` (Gemini, OpenAI, Anthropic).
  * `AI_API_KEY` (Stored securely in Script Properties, referenced by config).
  * `AI_MODEL_NAME` (e.g., `gemini-1.5-pro`, `gpt-4o`).
  * `AI_TEMPERATURE`, `AI_MAX_TOKENS`.
* **Queue & Batching Limits**:
  * `CRAWLER_BATCH_SIZE`, `ENRICHMENT_BATCH_SIZE`, `MAX_RETRIES`.
* **Crawler Plugins**:
  * `PLUGIN_GITHUB_ENABLED` (boolean), `PLUGIN_GREENHOUSE_ENABLED` (boolean).
  * Specific backoffs and API limits per plugin.
* **Scoring Weights & Decay**:
  * `BASE_PAIN_WEIGHT`, `RECENCY_MULTIPLIER`, `DECAY_RATE_DAYS`.
* **System Operations**:
  * `LOGGING_LEVEL` (DEBUG, INFO, WARN, ERROR).
  * `ENABLE_DASHBOARD_REFRESH` (boolean).

## 7. Discovery Architecture
The Discovery Architecture operates asynchronously to find new data sources and organizations, preventing the system from relying on static lead lists. It is designed around continuous expansion rather than static rules.

* **Dynamic Search Generation**: The AI Adapter is prompted with base industry themes to dynamically generate hundreds of search strings formatted for specific platforms (e.g., GitHub issue queries, Reddit search parameters, Google Dorks).
* **Keyword Expansion & Boolean Generation**: Base terms (e.g., "LLM hallucination", "AI pipeline cost") are automatically expanded into complex Boolean queries tailored to specific crawler APIs to capture broader variations of the pain points.
* **Industry & Executive Title Discovery**: The system discovers new industry verticals and titles contextually associated with AI implementation pains, feeding these back into the discovery loop to generate new search combinations.
* **Trend Detection**: Frequency analysis is performed on newly extracted pain keywords. If a specific new term spikes in frequency, it is temporarily promoted in the search generation loop to capitalize on emerging trends.
* **Source Prioritization & Diversification**: Discovered URLs/queries are ranked. High-yield sources (producing a high ratio of validated pains) are prioritized in the Queue Engine. The system deliberately forces diversification by allocating a percentage of discovery budget to low-confidence or experimental queries to find untapped sources.
* **Freshness Strategy**: The engine tracks the 'Last Crawled' timestamp for every query and source. High-velocity sources are discovered/scheduled daily, while low-velocity sources are pushed to weekly schedules.

## 8. Crawling Architecture
The Crawling Layer is strictly plugin-based. Every source is a separate module implementing a common interface, allowing new sources to be added without modifying the core orchestrator.

* **Supported Plugins**:
  * **ATS/Hiring**: Greenhouse, Lever, Ashby, Workable (API-based, detecting roles indicating AI transformations or struggles).
  * **Developer Platforms**: GitHub (Issues, PRs, Discussions via public API).
  * **Communities**: Reddit, Hacker News (Public JSON APIs).
  * **General**: Generic RSS, News feeds, corporate Engineering blogs.
* **Pagination & Checkpointing**: Each plugin manages its own pagination tokens/cursors. After each successful page fetch, the cursor is saved to the `CrawlerQueue` sheet. If GAS times out, the next run resumes exactly at the saved cursor.
* **Rate Limiting**: Plugins define their own request delays and quota limits (e.g., GitHub REST API limits). The Queue Engine tracks consumption per domain and pauses the plugin if limits are approaching, shifting compute to a different plugin.
* **Normalization**: The plugin is responsible for stripping platform-specific metadata and outputting a standardized internal JSON schema (Title, Body, Author, Timestamp, Source URL).
* **Error Recovery**: Plugins implement exponential backoff. Non-200 HTTP responses increment a retry counter in the queue. After `MAX_RETRIES`, the item is moved to the dead-letter queue.
* **Deduplication at Edge**: Before fetching full payloads, plugins hash unique identifiers (e.g., Issue IDs, Job IDs) against a local cache (or indexed sheet) to skip already processed items, saving UrlFetch quota.

## 9. Enrichment Architecture
The Enrichment Architecture takes normalized raw text and extracts structured firmographic and metadata context using the configured AI provider.

* **Company Extraction**: Analyzes the raw text to identify the canonical company name and domain associated with the signal.
* **Technology Extraction**: Extracts mentioned tools, frameworks, and infrastructure (e.g., LangChain, Pinecone, AWS) to build a technology stack profile.
* **Firmographic Estimation**: Estimates employee count, industry classification, and country/region based on contextual clues in the text and source URL.
* **AI Maturity Assessment**: AI evaluates the context to classify the company's AI maturity stage (e.g., Exploring, Prototyping, Production, Scaling) based on the vocabulary used.
* **Hiring & Social Signals**: Detects whether the source indicates active hiring for specific roles (e.g., "MLOps Engineer") or executive sentiment regarding AI initiatives.
* **Data Confidence**: The AI provider must return a `confidence_score` (0.0 to 1.0) for all extracted entities. Entities below a configurable confidence threshold are discarded or flagged for manual review to prevent polluting the database with hallucinations.

## 10. AI Pain Ontology Architecture
The Pain Ontology is a structured hierarchical taxonomy stored in Google Sheets, defining exactly what constitutes an "AI Pain." It is designed for semantic matching rather than strict keyword matching.

* **Taxonomy Structure**:
  * **Level 1 (Domain)**: E.g., Infrastructure, Governance, Workflow, Financial.
  * **Level 2 (Category)**: E.g., LLM Hallucinations, Compute Costs, Data Privacy.
  * **Level 3 (Specific Pain)**: E.g., "Inability to ground RAG responses", "Unexpected token usage spikes".
* **Relationships**: Pains are linked to related technologies (e.g., Vector DB scaling pains) and typical roles that experience them (e.g., Data Engineer).
* **Versioning & Extensibility**: The ontology includes a Version ID. As the AI landscape changes, new nodes can be appended to the sheet. The AI Adapter uses the active version of the ontology during the prompt context phase to classify incoming text.
* **Classification**: When the AI Enrichment layer identifies a pain in a raw text, it does not invent a new pain; it maps it directly to the nearest `NodeID` in the ontology, ensuring highly structured data for reporting and scoring.

## 11. Buying Intent Engine
The Buying Intent Engine transforms qualitative pain signals into a quantitative, actionable score used to rank leads.

* **Weighted Signals**: Different types of signals carry different base weights. A job posting for an "AI Ethics Officer" (Governance pain) might weigh differently than a GitHub issue complaining about "LangChain timeouts" (Infrastructure pain). Weights are derived from the Ontology.
* **Confidence Multipiler**: The score is adjusted by the confidence score generated during the AI enrichment phase.
* **Accumulation**: Multiple unique signals from different sources for the same company aggregate, increasing the overall score exponentially to highlight persistent problems.
* **Signal Decay**: Intent is time-sensitive. The architecture implements a time-decay algorithm (e.g., half-life decay). A signal generated today is worth 100% of its score; after X days (configurable), its contribution to the total score reduces, eventually reaching zero.
* **Recency Priority**: Recent signals apply a multiplier to the final score, ensuring that companies experiencing immediate, acute pain bubble to the top of the Leads sheet.
* **Evolution**: The `CurrentIntentScore` is dynamically recalculated during the `LEAD_SCORING` state, evolving daily as old signals decay and new signals are attached.

## 12. Knowledge Graph Architecture
Because Google Sheets does not support native graph queries, the Knowledge Graph is implemented relationally via edge tables, allowing complex relationship traversals through pivot tables and simple lookups.

* **Nodes**:
  * `Company` (The central hub)
  * `Source` (Where the data came from)
  * `Pain` (The specific problem from the Ontology)
  * `Technology` (Tools being used)
* **Edges (Stored in `BuyingSignals` sheet)**:
  * An edge connects a `Company` to a `Pain`, citing the `Source` as evidence.
  * Edges contain metadata: `ExtractionDate`, `Confidence`, and `Status`.
* **Traversal Strategy**: To answer "Which companies are experiencing RAG hallucinations while using Pinecone?", the system filters the `BuyingSignals` edge table for the "RAG Hallucination" `PainNodeID`, joins it against the `Company` table, and filters by companies that also have a "Pinecone" `Technology` edge.
* **Graph Maintenance**: During `GRAPH_UPDATE`, the system explicitly checks for existing edges between a Company and a Pain. If an edge already exists, it updates the `LastSeen` timestamp and increments a frequency counter rather than duplicating the edge, strengthening the connection.

## 13. Queue Engine
The Queue Engine is engineered specifically to survive GAS execution limits and intermittent API failures. Instead of relying on long-running memory loops, it uses the Spreadsheet as persistent message brokers.

* **Task Queues**: Separate sheets or distinct status columns manage the stages of work (`CrawlerQueue`, `EnrichmentQueue`).
* **Worker Execution**: The `QUEUE_WORKER` state queries the highest priority queue, checks out a batch of records (marking them `IN_PROGRESS`), and processes them.
* **Checkpoint & Resume**: As each item in a batch is completed, its status is updated in memory. If processing succeeds, a single bulk update marks the batch as `DONE`. If the script times out prematurely, the `IN_PROGRESS` items remain. On the next execution, the system rolls them back to `PENDING` to resume.
* **Dead-Letter Queue**: Items that consistently fail (e.g., 404 URLs, unparseable JSON) increment a `RetryCount`. Once `RetryCount > MAX_RETRIES`, the item status changes to `FAILED` and it is logically moved to a dead-letter state to prevent blocking the worker.
* **Priority Queue**: Tasks are ordered not just by FIFO, but by Source Priority and Age. Urgent tasks (e.g., high-intent source crawling) are pulled before general broad discovery tasks.

## 14. Fault Tolerance
The system assumes failure is common (network drops, API quota limits, GAS timeouts) and is built to recover without human intervention.

* **Timeouts (6-minute limit)**: A global timer starts at `INITIALIZE`. Before beginning any heavy operation (like an AI API call), the system checks if the remaining time is greater than `BUFFER_TIME` (e.g., 30 seconds). If not, it safely checkpoints and exits cleanly.
* **API Failures**: External requests are wrapped in `try/catch` with exponential backoff. Rate limit responses (429) trigger a pause for that specific plugin and shift processing to another plugin.
* **Concurrent Executions**: If multiple triggers fire, GAS `LockService` is used. If a lock cannot be acquired within 10 seconds, the redundant execution terminates gracefully to prevent race conditions and duplicate writes.
* **Partial Writes & Data Corruption**: All spreadsheet writes are batched. If a failure occurs mid-write, the State Machine relies on transactional state markers. The `RECOVERY` state resolves inconsistencies by clearing corrupted `IN_PROGRESS` rows.
* **Quota Exhaustion**: The system tracks its daily `UrlFetchApp` limit. When the limit reaches 90% utilization, the system transitions to `COMPLETE` and skips crawling until the quota resets at midnight, prioritizing internal processing instead.

## 15. Security Architecture
Operating within the Google Workspace environment requires strict access control and secure credential management.

* **Secret Management**: API keys (OpenAI, Gemini, GitHub) are strictly stored in Google Apps Script `PropertiesService.getScriptProperties()`. They are never written to the spreadsheet or logs.
* **Permissions**: The GAS project operates under the identity of the installing user. The script is scoped with the principle of least privilege (only requesting `spreadsheets.currentonly`, `script.external_request`, and `script.scriptapp`).
* **Input Sanitization**: All data fetched from external sources (RSS, APIs) is sanitized before being written to sheets or passed to LLMs. HTML tags are stripped, and lengths are truncated to prevent formula injection attacks (`=CMD()`) in Sheets.
* **Safe Logging**: The logging system explicitly scrubs PII, API keys, and sensitive tokens before writing to the `SystemLogs` sheet.
* **Access Control**: The Google Sheet acts as the database and dashboard. Access is governed natively by Google Drive sharing permissions. Protected ranges prevent accidental manual overwrites of core tables.

## 16. Performance Architecture
Google Sheets is powerful but has strict API rate limits and execution slowness if not optimized. The architecture compensates for these limits.

* **Batch Operations**: Individual `sheet.getRange().setValue()` calls are strictly prohibited in loops. All reads use `getValues()` to pull data into 2D arrays in memory, and all writes use `setValues()` at the end of a transaction.
* **Cache Usage**: The `CacheService` is used to store frequently accessed data like the configuration object, the AI Pain Ontology, and recent Deduplication hashes, saving seconds of sheet-reading overhead per run.
* **Lazy Loading**: Subsystems only load the data they need. The Deduplication Engine does not load the entire `Companies` sheet; it relies on indexed lookup arrays and cached primary keys.
* **Queue Optimization**: Instead of sorting the entire Queue sheet via Apps Script (which is memory-intensive), the system relies on native Spreadsheet filtering/sorting or appends tasks sequentially and reads the top N rows.
* **Memory Management**: Variables storing large text payloads are explicitly set to `null` after use, allowing the GAS garbage collector to free memory and prevent "Out of Memory" exceptions.

## 17. Monitoring Architecture
The system monitors its own health and outputs data necessary for operators to debug issues.

* **Health Metrics**: Stored in a `Metrics` sheet, updated at the end of every execution. Includes: `Daily_API_Calls`, `Avg_Execution_Time`, `Rows_Processed`, and `Success_Rate`.
* **Crawler Status**: Each plugin reports its HTTP status codes. If a plugin throws >50% errors in an hour, it marks itself `DEGRADED` and notifies the log.
* **Queue Size Monitoring**: The system tracks the backlog. If the `CrawlerQueue` grows faster than the processing rate, it logs a warning that processing limits need adjustment.
* **Error Tracking**: All caught exceptions are written to `SystemLogs` with full stack traces, component names, and Execution IDs for traceability.

## 18. Dashboard Architecture
The Reporting Dashboard is built entirely using native Google Sheets features, requiring zero HTML/CSS. It provides the UI for revenue teams.

* **Pipeline Status**: High-level KPIs driven by `=COUNTIFS` (e.g., Total Leads Discovered, High Intent Leads, Active Pains Detected).
* **Top Leads View**: A dynamic view querying the `Leads` table, sorted by `CurrentIntentScore` descending. Displays Company Name, Top Pain Category, Last Signal Date, and a hyperlink to the Source evidence.
* **Buying Intent & Pain Distribution**: Native Pivot Charts visualize the distribution of detected pains across different industries and the volume of signals over the last 30 days.
* **Crawler Health Tab**: A specific dashboard view showing the success rate and throughput of individual plugins, driven by the `Metrics` sheet.
* **Execution History**: A read-only view of recent State Machine runs indicating whether the system is healthy, failing, or recovering.

## 19. Testing Strategy
Ensuring the architecture behaves reliably in production.

* **Unit Tests**: Core algorithmic functions (intent scoring math, deduplication fuzzy matching, state transitions) are modularized and testable in isolation using lightweight custom test harnesses within GAS.
* **Integration Tests**: Tests that validate the flow from `Crawler` -> `Parser` -> `AI Adapter` using mocked API responses.
* **Quota Tests**: Simulating the `UrlFetch` quota limit to ensure the script gracefully pauses and checkpoints rather than crashing.
* **Failure Simulation**: Manually corrupting the `ExecutionState` sheet to verify that the `RECOVERY` logic correctly rolls back stale transactions.

## 20. Future Expansion
The architecture is designed to be highly extensible without structural refactoring.

* **Future Crawler Plugins**: Adding LinkedIn, Twitter, or specialized industry forums simply requires writing a new class that conforms to the Crawler Interface and adding its configuration.
* **Future AI Models**: The AI Adapter layer allows swapping from Gemini to newer models (e.g., GPT-5, Claude 4) simply by updating API endpoints and parser logic in the adapter, leaving the pipeline untouched.
* **Future CRM Integrations**: An outbound webhook stage can be added after `LEAD_SCORING` to push high-intent leads directly into Salesforce or HubSpot using their REST APIs.
* **Future Ontology Expansion**: As AI use cases evolve, admins can simply add rows to the `PainOntology` sheet. The AI dynamically reads this, requiring zero code changes to detect new types of pains.
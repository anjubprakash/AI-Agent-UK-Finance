# UK Financial Rules AI Agent — Production FCA & PRA Regulatory Intelligence Platform

**UK Financial Rules AI Agent** is a production-style, secure, RAG-powered regulatory compliance intelligence platform engineered specifically for **United Kingdom Financial Regulations** (covering Financial Conduct Authority [FCA], Prudential Regulation Authority [PRA], and Bank of England statutory sourcebooks).

The platform enables compliance officers, risk analysts, MLROs, and financial employees to upload authentic UK regulatory sourcebooks (such as PRIN, FIT, SYSC, CASS, COCON, and COBS), enforces strict AI Gatekeeper pre-ingestion validation for foreign or non-regulatory documents, stores 384-dimensional dense vector embeddings in Qdrant, tracks live statutory amendments from official FCA feeds with selective incremental clause diffing, features an enterprise 4-tier prompt and semantic vector caching engine that eliminates LLM inference costs and latency for repeated/paraphrased queries, provides real-time token governance and ledger analytics, and synthesizes structured compliance answers with verified pinpoint regulatory citations and zero hallucination.

---

## 1. Technology Requirements Matrix

| Layer | Requirement | Implemented Technology | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | React 18 + Vite 5 (Port 8080 with API Proxy) | Built & Verified |
| **Frontend Language** | JavaScript Only | Pure JavaScript (0% TypeScript) | Verified |
| **Frontend UI Design** | Chakra UI Design System | Custom Chakra UI System (`#52796F` Forest Sage, `#2F3E46` Slate Charcoal, `#CAD7D0` Muted Sage, Light & Dark Mode) | Fully Styled |
| **Backend Framework** | Node.js + Express | Node.js (v22+) + Express 5 REST API (Port 5000) | Built & Running |
| **Backend Language** | JavaScript | Pure JavaScript (ES Modules `"type": "module"`) | Verified |
| **Primary Database** | MongoDB | MongoDB 6+ with Mongoose ODM | Connected (`127.0.0.1:27017`) |
| **Vector Database** | Qdrant | Qdrant (384-dimension Cosine distance, payload indexing) | Running (`localhost:6333`) |
| **Semantic Vector Cache** | Qdrant (`semantic_prompt_cache`) | 384-dim dense semantic vector cache ($\ge 0.80$ Cosine similarity threshold) bypassing LLM for paraphrased inquiries (0 prompt & 0 completion tokens) | Built & Active |
| **Prompt Cache Hierarchy** | 4-Tier Consolidated Engine | L1 RAM Map (<1ms) -> L2 MongoDB (<5ms) -> L3 Qdrant Semantic Vector (<25ms) -> L4 Retroactive Query History Matcher | Built & Active |
| **Token Cost Governance** | Real-Time Ledger & Metrics | Admin Token Consumption Ledger (`/admin/cost-analysis`) with 5 KPI summary cards, pure token analytics, and shaded hit rows | Built & Verified |
| **Embedding Engine** | `Xenova/all-MiniLM-L6-v2` | 384-dimensional dense vectors via `@huggingface/transformers` ONNX Runtime running 100% locally on CPU | Integrated (Free, Offline) |
| **Large Language Model** | Groq API | `openai/gpt-oss-120b` on Groq LPU hardware with strict closed-domain compliance guardrails | Integrated |
| **Pre-Ingestion Gatekeeper** | Multi-Point LLM Validation | Stratified 4-checkpoint document sampling (Start, ~15%, ~50%, ~85%) with automated rejection of non-UK material | Integrated |
| **Duplicate Prevention** | Multi-Layer Detection | Exact SHA-256 hash, rule code matching, title matching, and post-inspection AI rule code verification | Integrated |
| **Statutory Synchronization** | FCA Live Updates & Diffs | Live RSS feed parser (`fca.org.uk`) + MD5 clause-level incremental diff engine preserving unchanged vectors | Integrated |
| **Conversational Memory** | Multi-Turn Threads | MongoDB-persisted conversation threads with pronoun contextualization and grounded follow-up suggestion engine | Integrated |
| **Notifications** | Multi-User Isolation | Broadcast notifications tracking per-user read states (`readBy: [userId]`) for Admins and Employees | Integrated |

---

## 2. System Architecture

```
USER CLIENT (BROWSER)
(React 18 + Vite + Chakra UI v2 with Universal Light/Dark Theme)
│
├── Port 8080 -> Port 5000 (Vite Reverse Proxy with JWT Bearer Authentication)
▼
EXPRESS 5 REST BACKEND (NODE.JS v22+)
(Helmet, CORS, Rate-Limiting, Multer File Handling, Zod Payload Validation)
│
├──────────────────────────────┬──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
▼                              ▼                              ▼                              ▼                              ▼
DOCUMENT INGESTION PIPELINE    LIVE FCA STATUTORY SYNC        4-TIER CACHE & TOKEN MANAGER   RESEARCH & COMPLIANCE COPILOT  TOKEN GOVERNANCE & LEDGER
├── 1. Pre-Check & Duplicates  ├── 1. Live Feed Polling       ├── L1 Fast In-Memory RAM Map  ├── 1. Contextual Query Rewriter├── 1. Token Consumption Matrix
│   ├── SHA-256 Hash Check     │   └── fca.org.uk/news/rss.xml│   └── Instant <1ms RAM hit   │   └── Pronoun resolution      │   ├── Prompt (Input) Tokens
│   ├── Rule Code & Title Match├── 2. In-Memory Cache (15m)   ├── L2 Persistent MongoDB Cache├── 2. 4-Tier Cache Intercept   │   ├── Completion (Output) Tokens
│   └── Proactive UI Drop Alert├── 3. Tracked Core Sourcebooks│   └── Durable cross-reboot   │   ├── If Hit: 0 Tokens & <25ms│   └── Cumulative Total Processed
├── 2. File Text Extraction    │   └── PRIN, FIT, SYSC, CASS  ├── L3 Qdrant Semantic Vector  │   └── If Miss: Proceed to RAG ├── 2. Cache Savings KPI
│   ├── PDF (pdf-parse)        ├── 4. Incremental Diff Engine │   ├── 384-dim dense vectors  ├── 3. all-MiniLM Vectorizer    │   └── Saved by Qdrant (Tokens)
│   └── DOCX (mammoth)         │   ├── MD5 clause hash check  │   ├── Cosine Sim >= 0.80     │   └── 384-dim query vector    ├── 3. Real-Time Color Ledger
├── 3. AI Gatekeeper Guardrail │   ├── Preserves unchanged    │   └── 0 input & output tokens├── 4. Hybrid Qdrant Search     │   ├── Blue: ⚡ Semantic Hit (Qdrant)
│   ├── 4 Stratified Samples   │   └── Re-embeds modified     ├── L4 Retroactive Matcher     │   └── Cosine similarity       │   ├── Purple: ⚡ Exact Cache Hit
│   └── Plain English Reasoning└── 5. Version Bump & Alert    │   └── QueryHistory lookup    ├── 5. Closed-Domain Guardrail  │   └── Neutral: Fresh Inference
├── 4. Handbook Clause Splitter    ├── Version v1.0 -> v1.1   └── Refusal Blacklisting       │   └── Strict Refusal if 0 match└── 4. Interactive Inquiry Modal
│   └── Chapters/Sections/Rules    └── Broadcast to all staff     └── NEVER cache NOT_FOUND  ├── 6. Groq LLM Synthesis       └── Full Prompt, Excerpts, Tokens
├── 5. all-MiniLM-L6-v2 Embed                                                                │   └── openai/gpt-oss-120b
│   └── 384-dim CPU vectors                                                                  ├── 7. Verbatim Citations
└── 6. Atomic Storage                                                                        │   └── Interactive drawer
    ├── MongoDB (Metadata)                                                                   ├── 8. Grounded Follow-Ups
    └── Qdrant (Vectors)                                                                     │   └── Excerpt-grounded only
│                              │                              │                              └── 9. Thread Persistence
▼                              ▼                              ▼                                  └── MongoDB Conversation
MONGODB (Port 27017)           QDRANT VECTOR DB (Port 6333)    GROQ LPU INFERENCE
- User Accounts & Roles        - Collection `uk_financial_rules` - Pre-Ingestion AI Gatekeeper
- Conversation Message Threads - Collection `semantic_prompt_cache` - Compliance Answer Synthesis
- Query Audit History          - 384-dim Dense Vector Points   - Statutory Diff Summaries
- Document Catalog Metadata    - Cosine Similarity Indexing    - Grounded Follow-Up Prompts
- Persistent Prompt Caches     - Handbook Payload Filtering
- Isolated User Notifications  - Real-Time Ingestion Tracker
```

---

## 3. Detailed Model Specifications

### 1. Large Language Model (LLM)
- **Model**: `openai/gpt-oss-120b`
- **Provider**: Groq API
- **Inference Hardware**: Groq Language Processing Units (LPUs)
- **Role**: Powers the **Pre-Ingestion AI Gatekeeper**, synthesizes grounded compliance answers in the **Compliance Copilot**, and generates concise 2-sentence statutory impact summaries during FCA handbook version updates.
- **Strict Closed-Domain Guardrail**: Configured with low temperature (`0.1`) and strict instructions never to hallucinate or speculate. If an inquiry is not covered by uploaded statutory sourcebooks, it returns a strict refusal (`STRICT REFUSAL: NOT FOUND`) and lists the candidate clauses evaluated.
- **Prompt & Semantic Bypass (Zero Tokens)**: When incoming queries match previously answered questions or are paraphrased variations with cosine similarity $\ge 0.80$, the LLM is completely bypassed, recording **0 prompt tokens and 0 completion tokens** while providing instant responses.
- **Refusal Protection**: Unsuccessful queries or strict refusals (`STRICT REFUSAL: NOT FOUND`) are strictly blacklisted from being cached, guaranteeing ungrounded answers are never memorized.

### 2. Embeddings Model
- **Model**: `Xenova/all-MiniLM-L6-v2`
- **Provider**: Local ONNX Runtime via `@huggingface/transformers`
- **Vector Dimension**: `384`
- **Distance Metric**: Cosine Distance
- **Runtime Environment**: 100% pure Node.js on CPU (zero Python, zero external API keys, zero rate limits).
- **Inference Speed**: ~15–25ms per query vector on standard CPU hardware.
- **Dual Qdrant Collections**:
  1. `uk_financial_rules`: Indexes official UK handbook clauses, section numbers, titles, and regulatory authority payloads.
  2. `semantic_prompt_cache`: Indexes 384-dimensional query vector embeddings paired with synthesised answers, cited clauses, and metadata for instant semantic cache hits.

### 3. Pre-Ingestion AI Gatekeeper Engine
- **Mechanism**: Multi-point stratified sampling across 4 distinct document checkpoints:
  1. *Checkpoint 1 (Start)*: Document title, header, and official publishing authority.
  2. *Checkpoint 2 (~15% mark)*: Application scope and general provisions.
  3. *Checkpoint 3 (~50% mark)*: Substantive regulatory requirements and rules.
  4. *Checkpoint 4 (~85% mark)*: Enforcement, transitional schedules, and appendices.
- **Concise Reasoning Output**: Returns clear 1–2 sentence human-readable explanations free of internal technical jargon.
- **Clean Ingestion Lifecycle**:
  - **Phase 1 (Inspection)**: During Gatekeeper evaluation (`progress < 25%`), the UI displays an **Inspection Shield with a gentle radar pulse** (`AI Gatekeeper Inspecting Document`) with an indeterminate compliance scanner. No premature circular progress bar is displayed while the file is unverified.
  - **Phase 2 (Indexing)**: Once the AI Gatekeeper approves the rulebook, the circular progress ring activates (25% -> 100%), tracking handbook clause splitting, embedding generation, and atomic vector upserting into Qdrant.
- **Categorized Error & Rejection Display**:
  - 🟠 **Server / Connection Error (`WifiOff`)**: Warns when the backend server on port 5000 is unreachable and allows dismissing without misrepresenting the issue as an AI rejection.
  - 🔵 **Duplicate Document (`FileText`)**: Details existing registered rulebook version and chunk count with shortcut button to open the Rules Library.
  - 🟠 **Unreadable or Empty Document (`FileWarning`)**: Explains OCR or document formatting requirements.
  - 🔴 **Non-Regulatory Document Rejection (`ShieldAlert`)**: Concise, plain-English explanation of why the document does not qualify as an official UK financial regulatory publication, along with badge pills for accepted statutory bodies (FCA, PRA, Bank of England).

---

## 4. Key Operational Capabilities

### 1. Multi-Layer Duplicate Detection
- Protects the knowledge base from redundant vector points and storage inflation via 5 distinct checks:
  1. **Exact SHA-256 Hash**: Compares file binary signature against indexed records.
  2. **Rule Code Match**: Prevents duplicate indexing of active official codes (e.g. `PRIN`, `SYSC`, `FIT`).
  3. **Title Match**: Catches identical handbook titles across versions.
  4. **Original Filename Match**: Prevents re-uploading the same source file.
  5. **Post-AI Inspection Rule Code Match**: Inspects codes detected by the AI Gatekeeper to ensure they aren't already registered.
- **Proactive Dropzone Warning**: As soon as a user selects a file or enters a title matching an existing indexed document, an interactive alert banner appears under the dropzone before upload is initiated.

### 2. FCA Live Regulatory Update Center & Incremental Diffing
- Accessible via the master **"FCA Live Regulatory Update Center"** action button at the top of the Official Rules Catalog (`/admin/rules`).
- Automatically pulls live statutory notices and policy statements from the Financial Conduct Authority (`https://www.fca.org.uk/news/rss.xml`).
- Employs a 15-minute in-memory cache to ensure instant modal response times.
- **Selective Incremental Clause Diffing**:
  - Computes an MD5 hash for each statutory clause.
  - **Unchanged Clauses**: Preserved in Qdrant with zero re-embedding.
  - **Modified / New Clauses**: Re-embedded and updated in-place.
  - Automatically increments the version number (`v1.0 → v1.1`), logs an AI diff summary, and broadcasts an in-app alert to all staff.

### 3. Compliance Copilot with Multi-Turn Conversational Memory
- Full conversation persistence in MongoDB (`Conversation` model) allowing employees to resume past inquiries from a left-hand thread history sidebar.
- Contextual query rewriter (`buildContextualSearchQuery`) resolves pronouns (*"what about its penalties?"*) into explicit rule references based on recent conversation context.
- **Interactive Verbatim Citations**:
  - Displays `{cite.ruleCode || cite.ruleTitle}` tags on every grounded response.
  - Clicking any citation opens the responsive **Citation Drawer** displaying the exact verbatim clause excerpt, statutory section, and semantic similarity score.
- **Grounded Follow-Up Inquiry Prompts**:
  - Synthesizes dynamic follow-up inquiry suggestions strictly grounded in the retrieved regulatory excerpts.
  - Follow-up prompts are suppressed on refusal responses and cleaned from the initial welcome screen to ensure zero speculative or irrelevant suggestions.
- **Enhanced Typography**: Standardized markdown rendering with high-contrast text, clear headers, formatted bullet lists, blockquotes, and tables (`remark-gfm`).

### 4. Isolated Multi-User Notification System
- In-app notification bell with real-time unread badges.
- Tracks per-user read states via `readBy: [userId]` in MongoDB.
- Guarantees that when an Administrator marks all notifications as read, Employees still see their unread notifications and badge counts, and vice versa.

### 5. Team Access & Admin Delegation
- Dedicated administrative screen (`/admin/users`) powered by `AdminUsers.jsx`.
- Allows the primary Super Admin to invite and delegate administrative powers to new compliance officers, audit active admins, and manage team access.

### 6. Universal Light & Dark Mode
- Full dark/light mode toggle integrated in the 3-column navigation bar.
- Dynamically styles all pages and components using the signature `#52796F` forest sage and dark sage palette.

### 7. Multi-Tier Semantic & Prompt Caching Architecture
- Engineered to drastically minimize Groq LLM token consumption and drop inquiry latency from ~2–4 seconds to under 25 milliseconds:
  1. **Tier 1 (L1 In-Memory RAM Map)**: Normalized query string SHA-256 hash lookup in Node.js process memory. Returns in `< 1ms`.
  2. **Tier 2 (L2 Persistent MongoDB Cache)**: Cross-restart durable store (`PromptCache` collection) maintaining cached answers across server restarts and worker scaling. Returns in `< 5ms`.
  3. **Tier 3 (L3 Qdrant Semantic Vector Cache)**: Encodes incoming user inquiries into 384-dimensional vectors using local `all-MiniLM-L6-v2` and queries the dedicated `semantic_prompt_cache` Qdrant collection. If a stored query matches with **Cosine similarity $\ge 0.80$** (80%), the pre-computed compliance answer and verbatim citations are immediately served. **Consumes 0 prompt tokens and 0 completion tokens from the LLM.**
  4. **Tier 4 (L4 Retroactive Query History Matcher)**: Scans past verified queries in `QueryHistory` for matching answer contexts.
- **Refusal & Non-Regulatory Blacklisting**: The caching service inspects LLM outputs before storing. Answers containing `STRICT REFUSAL: NOT FOUND`, `NOT FOUND`, or refusal signals are never indexed into the cache. This ensures edge-case inquiries or incomplete rule sets are always re-evaluated against the latest regulatory updates.

### 8. AI Token Consumption & Cost Governance Ledger
- Located at `/admin/cost-analysis` for compliance leads and system administrators.
- **5 High-Level KPI Summary Cards**:
  1. **INPUT (PROMPT)**: Total raw tokens sent to the Groq LLM across all non-cached inquiries.
  2. **OUTPUT (COMPLETION)**: Total generated completion tokens synthesized by the model.
  3. **TOTAL PROCESSED**: Combined sum of all live tokens processed by the LLM.
  4. **SAVED BY CACHE (QDRANT)**: Cumulative tokens saved by serving answers directly from the Qdrant semantic vector cache and prompt cache (bypassing LLM inference).
  5. **AVG. / QUERY**: Average token throughput per synthesized regulatory answer.
- **Color-Coded Shaded Ledger Table**:
  - 🔵 **Blue Shaded Rows**: Highlight semantic vector cache hits (`⚡ Semantic Hit (Qdrant) [X% Match]`) where Qdrant satisfied the query with zero LLM token consumption.
  - 🟣 **Purple Shaded Rows**: Highlight exact cache hits (`⚡ Exact Hit`) served from L1/L2 memory.
  - ⚪ **Neutral Rows**: Display fresh RAG-synthesized queries with their explicit input and output token tallies.
- **Clickable Inquiry Modal**: Clicking any inquiry in the ledger opens an interactive inspection modal displaying the full question prompt, complete response text, cited rule clauses, and exact token metrics.
- **Zero Currency Clutter**: Strictly displays pure, verifiable token counts without misleading or arbitrary fiat currency estimates.

---

## 5. Quickstart Guide

### Prerequisites
- **Node.js**: `v22.0.0` or higher
- **MongoDB**: Running locally at `mongodb://localhost:27017`
- **Docker**: For running Qdrant vector database

---

### Step 1: Start Qdrant Vector Database
Run Qdrant in a Docker container:
```powershell
docker run -d --name qdrant_uk_finance -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

Verify Qdrant is healthy:
```powershell
curl http://localhost:6333/readyz
```

*Note: The application will automatically initialize both `uk_financial_rules` and `semantic_prompt_cache` collections on startup.*

---

### Step 2: Configure & Start Backend
Navigate to `Backend/` and install dependencies:
```powershell
cd Backend
npm install
```

Create or verify your `.env` file in `Backend/`:
```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=*

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/uk_finance_compliance

# JWT Authentication
JWT_SECRET=uk_finance_rules_checking_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# Groq LLM (Free key at https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Qdrant Vector DB
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=uk_financial_rules
QDRANT_SEMANTIC_CACHE_COLLECTION=semantic_prompt_cache

# Local Embedding Engine (all-minilm: Free, local 384-dim ONNX, zero external network calls)
EMBEDDING_PROVIDER=all-minilm
```

Start the backend server:
```powershell
npm run dev
```

The REST API is live at: **`http://localhost:5000/api`**

---

### Step 3: Start Frontend Client
Open a new terminal, navigate to `Frontend/`, and install dependencies:
```powershell
cd Frontend
npm install
```

Start the development server:
```powershell
npm run dev
```

Or build for production:
```powershell
npm run build
npm run preview
```

Open your browser at: **`http://localhost:8080/`**

---

### Step 4: Run Automated Verification Tests
Run the integration test suite in `Backend/`:
```powershell
cd Backend
node tests/integration.test.js
```

All 4 test cases will execute and verify:
- **Test 1**: AI Gatekeeper approval of authentic UK regulatory documents (e.g. FCA Consumer Duty PRIN 2A)
- **Test 2**: AI Gatekeeper rejection of irrelevant/non-regulatory documents (e.g. recipes, commercial guides) with concise plain-English reasoning
- **Test 3**: Qdrant 384-dimensional dense vector indexing and semantic similarity retrieval
- **Test 4**: Groq LLM grounded synthesis adhering strictly to UK financial regulations

Output will confirm:
```
🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀
```

---

## 6. Live Service Ports & URLs

| Service | Port | Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Web Client** | 8080 | `http://localhost:8080/` | React 18 + Vite + Chakra UI Web App |
| **Admin Cost & Token Ledger** | 8080 | `http://localhost:8080/admin/cost-analysis` | Real-time token consumption ledger & cache metrics |
| **Backend REST API** | 5000 | `http://localhost:5000/api` | Express 5 REST API |
| **Qdrant Vector Database** | 6333 | `http://localhost:6333/dashboard` | Qdrant Web Dashboard (`uk_financial_rules` & `semantic_prompt_cache`) |
| **MongoDB Database** | 27017 | `mongodb://localhost:27017` | Primary Document Store |

---

## 7. Complete REST API Reference

All requests and responses use standard JSON envelopes:
- **Success**: `{ "success": true, "statusCode": 200, "message": "...", "data": { ... } }`
- **Error**: `{ "success": false, "statusCode": 400, "message": "...", "errors": [ ... ] }`

### 1. Authentication & Team Management (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Public signup (first account is auto-designated Admin, subsequent are Employees) |
| `POST` | `/api/auth/login` | Public | Authenticate user; returns JWT token, user profile & role |
| `POST` | `/api/auth/register-admin` | Public / Admin | Register the first Super Admin or add a new Admin |
| `GET` | `/api/auth/users` | Admin Only | List all registered users (Admins & Employees) with role breakdown |
| `POST` | `/api/auth/users` | Admin Only | Admin creates a new team member account (ADMIN or EMPLOYEE) |
| `PATCH` | `/api/auth/users/:id/role` | Admin Only | Promote or demote user role between ADMIN and EMPLOYEE |
| `DELETE` | `/api/auth/users/:id` | Admin Only | Permanently delete user account |
| `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated user session |

### 2. Regulatory Rules & Ingestion Pipeline (`/api/regulatory-documents`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/regulatory-documents/upload-progress/:uploadId` | Authenticated | Poll real-time upload, Gatekeeper inspection, and Qdrant embedding progress |
| `GET` | `/api/regulatory-documents/fca/updates` | Authenticated | Fetch live FCA RSS publication notices and tracked handbook amendment statuses |
| `POST` | `/api/regulatory-documents/fca/sync` | Admin Only | Apply selective incremental synchronization for a core handbook (PRIN, SYSC, etc.) |
| `POST` | `/api/regulatory-documents` | Admin Only | Upload PDF/DOCX; validated by AI Gatekeeper & indexed into Qdrant |
| `POST` | `/api/regulatory-documents/:id/update-version` | Admin Only | Upload amended version PDF/DOCX; updates clauses and broadcasts alert |
| `GET` | `/api/regulatory-documents` | Authenticated | List all cataloged UK regulatory rulebooks (with search, category, authority filters) |
| `GET` | `/api/regulatory-documents/:id` | Authenticated | Fetch full metadata and clause breakdown for a specific rulebook |
| `DELETE` | `/api/regulatory-documents/:id` | Admin Only | Delete rulebook from MongoDB and wipe associated Qdrant vectors |
| `DELETE` | `/api/regulatory-documents/reset` | Admin Only | Factory reset: wipes all rulebooks, vectors, and uploaded files |

### 3. Employee Compliance Copilot, Cost Governance & Conversations (`/api/agent`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/agent/query` | Public / Auth | Submit compliance inquiry; checks 4-tier cache, executes RAG, or returns instant zero-token cached response |
| `GET` | `/api/agent/cost-analysis` | Admin Only | Real-time token consumption ledger, 5 KPI summaries, and audit logs with semantic match confidence |
| `GET` | `/api/agent/conversations` | Authenticated | List all past conversation threads for the logged-in user |
| `POST` | `/api/agent/conversations` | Authenticated | Create a new blank conversation thread |
| `GET` | `/api/agent/conversations/:id` | Authenticated | Retrieve a conversation thread by ID with full message history |
| `PATCH` | `/api/agent/conversations/:id` | Authenticated | Update conversation title or pin status |
| `DELETE` | `/api/agent/conversations/:id` | Authenticated | Delete a conversation thread |
| `GET` | `/api/agent/history` | Authenticated | Audit log of all submitted compliance queries |
| `GET` | `/api/agent/history/:id` | Authenticated | View specific inquiry record with cited rule clauses |

### 4. Isolated Multi-User Notification System (`/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Retrieve in-app notifications with individual read/unread isolation per user |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark a single notification as read for the calling user |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read for the calling user |

---

## 8. License & Compliance Scope

Distributed under the MIT License. Engineered for United Kingdom financial institutions, compliance consultancy practices, and authorised firms operating under the supervisory frameworks of the Financial Conduct Authority (FCA), Prudential Regulation Authority (PRA), and Bank of England.

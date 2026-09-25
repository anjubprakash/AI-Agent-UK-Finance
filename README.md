# UK Financial Rules AI Agent — Production FCA & PRA Regulatory Intelligence Platform

**UK Financial Rules AI Agent** is a production-grade, RAG-powered regulatory compliance intelligence platform engineered specifically for **United Kingdom Financial Regulations** (covering **Financial Conduct Authority [FCA]**, **Prudential Regulation Authority [PRA]**, and **Bank of England** statutory sourcebooks).

The platform enables compliance officers, risk analysts, MLROs, and financial staff to upload official UK regulatory sourcebooks (such as `PRIN`, `SUP`, `SYSC`, `CASS`, `DISP`, `PROD`, `FCG`, and `CONC`), verifies document authenticity via a 4-checkpoint **AI Gatekeeper**, indexes 384-dimensional dense vectors locally into **Qdrant**, tracks live statutory amendments from official FCA feeds with selective incremental clause diffing, features a **4-tier Exact & Semantic Vector Caching Engine** that eliminates LLM token usage for repeated or paraphrased inquiries, and provides a dual-tab **AI Token Analytics & Knowledge Base Inventory** ledger.

---

## 1. Technology Stack & Architecture Matrix

| Layer | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite 5 | Pure JavaScript (`0% TypeScript`), running on `http://localhost:8080` with API proxy to `:5000` |
| **UI Design System** | Chakra UI v2 | Custom UK Finance Sage & Slate Theme (`#52796F` Forest Sage, `#2F3E46` Slate Charcoal) with Light & Dark Mode |
| **Backend Framework** | Node.js (v22+) + Express 5 | ES Modules (`"type": "module"`), REST API on `http://localhost:5000/api` |
| **Primary Database** | MongoDB + Mongoose | Stores Users, Conversations, Query History, Regulatory Documents metadata, Prompt Cache, and Notifications |
| **Vector Database** | Qdrant (`localhost:6333`) | Dual 384-dimensional Cosine collections: `uk_financial_rules` (RAG clauses) & `semantic_prompt_cache` (Semantic cache) |
| **Local Embedding Model** | `Xenova/all-MiniLM-L6-v2` | 100% local CPU inference via `@huggingface/transformers` ONNX Runtime (`384-dim`, `0` external API cost) |
| **Large Language Model** | Groq LPU Inference | `openai/gpt-oss-120b` with static prompt prefix caching and strict closed-domain compliance guardrails |
| **AI Gatekeeper** | 4-Point Stratified Sampling | Inspects 4 mathematical slices (`0%`, `15%`, `50%`, `85%` — `3,600 chars` total) using `~1,200–1,355` tokens per upload |
| **Token Governance** | Dual-Tab Analytics Ledger | Dedicated tabs for **Compliance Chat Inquiries** and **Uploaded Document Tokens** (`/admin/cost-analysis`) |

---

## 2. System Architecture & End-to-End Pipelines

```
USER CLIENT (BROWSER - Port 8080)
(React 18 + Vite + Chakra UI v2 — Admin Portal & Employee Compliance Copilot)
 │
 ▼
EXPRESS 5 REST API BACKEND (Port 5000)
 │
 ├───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
 ▼                               ▼                               ▼                               ▼
DOCUMENT INGESTION PIPELINE     4-TIER PROMPT & SEMANTIC CACHE  RAG COMPLIANCE COPILOT          TOKEN ANALYTICS & LEDGER
1. SHA-256 & Title Pre-Check    1. L1 In-Memory RAM Map (<1ms)  1. Pronoun Context Rewriter     1. Tab 1: Chat Inquiries Ledger
2. PDF/DOCX Text Extraction     2. L2 MongoDB Exact Cache (<5ms)2. Conversational Greeting Path    - Input / Output / Billed Tokens
3. 4-Point Stratified Sample    3. L3 Qdrant Semantic Cache     3. 384-dim Query Embedding         - Semantic & Exact Cache Hits
   (0%, 15%, 50%, 85% = 3.6k c)    - Cosine Similarity >= 0.80  4. Hybrid Qdrant Search            - Initiator & Latency Tracking
4. Groq AI Gatekeeper Check        - Returns in ~18ms (0 tokens)   (`uk_financial_rules`)       2. Tab 2: Document Token Inventory
   (~1,200–1,355 LLM tokens)    4. L4 QueryHistory Matcher      5. Static Prefix Instructions      - Full RAG Document Tokens
5. Local Handbook Chunking         - Refusal Blacklist Guard       (Groq LPU Hardware Cache)       - Semantic Chunks & Word Count
6. Local MiniLM Embedding                                       6. Verbatim Rule Citations         - AI Gatekeeper Token Breakdown
   (0 LLM tokens billed)                                           & Grounded Follow-Ups
```

---

## 3. Why Document RAG Tokens vs. AI Gatekeeper Tokens Differ

On the **Token Analysis → Uploaded Document Tokens** page (`/admin/cost-analysis?tab=documents`), each uploaded rulebook displays two distinct token metrics:

| Metric Column | Example (`SUP.pdf`) | What It Represents | How It Is Processed |
| :--- | :--- | :--- | :--- |
| **DOCUMENT TOKENS (RAG)** | **`631,065 tokens`** *(2,176 chunks / 474k words)* | The **entire text volume** of the full PDF rulebook indexed for RAG semantic retrieval. | Chunked and embedded **100% locally on your server CPU** via `Xenova/all-MiniLM-L6-v2` into Qdrant (**0 Groq LLM tokens billed**). |
| **AI GATEKEEPER TOKENS** | **`1,354 tokens`** *(`1,248 in • 106 out`)* | The **1-time security & authenticity check** sent to Groq LLM during upload. | Extracts **4 fixed-size checkpoints** (`1,200 + 800 + 800 + 800 = 3,600 chars`) across the PDF (`0%`, `15%`, `50%`, `85%`) so verification always uses **`~1,200–1,355 tokens`** regardless of file size. |

---

## 4. Complete Repository Structure

### Backend (`Backend/src/`)

| File Path | Responsibilities & Key Functions |
| :--- | :--- |
| `config/env.js` | Loads and validates environment variables (`PORT`, `MONGODB_URI`, `GROQ_API_KEY`, `QDRANT_URL`). |
| `config/db.js` | Manages MongoDB connection pool via Mongoose ODM. |
| `services/aiGatekeeper.service.js` | `extractStratifiedDocumentSample()` slices 4 checkpoints (`3,600 chars`) and `validateRegulatoryDocumentWithAI()` verifies UK FCA/PRA authenticity via Groq. |
| `services/ragAgent.service.js` | Core RAG pipeline: conversational greeting fast-path, 4-tier cache lookup, pronoun resolution (`buildContextualSearchQuery`), Qdrant retrieval, and Groq synthesis with `STATIC_COMPLIANCE_INSTRUCTIONS` prefix. |
| `services/promptCache.service.js` | 4-tier cache engine: L1 RAM Map, L2 MongoDB (`PromptCache`), L3 Qdrant `semantic_prompt_cache` ($\ge 0.80$ cosine similarity), and L4 `QueryHistory` lookup. |
| `services/vectorStore.service.js` | Local `Xenova/all-MiniLM-L6-v2` 384-dim embedding generator, document indexing (`indexRegulatoryDocument`), and MD5 clause-level diff sync (`applyIncrementalRuleDiff`). |
| `services/qdrant.service.js` | Qdrant REST client managing `uk_financial_rules` and `semantic_prompt_cache` collections, vector search, and payload filtering. |
| `services/fcaParser.service.js` | Splits UK regulatory rulebooks into structured statutory clauses, chapters, and rule codes (`PRIN 2A`, `SUP 10C`, `CASS 7`). |
| `services/fcaSync.service.js` | Polls live FCA RSS updates (`fca.org.uk/news/rss.xml`) and tracks handbook version amendments. |
| `services/fileParser.service.js` | Extracts raw text from PDF (`pdf-parse`) and Word DOCX (`mammoth`) files and computes SHA-256 file hashes. |
| `controllers/agent.controller.js` | Handles `/api/agent/query`, multi-turn `Conversation` CRUD, and `/api/agent/cost-analysis` (computing both Chat Inquiry tokens and Uploaded Document token analytics). |
| `controllers/regulatoryDocument.controller.js` | Handles PDF/DOCX uploads, real-time upload progress polling, version updates, FCA live sync, and rulebook catalog listing with token counts. |
| `controllers/auth.controller.js` | Handles JWT signup, login, Super Admin bootstrap, and team role management (`ADMIN` / `EMPLOYEE`). |
| `controllers/notification.controller.js` | Manages isolated per-user unread/read notifications (`readBy: [userId]`). |

### Frontend (`Frontend/src/`)

| File Path | Responsibilities & Key Features |
| :--- | :--- |
| `pages/admin/CostAnalysis.jsx` | Dual-tab **Token Analytics** dashboard (`Compliance Chat Inquiries` & `Uploaded Document Tokens`), 10 KPI cards, interactive breakdown modals, and CSV export. |
| `pages/admin/RegulatoryRules.jsx` | Official UK Regulatory Rules catalog displaying token badges (`631,065 tokens`, `Large File`), version update modal, and **FCA Live Regulatory Update Center**. |
| `pages/admin/UploadDocument.jsx` | Drag-and-drop regulatory PDF/DOCX ingestion page with real-time AI Gatekeeper inspection modal. |
| `pages/admin/AdminDashboard.jsx` | Executive compliance overview with quick links to rulebooks, token analytics, and team management. |
| `pages/admin/AdminUsers.jsx` | Role-based team access control for adding/managing Admins and Employees. |
| `pages/employee/ChatAssistant.jsx` | Multi-turn **Compliance Copilot** with persistent conversation threads, verbatim citation drawer, and grounded follow-up questions. |
| `components/Navbar.jsx` | Responsive navigation bar with role-aware links, notification bell, and Light/Dark mode switcher. |
| `components/AiGatekeeperModal.jsx` | Live 3-stage document verification and vector indexing progress modal. |
| `components/CitationDrawer.jsx` | Slide-out drawer displaying verbatim statutory text, section numbers, and cosine similarity scores for cited rules. |

---

## 5. Quickstart & Local Setup Guide

### Prerequisites
- **Node.js**: `v22.0.0` or higher
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017`
- **Qdrant Vector DB**: Running on `http://localhost:6333` (via Docker or local binary)

### Step 1: Start Qdrant Vector Database
```powershell
docker run -d --name qdrant_uk_finance -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

### Step 2: Configure & Start the Backend (`Port 5000`)
```powershell
cd Backend
npm install
```
Copy `.env.example` to `.env` in `Backend/` and provide your `GROQ_API_KEY`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/uk_finance_compliance
JWT_SECRET=uk_finance_rules_checking_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=uk_financial_rules
QDRANT_SEMANTIC_CACHE_COLLECTION=semantic_prompt_cache

EMBEDDING_PROVIDER=all-minilm
```
Start the backend server:
```powershell
npm run dev
```

### Step 3: Start the Frontend (`Port 8080`)
```powershell
cd Frontend
npm install
npm run dev
```
Open **`http://localhost:8080`** in your browser.

---

## 6. REST API Endpoints Summary

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth & Users** | `POST` | `/api/auth/login` | Authenticate user and receive JWT Bearer token |
| **Auth & Users** | `POST` | `/api/auth/signup` | Register user account (first user auto-promoted to `ADMIN`) |
| **Auth & Users** | `GET` | `/api/auth/users` | List all Admins and Employees (`ADMIN` only) |
| **Rules & Ingestion** | `GET` | `/api/regulatory-documents` | List indexed rulebooks with chunk counts, word counts, and token metrics |
| **Rules & Ingestion** | `POST` | `/api/regulatory-documents` | Upload PDF/DOCX through AI Gatekeeper & index into Qdrant |
| **Rules & Ingestion** | `GET` | `/api/regulatory-documents/upload-progress/:uploadId` | Poll real-time Gatekeeper & Qdrant indexing percentage |
| **Rules & Ingestion** | `GET` | `/api/regulatory-documents/fca/updates` | Fetch live FCA RSS notices and handbook sync status |
| **Compliance Copilot** | `POST` | `/api/agent/query` | Ask compliance inquiry (4-tier cache check -> Qdrant RAG -> Groq synthesis) |
| **Token Analytics** | `GET` | `/api/agent/cost-analysis` | Retrieve Chat Inquiry token ledger & Uploaded Document token inventory |
| **Conversations** | `GET/POST/DELETE` | `/api/agent/conversations` | Manage persistent multi-turn compliance chat threads |
| **Notifications** | `GET/PATCH` | `/api/notifications` | Per-user isolated regulatory update alerts |

---

## 7. License
Distributed under the MIT License. Engineered for UK financial compliance governance and FCA/PRA regulatory intelligence.

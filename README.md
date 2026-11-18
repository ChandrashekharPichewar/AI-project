# 🧠 AI Knowledge Inbox

> A production-style, minimal web application that allows users to save plain text notes or web URLs, indexes them using semantic vector embeddings, and answers questions using a Retrieval-Augmented Generation (RAG) pipeline with exact source citations.

Built for the **Turium Interview Task: Build a Minimal "AI Knowledge Inbox"**.

---

## 🌐 Live Deployment & API Documentation

* **Live Web Application (Netlify):** [https://ai-knowledge-indox.netlify.app](https://ai-knowledge-indox.netlify.app)
* **Production API Service (Vercel):** [https://ai-project-rouge-eight.vercel.app](https://ai-project-rouge-eight.vercel.app)
* **Interactive OpenAPI / Swagger Documentation:** [https://ai-project-rouge-eight.vercel.app/api-docs](https://ai-project-rouge-eight.vercel.app/api-docs)
* **Live System Health Check:** [https://ai-project-rouge-eight.vercel.app/api/health](https://ai-project-rouge-eight.vercel.app/api/health)

---

## 🏗️ Architecture & Design Philosophy

The project is structured with a strict **Separation of Concerns** using the **Model-View-ViewModel (MVVM)** pattern on the frontend and a **Layered Service-Repository Architecture** on the backend.

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  [View: UI / Tailwind] ◄──► [ViewModel: Custom React Hooks] │
│                                      │                      │
│                                      ▼                      │
│                             [Model & API Client]            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                     │
│               [Controllers] ──► [Zod Schemas]               │
│                     │                                       │
│                     ▼                                       │
│         [Services Orchestration]                            │
│    ┌──────────────┬──────────────┬──────────────┐           │
│    │ Scraper (URL)│ Chunker (RAG)│ OpenAI (LLM) │           │
│    └──────────────┴──────────────┴──────────────┘           │
│                     │                                       │
│                     ▼                                       │
│               [Vector Service]                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQL / Cosine Distance (<=>)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         DATABASE (PostgreSQL + pgvector / Prisma)           │
│           Items Table ───1:N─── Document Chunks             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Component-based UI with strong type safety |
| **Frontend Pattern** | MVVM (Custom Hooks) | Complete separation of UI presentation from business logic |
| **Styling** | Tailwind CSS | Modern, responsive, clear UI design |
| **Backend** | Node.js + Express.js (TS) | High-performance, modular REST API |
| **ORM** | Prisma ORM | Type-safe schema definition and database migrations |
| **Database** | PostgreSQL | Relational metadata storage |
| **Vector Engine** | `pgvector` extension | High-dimensional vector indexing and cosine distance queries |
| **LLM & Embeddings** | Google Gemini (`gemini-2.0-flash` + `text-embedding-004`) / OpenAI | Semantic vector embeddings (768-d) & grounded RAG QA |
| **Web Scraping** | Cheerio + Axios | Server-side web content extraction and HTML noise stripping |
| **Validation** | Zod | Runtime schema validation for all incoming payloads |
| **Logging** | Pino | Structured JSON logging with request tracing and latency metrics |

---

## 📂 Project Structure

```
AI/
├── backend/
│   ├── api/
│   │   └── index.ts                 # Vercel serverless entry point
│   ├── prisma/
│   │   └── schema.prisma            # PostgreSQL schema with pgvector extension
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts               # Validated environment configurations
│   │   │   ├── logger.ts            # Pino structured logger
│   │   │   └── prisma.ts            # Prisma client instance & DB health checks
│   │   ├── controllers/
│   │   │   ├── ingest.controller.ts # Ingestion handler (URL & Text)
│   │   │   ├── items.controller.ts  # Item listing & deletion
│   │   │   ├── query.controller.ts  # Semantic RAG query handler
│   │   │   └── health.controller.ts # Uptime & DB connectivity status
│   │   ├── services/
│   │   │   ├── scraper.service.ts   # Cheerio URL scraper & HTML sanitizer
│   │   │   ├── chunker.service.ts   # Sentence-aware sliding window chunker
│   │   │   ├── openai.service.ts    # OpenAI embeddings & Chat completions
│   │   │   ├── vector.service.ts    # pgvector queries & fallback memory store
│   │   │   └── rag.service.ts       # End-to-end RAG orchestrator
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts      # Centralized error handler
│   │   │   ├── requestLogger.ts     # Request execution timing & logging
│   │   │   └── validate.ts          # Zod schema validation middleware
│   │   ├── schemas/
│   │   │   ├── ingest.schema.ts     # Ingestion Zod schema
│   │   │   └── query.schema.ts      # Query Zod schema
│   │   ├── app.ts                   # Express application setup
│   │   ├── server.ts                # Standalone Node HTTP server
│   │   └── test-e2e.ts              # Automated pipeline test runner
│   ├── docker-compose.yml           # Local PostgreSQL + pgvector setup
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json                  # Vercel deployment configuration
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── models/                  # Data contracts & DTOs
│   │   ├── services/
│   │   │   └── api.service.ts       # Typed REST API service
│   │   ├── viewmodels/
│   │   │   ├── useInboxViewModel.ts # Ingest & Item management state & logic
│   │   │   ├── useRagViewModel.ts   # Semantic QA & source citation logic
│   │   │   └── useHealthViewModel.ts# Server connectivity polling
│   │   ├── views/
│   │   │   ├── IngestFormView.tsx   # Text & URL input form
│   │   │   ├── ItemsListView.tsx    # List of saved knowledge with preview
│   │   │   ├── RagQueryView.tsx     # Semantic search input & suggestions
│   │   │   ├── AnswerDisplayView.tsx# Grounded answer & cited snippet cards
│   │   │   └── CitationModalView.tsx# Deep inspection modal for cited chunk
│   │   ├── components/              # Reusable UI primitives (Badge, Alert, Modal, Navbar)
│   │   ├── App.tsx                  # Master responsive layout
│   │   ├── main.tsx
│   │   └── index.css                # Tailwind CSS
│   ├── netlify.toml                 # Netlify deployment configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
│
└── package.json                     # Monorepo management scripts
```

---

## 🔍 Non-Functional Expectations & Tradeoff Awareness

### 1. Chunking Approach Rationale
* **The Strategy:** A sentence-and-punctuation-aware sliding window (~750 characters) with a 120-character (~15-20%) overlap.
* **Why not fixed-character chunking?** Fixed cuts (e.g. every 500 characters) frequently slice words and split dependent clauses across chunks. This breaks semantic continuity, degrading vector embedding quality.
* **Why not full documents?** Full web pages or long notes exceed the optimal semantic density of embedding models. Passing entire documents to the LLM also dilutes attention, increases token costs, and induces hallucinations.
* **The Sweet Spot:** ~750 characters (~150 words) is compact enough to capture a single coherent thought or fact, while the 120-character overlap ensures that entities spanning sentence boundaries remain contextualized in at least one retrieved chunk.

### 2. Vector Store Choice (`pgvector` in PostgreSQL)
* **Rationale:** PostgreSQL with `pgvector` brings vector similarity search directly into the relational database.
* **Key Advantages:**
  1. **Single Source of Truth:** No need to synchronize a separate vector database (like Pinecone or Milvus) with your relational database. Items and their vector chunks reside in the same transactional boundary (ACID guarantees).
  2. **Relational Filtering:** Metadata filtering (e.g., filtering chunks by user ID, date range, or source type) is executed natively in standard SQL joins without multi-database latency.
  3. **Zero Cold-Start / Local Development:** If PostgreSQL is not yet configured, the application includes an in-memory cosine similarity fallback so development and testing run friction-free.

### 3. What Breaks at Scale?
1. **Ingestion Latency & Throughput:** Scraping external URLs and generating OpenAI embeddings synchronously inside the HTTP request loop (`POST /ingest`) will time out on long articles or slow target websites. Under high concurrent load, server worker threads get tied up waiting for I/O.
2. **Vector Search Latency (Sequential Scans vs. Indexing):** Without an index, `pgvector` performs an exact $O(N)$ sequential scan across all vectors. Once chunks exceed 100,000+, response times degrade.
3. **Context Window Saturation:** If `topK` is set too high or chunk sizes are too large, the aggregated context can exceed the LLM's optimal attention budget, increasing cost and response latency.

### 4. Production Changes & Enhancements
1. **Asynchronous Background Ingestion Queue:** Decouple ingestion using **BullMQ / Redis** or **Inngest**. The `POST /ingest` endpoint returns `202 Accepted` with a job ID; workers fetch the webpage, chunk text, embed vectors, and store them asynchronously.
2. **Vector Indexing (HNSW vs. IVFFlat):** Add an **HNSW (Hierarchical Navigable Small World)** index in PostgreSQL for approximate nearest neighbor (ANN) search with sub-millisecond retrieval at million-scale vectors:
   ```sql
   CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
   ```
3. **Semantic Caching:** Cache query embeddings and frequent question answers in **Redis** to eliminate redundant OpenAI API calls for identical or semantically duplicate queries.
4. **Hybrid Search (BM25 + Dense Vectors) & Re-Ranking:** Combine pgvector dense cosine search with PostgreSQL full-text search (`tsvector`) via Reciprocal Rank Fusion (RRF) or a Cohere re-ranker to maximize precision for keyword-exact lookups (e.g., error codes, model names).
5. **Authentication & Multi-Tenancy:** Add Row-Level Security (RLS) in PostgreSQL with user isolation via Supabase Auth or Clerk.

---

## 🚀 API Specification

### 1. Ingest Content
* **Endpoint:** `POST /api/ingest` (or `POST /ingest`)
* **Headers:** `Content-Type: application/json`
* **Request Body (Text Note):**
  ```json
  {
    "type": "text",
    "title": "Postgres Vector Notes",
    "content": "pgvector adds vector similarity search to PostgreSQL using the <=> operator."
  }
  ```
* **Request Body (URL):**
  ```json
  {
    "type": "url",
    "content": "https://example.com/blog/rag-pipeline"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Content successfully ingested and indexed for semantic search",
    "data": {
      "id": "2e1c3a47-6fc0-4521-a06c-91ad98699937",
      "title": "Postgres Vector Notes",
      "type": "TEXT",
      "url": null,
      "chunkCount": 3,
      "contentLength": 720,
      "createdAt": "2026-11-17T12:00:00.000Z"
    }
  }
  ```

### 2. List Saved Items
* **Endpoint:** `GET /api/items` (or `GET /items`)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": "2e1c3a47-6fc0-4521-a06c-91ad98699937",
        "type": "TEXT",
        "title": "Postgres Vector Notes",
        "url": null,
        "rawContent": "pgvector adds vector similarity search...",
        "chunkCount": 3,
        "createdAt": "2026-11-17T12:00:00.000Z",
        "updatedAt": "2026-11-17T12:00:00.000Z"
      }
    ]
  }
  ```

### 3. Ask Question (RAG)
* **Endpoint:** `POST /api/query` (or `POST /query`)
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "query": "How does vector similarity work in Postgres?",
    "topK": 4
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "answer": "Based on your saved notes, vector similarity in PostgreSQL is enabled via the pgvector extension...",
      "sources": [
        {
          "itemId": "2e1c3a47-6fc0-4521-a06c-91ad98699937",
          "chunkIndex": 0,
          "title": "Postgres Vector Notes",
          "url": null,
          "type": "TEXT",
          "snippet": "pgvector adds vector similarity search to PostgreSQL using the <=> operator.",
          "similarity": 0.8942
        }
      ],
      "metrics": {
        "retrievedChunks": 4,
        "processingTimeMs": 284
      }
    }
  }
  ```

### 4. Delete Item
* **Endpoint:** `DELETE /api/items/:id`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Item and its vector chunks deleted successfully"
  }
  ```

### 5. Health Check
* **Endpoint:** `GET /api/health` (or `GET /health`)
* **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "uptime": 124.5,
    "timestamp": "2026-11-17T12:00:00.000Z",
    "services": {
      "database": "connected (postgresql + pgvector)",
      "llm": "openai enabled"
    },
    "version": "1.0.0"
  }
  ```

---

## 🚢 Deployment Guide

### A. Deploy Backend & Database on Vercel
The backend is pre-configured with `backend/vercel.json` and a serverless entry point in `backend/api/index.ts`.

1. **Database Setup (PostgreSQL with pgvector):**
   * Provision a PostgreSQL database supporting `pgvector` on **Neon**, **Supabase**, or **Vercel Postgres**.
   * Run the SQL migration or `prisma db push` to initialize tables:
     ```bash
     cd backend
     npx prisma db push
     ```
2. **Deploy to Vercel:**
   * Import the repository on Vercel.
   * Set **Root Directory** to `backend`.
   * Configure Environment Variables in Vercel Project Settings:
     * `DATABASE_URL`: `postgresql://user:pass@host/dbname?sslmode=require`
     * `OPENAI_API_KEY`: `sk-proj-your-openai-key`
     * `NODE_ENV`: `production`
     * `CORS_ORIGIN`: `*` (or your Netlify frontend URL)
   * Deploy! Your backend API will be live at `https://your-backend.vercel.app`.

### B. Deploy Frontend on Netlify
The frontend is pre-configured with `frontend/netlify.toml` for Single-Page Application (SPA) routing.

1. **Deploy to Netlify:**
   * Import the repository in Netlify.
   * Set **Base directory** to `frontend`.
   * Set **Build command** to `npm run build`.
   * Set **Publish directory** to `dist`.
   * Add Environment Variable:
     * `VITE_API_BASE_URL`: `https://your-backend.vercel.app`
2. **Deploy!** Netlify will build the production bundle and serve the app with automatic HTTPS.

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create `.env` inside `backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/knowledge_inbox"
OPENAI_API_KEY="sk-proj-your-openai-api-key"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_CHAT_MODEL="gpt-4o-mini"
CORS_ORIGIN="*"
LOG_LEVEL="info"
```

*(Note: If you don't supply a `DATABASE_URL` or `OPENAI_API_KEY` immediately, the backend automatically runs in graceful demonstration/in-memory mode with deterministic mock embeddings!)*

### 3. Optional: Run Local PostgreSQL with pgvector via Docker
```bash
cd backend
docker compose up -d
npm run prisma:push
```

### 4. Run the Backend
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

### 5. Run the Frontend
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

---

## 🧪 Verification & Automated Testing
To run the automated end-to-end integration test validating Zod validation, Cheerio extraction, chunking, vector embeddings, and RAG retrieval:

```bash
cd backend
npx tsx src/test-e2e.ts
```

All 7 core test phases will execute and report timing metrics and source cosine similarity scores.

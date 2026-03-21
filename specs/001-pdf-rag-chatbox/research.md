# Research: PDF RAG Chatbox

**Branch**: `001-pdf-rag-chatbox` | **Phase**: 0 | **Date**: 2026-03-21

## Decision Log

---

### D-001: Text Chunking Strategy

**Decision**: Fixed-size chunking — 500 tokens per chunk, 50-token overlap using
LangChain `RecursiveCharacterTextSplitter`.

**Rationale**: 500 tokens balances retrieval precision (smaller = more precise
matches) against context richness (too small = loss of sentence meaning). 50-token
overlap prevents answers from being split across chunk boundaries.

**Alternatives considered**:
- Semantic chunking (split by sentence/paragraph meaning): more accurate but adds
  complexity and latency with no clear gain for the v1 use case.
- Page-level chunking: too coarse — a single page may contain unrelated content,
  degrading retrieval quality.

---

### D-002: Embedding Model

**Decision**: OpenAI `text-embedding-3-small` producing 1536-dimensional vectors.

**Rationale**: Cheapest OpenAI embedding model (~$0.02 per 1M tokens). Sufficient
quality for document retrieval. Already approved in constitution.

**Alternatives considered**:
- `text-embedding-3-large`: Better quality, 3× more expensive — not justified for v1.
- HuggingFace open-source models: Free but require GPU hosting or slow CPU inference,
  violating the free-tier spirit when factoring in compute costs.

---

### D-003: Vector Similarity Search

**Decision**: Cosine similarity via pgvector `<=>` operator, retrieving top-5 chunks
per query.

**Rationale**: Cosine similarity is standard for text embeddings (orientation matters,
not magnitude). Top-5 gives enough context for the LLM without exceeding the
gpt-4o-mini context window. Supabase pgvector supports this natively at no extra cost.

**Alternatives considered**:
- L2 distance (`<->`): Works but cosine is more appropriate for normalized text vectors.
- Top-3 chunks: May miss relevant context for complex questions.
- Top-10 chunks: Risk of exceeding token budget and including noise.

---

### D-004: AI Response Streaming Transport

**Decision**: Server-Sent Events (SSE) via FastAPI `StreamingResponse` with
`text/event-stream` content type. Frontend consumes with the `EventSource` API or
`fetch` + `ReadableStream`.

**Rationale**: SSE is one-directional (server → client), which matches the AI streaming
use case exactly. Simpler than WebSockets (no bidirectional handshake, no state
management). Native browser support. FastAPI supports it out of the box.

**Alternatives considered**:
- WebSockets: Overkill — bidirectional communication not needed for AI streaming.
- Long polling: Inefficient and adds latency between chunks.

---

### D-005: PDF File Storage

**Decision**: Store uploaded PDFs in Supabase Storage (free tier: 1GB).

**Rationale**: Keeps all infrastructure on Supabase (single free-tier provider).
After text extraction and chunking are complete, the raw PDF is retained for potential
future re-processing or download. The file path is stored in the Document record.

**Alternatives considered**:
- Local disk storage: Not viable for cloud deployment (ephemeral filesystem on Vercel
  serverless). Backend must be deployed on a persistent server (e.g. Railway/Render).
- S3/Cloudflare R2: Free tiers exist but adds a second provider, complicating setup.

---

### D-006: PDF Text Extraction Library

**Decision**: `pypdf` (already installed).

**Rationale**: Handles text-based PDFs reliably. Already in the virtualenv.
For image-only (scanned) PDFs, pypdf returns empty text — the system detects this
and notifies the user (FR-013), avoiding silent failure.

**Alternatives considered**:
- `pdfplumber`: Better layout extraction but heavier dependency; not needed for v1.
- `PyMuPDF` (fitz): More powerful for scanned docs, but requires OCR (Tesseract)
  adding significant complexity — out of scope for v1.

---

### D-007: Frontend Data Fetching

**Decision**: Native `fetch` with React `useState`/`useEffect`. No external data
fetching library.

**Rationale**: The data model is simple (document list, chat messages). Adding SWR or
React Query would be premature complexity (YAGNI — Principle VI). Native fetch is
sufficient and keeps the bundle small.

**Alternatives considered**:
- SWR: Useful for polling and caching but overkill for a simple document list.
- React Query: Same argument as SWR, adds unnecessary abstraction for v1.

---

### D-008: Chat History Persistence

**Decision**: Chat history stored permanently in Supabase `chat_messages` table.
Each document has one conversation identified by `document_id` — no separate
`session_id` needed. History is retrieved by `document_id` on every page load.

**Rationale**: Clarified requirement (FR-012, FR-016): history must persist across
browser sessions indefinitely. Since each document has exactly one conversation,
`document_id` alone is the stable identifier — no session token needed. The frontend
retrieves full history on mount by calling `GET /chat/{document_id}/history`.

**Alternatives considered**:
- sessionStorage session_id: Cleared on tab close — ruled out by the persistence requirement.
- React state only: Lost on refresh — not viable.
- localStorage session_id: Unnecessary — document_id already uniquely identifies the conversation.

---

### D-009: Backend Deployment Target

**Decision**: FastAPI app deployed on **Render** (free tier: 750 hrs/month, spins down
after 15 min inactivity).

**Rationale**: Render supports Python natively, is free, and does not use ephemeral
filesystems in the same way as serverless functions — important because the upload
flow needs a persistent process to run PDF extraction before writing to Supabase.
Spin-down on inactivity is acceptable for a v1 personal tool.

**Alternatives considered**:
- Railway: Also free but slightly more complex setup for Python.
- Vercel serverless functions: 10s timeout — insufficient for large PDF processing.
- Fly.io: Free tier available but requires Docker knowledge, adds friction.

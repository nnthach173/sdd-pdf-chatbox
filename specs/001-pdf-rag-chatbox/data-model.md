# Data Model: PDF RAG Chatbox

**Branch**: `001-pdf-rag-chatbox` | **Phase**: 1 | **Date**: 2026-03-21

## Entities

---

### Document

Represents a user-uploaded PDF file and its processing lifecycle.

| Field        | Type        | Constraints                                      | Notes                                      |
|--------------|-------------|--------------------------------------------------|--------------------------------------------|
| `id`         | UUID        | PRIMARY KEY, default gen_random_uuid()           | Stable identifier used in all references   |
| `name`       | TEXT        | NOT NULL                                         | Original filename from upload              |
| `file_path`  | TEXT        | NOT NULL                                         | Supabase Storage path (bucket/filename)    |
| `file_size`  | INTEGER     | NOT NULL, > 0                                    | Size in bytes, max 52_428_800 (50MB)       |
| `page_count` | INTEGER     | NULLABLE                                         | Set after extraction; null while pending   |
| `status`     | TEXT        | NOT NULL, CHECK IN ('uploading','processing','ready','failed') | Processing lifecycle state |
| `error_msg`  | TEXT        | NULLABLE                                         | Human-readable error if status = 'failed'  |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now()                          | Upload timestamp                           |

**State transitions**:
```
uploading → processing → ready
uploading → failed
processing → failed
```

**Validation rules**:
- `file_size` MUST be ≤ 52,428,800 bytes (50MB) — enforced at API layer before storage
- `name` MUST end with `.pdf` (case-insensitive) — enforced at API layer
- `status` transitions are one-way and enforced in the service layer

---

### DocumentChunk

A segment of extracted text from a Document, with its semantic embedding for
vector similarity search.

| Field           | Type        | Constraints                              | Notes                                        |
|-----------------|-------------|------------------------------------------|----------------------------------------------|
| `id`            | UUID        | PRIMARY KEY, default gen_random_uuid()   |                                              |
| `document_id`   | UUID        | NOT NULL, FK → Document(id) ON DELETE CASCADE | Cascade ensures chunks removed with doc |
| `content`       | TEXT        | NOT NULL                                 | Raw text of the chunk (~500 tokens)          |
| `embedding`     | vector(1536)| NOT NULL                                 | OpenAI text-embedding-3-small output         |
| `chunk_index`   | INTEGER     | NOT NULL, ≥ 0                            | Order of chunk within document               |
| `created_at`    | TIMESTAMPTZ | NOT NULL, default now()                  |                                              |

**Indexes**:
- `HNSW` index on `embedding` using cosine distance (`vector_cosine_ops`) for fast
  approximate nearest-neighbour search (already created in Supabase setup SQL)
- Composite index on `(document_id, chunk_index)` for ordered chunk retrieval

**Validation rules**:
- `embedding` dimension MUST equal 1536 — enforced by pgvector column type
- `chunk_index` MUST be unique per `document_id` — enforced via UNIQUE constraint

---

### ChatMessage

A single message turn in a conversation about a document. Both user questions and
AI responses are stored here.

| Field        | Type        | Constraints                                         | Notes                                         |
|--------------|-------------|-----------------------------------------------------|-----------------------------------------------|
| `id`         | UUID        | PRIMARY KEY, default gen_random_uuid()              |                                               |
| `document_id`| UUID        | NOT NULL, FK → Document(id) ON DELETE CASCADE       | Which document this chat belongs to           |
| `session_id` | TEXT        | NULLABLE                                            | Reserved for future multi-session support; NULL in v1 (one conversation per document) |
| `role`       | TEXT        | NOT NULL, CHECK IN ('user', 'assistant')            | Message author                                |
| `content`    | TEXT        | NOT NULL                                            | Full message text                             |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now()                             | Used to reconstruct ordered history           |

**Validation rules**:
- Messages MUST be retrieved ordered by `created_at ASC` to reconstruct conversation
- History is scoped by `document_id` only — one persistent conversation per document
- `content` MUST NOT be empty string — enforced at API layer

---

## Entity Relationships

```
Document (1) ──────────────── (many) DocumentChunk
    │                                     (cascade delete)
    │
    └─────────────────────────── (many) ChatMessage
                                          (cascade delete)
```

Both `DocumentChunk` and `ChatMessage` are owned by `Document`. Deleting a
`Document` cascades to remove all chunks and messages (FR-011).

---

## Supabase SQL Schema

```sql
-- Enable vector extension (already run during setup)
create extension if not exists vector;

-- Documents table
create table documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  file_path   text not null,
  file_size   integer not null check (file_size > 0),
  page_count  integer,
  status      text not null default 'uploading'
                check (status in ('uploading', 'processing', 'ready', 'failed')),
  error_msg   text,
  created_at  timestamptz not null default now()
);

-- Document chunks with vector embeddings
create table document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  content       text not null,
  embedding     vector(1536) not null,
  chunk_index   integer not null check (chunk_index >= 0),
  created_at    timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- HNSW index for fast cosine similarity search
create index on document_chunks
  using hnsw (embedding vector_cosine_ops);

-- Chat messages
create table chat_messages (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  session_id    text not null,
  role          text not null check (role in ('user', 'assistant')),
  content       text not null,
  created_at    timestamptz not null default now()
);

-- Index for efficient chat history retrieval
create index on chat_messages (document_id, session_id, created_at asc);
```

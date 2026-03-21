# Quickstart: PDF RAG Chatbox

**Last updated**: 2026-03-21

## Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project with pgvector enabled
- An OpenAI API key

---

## 1. Clone & Environment Setup

```bash
git clone <repo-url>
cd pdf-chatbox
```

### Backend `.env`

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
```

### Frontend `.env.local`

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 2. Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
create extension if not exists vector;

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

create table document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  content       text not null,
  embedding     vector(1536) not null,
  chunk_index   integer not null check (chunk_index >= 0),
  created_at    timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index on document_chunks using hnsw (embedding vector_cosine_ops);

create table chat_messages (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  session_id    text,                        -- nullable; reserved for future multi-session use
  role          text not null check (role in ('user', 'assistant')),
  content       text not null,
  created_at    timestamptz not null default now()
);

create index on chat_messages (document_id, created_at asc);
```

Also create a Supabase Storage bucket named `pdfs` (public: false) via the
Supabase dashboard → Storage → New bucket.

### Fix existing tables (if you already ran the original SQL)

If you previously ran the schema with `session_id text not null`, run this to make it nullable:

```sql
alter table chat_messages alter column session_id drop not null;
```

### Vector similarity search function

Run this in the SQL Editor to enable chunk retrieval:

```sql
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_document_id uuid,
  match_count int default 5
)
returns table (content text)
language sql stable
as $$
  select content
  from document_chunks
  where document_id = match_document_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## 3. Run the Backend

```bash
cd backend

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

## 4. Run the Frontend

```bash
cd frontend
npm install        # first time only
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 5. Verify Everything Works

1. Open `http://localhost:3000`
2. Upload a small PDF (< 5MB)
3. Wait for the status to change from "Processing" to "Ready" (< 30s for small files)
4. Click the document and ask a question about its contents
5. Verify the AI response references the document content

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Upload fails immediately | Wrong Supabase service key | Check `SUPABASE_SERVICE_KEY` in `backend/.env` |
| Status stays "processing" | Background task crashed | Check backend terminal for Python errors |
| AI responds with "I don't know" | Embedding search returning no results | Verify pgvector extension is enabled and HNSW index exists |
| CORS error in browser | Backend not running or wrong port | Ensure backend is running on port 8000 |
| "Scanned PDF" message | PDF is image-only | Use a text-based PDF; OCR not supported in v1 |

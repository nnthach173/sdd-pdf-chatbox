# API Contract: PDF RAG Chatbox

**Branch**: `001-pdf-rag-chatbox` | **Phase**: 1 | **Date**: 2026-03-21
**Base URL**: `http://localhost:8000` (dev) | `https://<render-app>.onrender.com` (prod)
**Content-Type**: `application/json` unless noted otherwise

---

## Documents

### POST /documents/upload

Upload and begin processing a PDF file.

**Request**
```
Content-Type: multipart/form-data

file: <binary PDF data>     required, max 50MB, must be application/pdf
```

**Response 200 OK**
```json
{
  "id": "uuid",
  "name": "report.pdf",
  "file_size": 1048576,
  "status": "processing",
  "created_at": "2026-03-21T10:00:00Z"
}
```

**Error Responses**

| Status | Code              | When                                      |
|--------|-------------------|-------------------------------------------|
| 400    | `invalid_file_type` | Uploaded file is not a PDF              |
| 400    | `file_too_large`  | File exceeds 50MB                         |
| 422    | `no_file`         | No file included in request              |
| 500    | `upload_failed`   | Supabase storage write failed            |

**Error body**
```json
{
  "error": "invalid_file_type",
  "message": "Only PDF files are supported. Please upload a .pdf file."
}
```

**Behaviour notes**:
- File is stored in Supabase Storage immediately
- Processing (extraction, chunking, embedding) runs asynchronously via FastAPI
  `BackgroundTasks`
- Document status starts as `processing` — client polls `GET /documents/{id}`
  or the list endpoint to detect when status becomes `ready` or `failed`

---

### GET /documents

List all uploaded documents.

**Response 200 OK**
```json
[
  {
    "id": "uuid",
    "name": "report.pdf",
    "file_size": 1048576,
    "page_count": 42,
    "status": "ready",
    "created_at": "2026-03-21T10:00:00Z"
  }
]
```
Returns an empty array `[]` when no documents exist.
Documents are ordered by `created_at DESC` (newest first).

---

### GET /documents/{id}

Get a single document by ID (used for status polling).

**Path params**: `id` — UUID of the document

**Response 200 OK**
```json
{
  "id": "uuid",
  "name": "report.pdf",
  "file_size": 1048576,
  "page_count": 42,
  "status": "ready",
  "error_msg": null,
  "created_at": "2026-03-21T10:00:00Z"
}
```

| Status | Code           | When                      |
|--------|----------------|---------------------------|
| 404    | `not_found`    | No document with that ID  |

---

### DELETE /documents/{id}

Permanently delete a document and all associated chunks and chat history.

**Path params**: `id` — UUID of the document

**Response 204 No Content** — empty body on success

| Status | Code           | When                      |
|--------|----------------|---------------------------|
| 404    | `not_found`    | No document with that ID  |
| 500    | `delete_failed`| Storage or DB delete failed |

---

## Chat

### POST /chat/{document_id}

Send a question about a document and receive a streamed AI response.

**Path params**: `document_id` — UUID of a document with `status = ready`

**Request**
```json
{
  "question": "What are the key findings in section 3?"
}
```

| Field      | Type   | Required | Notes                                      |
|------------|--------|----------|--------------------------------------------|
| `question` | string | yes      | User's question, non-empty, max 2000 chars |

**Response 200 OK — Streaming SSE**
```
Content-Type: text/event-stream
Cache-Control: no-cache

data: {"type": "token", "content": "The "}

data: {"type": "token", "content": "key "}

data: {"type": "token", "content": "findings..."}

data: {"type": "done", "content": ""}
```

Each `data:` line is a JSON object:

| Event type | When                          | `content` value              |
|------------|-------------------------------|------------------------------|
| `token`    | Each streamed token from LLM  | The token text               |
| `done`     | Stream complete               | Empty string                 |
| `error`    | Something went wrong          | Human-readable error message |

**Error Responses** (non-streaming, returned before stream opens)

| Status | Code                | When                                      |
|--------|---------------------|-------------------------------------------|
| 404    | `not_found`         | Document does not exist                   |
| 409    | `document_not_ready`| Document status is not `ready`            |
| 400    | `empty_question`    | Question is blank                         |
| 500    | `chat_failed`       | Embedding or LLM call failed              |

**Behaviour notes**:
- Before generating a response, the backend embeds the question and performs cosine
  similarity search to retrieve the top-5 most relevant chunks (D-003)
- Retrieved chunks + the last 6 chat messages (3 turns) are passed as context to
  `gpt-4o-mini`
- Both the user question and complete assistant response are saved to `chat_messages`
  after the stream completes — history is permanent and persists across browser sessions
- If retrieved chunks contain no relevant content, the LLM is instructed to state
  this clearly rather than drawing on general knowledge (Principle III)

---

### GET /chat/{document_id}/history

Retrieve the full persistent chat history for a document.

**Path params**: `document_id` — UUID of the document

**Response 200 OK**
```json
[
  {
    "id": "uuid",
    "role": "user",
    "content": "What are the key findings?",
    "created_at": "2026-03-21T10:05:00Z"
  },
  {
    "id": "uuid",
    "role": "assistant",
    "content": "The key findings include...",
    "created_at": "2026-03-21T10:05:03Z"
  }
]
```
Ordered by `created_at ASC`. Returns `[]` for a new session.

---

## Health

### GET /health

Liveness check — used by Render to verify the app is running.

**Response 200 OK**
```json
{ "status": "ok" }
```

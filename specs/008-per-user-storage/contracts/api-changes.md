# API Contract Changes: Per-User Isolated PDF Storage

**Feature**: 008-per-user-storage
**Base URL**: `http://localhost:8000` (dev) / `https://<backend>.railway.app` (prod)
**Date**: 2026-03-30

---

## New: Universal Request Header

All endpoints now require a user identity header:

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `X-User-ID` | `string` (UUID format) | **Yes** | Browser-local identity. Generated once per browser profile and stored in `localStorage['pdf-chatbox-user-id']`. |

**Missing or empty header response** (applies to all endpoints):

```
HTTP 400 Bad Request
Content-Type: application/json

{
  "detail": "Your session could not be identified. Please reload the page."
}
```

---

## Changed Endpoints

### POST /documents/upload

Upload a PDF file. The file is associated with the caller's `X-User-ID`.

**Request** (unchanged — multipart/form-data):
```
X-User-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
Content-Type: multipart/form-data

file: <PDF binary>
```

**Response 200** (unchanged shape):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "report.pdf",
  "file_size": 1048576,
  "status": "processing",
  "created_at": "2026-03-30T10:00:00Z"
}
```

**Behavior change**: The uploaded document is tagged with `owner_id = X-User-ID`. The file is stored at `pdfs/{owner_id}/{doc_id}/{filename}` (previously `pdfs/{doc_id}/{filename}`).

---

### GET /documents

List documents belonging to the caller only.

**Request**:
```
GET /documents
X-User-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response 200** (unchanged shape, filtered results):
```json
[
  {
    "id": "3fa85f64-...",
    "name": "report.pdf",
    "file_size": 1048576,
    "page_count": 12,
    "status": "ready",
    "created_at": "2026-03-30T10:00:00Z"
  }
]
```

**Behavior change**: Previously returned all documents in the database. Now returns only documents where `owner_id = X-User-ID`. A caller with no uploaded documents receives an empty array `[]`.

---

### GET /documents/{document_id}

Get details for a specific document. Returns 404 if the document does not belong to the caller.

**Request**:
```
GET /documents/3fa85f64-5717-4562-b3fc-2c963f66afa6
X-User-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response 200** (unchanged shape):
```json
{
  "id": "3fa85f64-...",
  "name": "report.pdf",
  "file_size": 1048576,
  "page_count": 12,
  "status": "ready",
  "error_msg": null,
  "signed_url": "https://...supabase.co/storage/v1/object/sign/pdfs/..."
}
```

**Response 404** (document not found OR belongs to another user — intentionally indistinguishable):
```json
{ "detail": "Document not found." }
```

---

### DELETE /documents/{document_id}

Delete a document. Returns 404 if the document does not belong to the caller.

**Request**:
```
DELETE /documents/3fa85f64-5717-4562-b3fc-2c963f66afa6
X-User-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response 204** No Content (success — unchanged)

**Response 404** (not found or not owned):
```json
{ "detail": "Document not found." }
```

---

### POST /chat/{document_id}

Stream a chat response for a document. Returns 404 if the document does not belong to the caller.

**Request**:
```
POST /chat/3fa85f64-5717-4562-b3fc-2c963f66afa6
X-User-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
Content-Type: application/json

{ "question": "What is the main conclusion?" }
```

**Response** (SSE stream — unchanged format):
```
data: {"type": "token", "content": "The "}
data: {"type": "token", "content": "main "}
...
data: {"type": "done", "content": ""}
```

**Response 404** (document not found or not owned):
```json
{ "detail": "Document not found." }
```

---

### GET /chat/{document_id}/history

Retrieve chat history for a document. Returns 404 if the document does not belong to the caller.

**Request**:
```
GET /chat/3fa85f64-5717-4562-b3fc-2c963f66afa6/history
X-User-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Response 200** (unchanged shape):
```json
[
  { "id": "...", "role": "user",      "content": "What is the conclusion?", "created_at": "..." },
  { "id": "...", "role": "assistant", "content": "The conclusion is...",    "created_at": "..." }
]
```

**Response 404** (document not found or not owned):
```json
{ "detail": "Document not found." }
```

---

## Frontend API Layer Changes

The `lib/api.ts` file must be updated to:

1. **Read identity on init**: On module load (or first call), read `localStorage['pdf-chatbox-user-id']`. If missing, generate with `crypto.randomUUID()` and save it.
2. **Inject header**: All fetch calls must include `'X-User-ID': userId` in their headers.

No URL structure changes. No new endpoints. No response shape changes.

---

## Unchanged

- All endpoint paths and HTTP methods
- All request/response JSON shapes
- Error response format (`{ "detail": "..." }`)
- SSE streaming protocol for chat
- `GET /health` endpoint (no user context needed)

# API Contracts: PDF Split-Panel View

**Branch**: `002-pdf-split-view` | **Date**: 2026-03-22

## Modified Endpoint

### GET /documents/{id}

Extended to include a `signed_url` field in the response alongside existing document metadata. No new endpoint is added. The frontend calls this single endpoint on page load to obtain both the document details and the signed PDF URL in one round-trip.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID string | The document ID |

**Success response** — `200 OK`

```json
{
  "id": "...",
  "name": "my-document.pdf",
  "file_size": 204800,
  "page_count": 12,
  "status": "ready",
  "created_at": "2026-03-22T10:00:00Z",
  "error_msg": null,
  "signed_url": "https://...supabase.co/storage/v1/object/sign/pdfs/...?token=..."
}
```

**New field**

| Field | Type | Description |
|-------|------|-------------|
| `signed_url` | `string \| null` | Authenticated URL valid for 3600 s. `null` when `status != "ready"`. |

**Error responses**

| Status | Error key | Condition |
|--------|-----------|-----------|
| 404 | `not_found` | Document ID does not exist in the database |
| 500 | `signed_url_failed` | Supabase Storage failed to generate the URL (document exists but URL generation failed) |

```json
{
  "error": "not_found",
  "message": "Document not found."
}
```

---

## Other Endpoints Used (unchanged)

| Method | Path | Used for |
|--------|------|----------|
| `GET` | `/chat/{documentId}/history` | Load prior chat messages on page mount |
| `POST` | `/chat/{documentId}` | Stream AI response to a new question |

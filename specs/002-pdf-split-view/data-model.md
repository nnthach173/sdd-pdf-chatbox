# Data Model: PDF Split-Panel View

**Branch**: `002-pdf-split-view` | **Date**: 2026-03-22

## No New Database Entities

This feature introduces no new database tables or columns. All data required (the document's `file_path` and metadata) already exists in the `documents` table from feature `001-pdf-rag-chatbox`.

## Existing Entity Used: Document

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Used to route the request and fetch document metadata |
| `file_path` | text | Storage path (`{doc_id}/{filename}`) passed to `create_signed_url()` |
| `name` | text | Displayed in the chat page header |
| `status` | text | If not `ready`, the PDF panel shows a processing message and polls every 5 s |
| `page_count` | integer \| null | Displayed in the header subtitle once processing completes |
| `error_msg` | text \| null | Surfaced in the chat page if processing failed |

## API Response Extension: DocumentDetail

The `DocumentDetail` schema (returned by `GET /documents/{id}`) gains one new field:

| Field | Type | Description |
|-------|------|-------------|
| `signed_url` | `string \| null` | Time-limited Supabase Storage URL for the PDF. `null` when `status != "ready"`. |

This field is **not stored in the database** — generated on demand by the backend on every call to `GET /documents/{id}`.

## Runtime-Only Artifacts

### Signed URL

Not stored in the database. Generated on demand by the backend and returned inline within the `GET /documents/{id}` response for the `react-pdf` `<Document>` component to load.

| Property | Value |
|----------|-------|
| Source | Supabase Storage `create_signed_url(file_path, 3600)` |
| TTL | 3600 seconds (1 hour) |
| Scope | Single document file |
| Delivery | Inline in `GET /documents/{id}` response as `signed_url` field |
| Value when not ready | `null` |

### Panel Width State

Not persisted anywhere. A single percentage value (20–80) held in React `useState` in the chat page component. Resets to 50 on every page load.

| Property | Value |
|----------|-------|
| Default | 50 (%) |
| Min | 20 (%) — either panel minimum |
| Max | 80 (%) — either panel maximum |
| Persistence | None — resets on reload |

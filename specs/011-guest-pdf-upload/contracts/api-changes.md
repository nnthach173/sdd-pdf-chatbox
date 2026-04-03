# API Contract Changes: Guest PDF Upload with Size Limit

**Feature**: 011-guest-pdf-upload
**Date**: 2026-04-03

## Authentication Scheme (Updated)

All document and chat endpoints now accept **either** of two authentication headers:

| Header | Value | User Type |
|--------|-------|-----------|
| `Authorization` | `Bearer <supabase-jwt>` | Authenticated user |
| `X-Guest-ID` | `<uuid-v4>` | Guest user (browser-local UUID) |

If neither header is present, or both are malformed, the server returns `401 Unauthorized`.

The `Authorization: Bearer` header takes precedence — if both are present, the JWT is validated and the `X-Guest-ID` is ignored.

---

## POST /documents/upload

**Auth**: `Authorization: Bearer <jwt>` OR `X-Guest-ID: <uuid>`

**Changed behavior for guests**:
- File size limit is **1,048,576 bytes (1 MB)** for requests authenticated with `X-Guest-ID`.
- File size limit remains 52,428,800 bytes (50 MB) for JWT-authenticated requests.
- Exceeding the guest limit returns:

```json
HTTP 413 Request Entity Too Large
{
  "error": "file_too_large_guest",
  "message": "File exceeds the 1 MB limit for guests. Sign in to upload files up to 50 MB."
}
```

All other validations (PDF type check, magic byte check) are unchanged.

---

## GET /documents

**Auth**: `Authorization: Bearer <jwt>` OR `X-Guest-ID: <uuid>`

No behavioral change. Returns documents owned by the resolved `owner_id` (whether auth user or guest UUID).

---

## GET /documents/{id}

**Auth**: `Authorization: Bearer <jwt>` OR `X-Guest-ID: <uuid>`

No behavioral change. Returns 404 if the document does not belong to the resolved `owner_id`.

---

## DELETE /documents/{id}

**Auth**: `Authorization: Bearer <jwt>` OR `X-Guest-ID: <uuid>`

No behavioral change. Guests can delete their own documents.

---

## POST /chat/{document_id}

**Auth**: `Authorization: Bearer <jwt>` OR `X-Guest-ID: <uuid>`

No behavioral change. Guests can chat with documents they own.

---

## GET /chat/{document_id}/history

**Auth**: `Authorization: Bearer <jwt>` OR `X-Guest-ID: <uuid>`

No behavioral change. Guests can retrieve chat history for their own documents.

---

## Endpoints NOT changed

The following endpoints remain JWT-only (no guest access):

| Endpoint | Reason |
|----------|--------|
| `GET /auth/me` | Auth-specific metadata endpoint |
| `POST /auth/*` | Auth flows have no guest equivalent |

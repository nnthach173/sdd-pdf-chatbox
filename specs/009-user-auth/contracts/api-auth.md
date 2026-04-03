# API Contract: Authentication Changes

**Branch**: `009-user-auth` | **Date**: 2026-04-03

## Authentication Header Change

### Before (008-per-user-storage)

All endpoints require:
```
X-User-ID: <browser-generated-uuid>
```

### After (009-user-auth)

All endpoints (except `/health`) require:
```
Authorization: Bearer <supabase-access-token>
```

The `X-User-ID` header is removed entirely.

## New Endpoint

### `GET /auth/me`

Returns the authenticated user's profile. Used by the frontend to verify the backend can read the token and to fetch display info.

**Request**:
```
GET /auth/me
Authorization: Bearer <access-token>
```

**Response 200**:
```json
{
  "id": "a1b2c3d4-...",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://lh3.googleusercontent.com/..."
}
```

**Response 401** (missing/invalid/expired token):
```json
{
  "error": "unauthorized",
  "message": "Please sign in to continue."
}
```

## Modified Endpoints

All existing endpoints change their authentication mechanism but not their request/response shapes.

### `POST /documents/upload`

- **Auth change**: `X-User-ID` header → `Authorization: Bearer` header
- **Behavior change**: `owner_id` extracted from verified JWT `user.id` instead of header value
- **Request/response**: Unchanged

### `GET /documents`

- **Auth change**: Same as above
- **Response 401** added for unauthenticated requests

### `GET /documents/{id}`

- **Auth change**: Same as above
- **Response 401** added for unauthenticated requests

### `DELETE /documents/{id}`

- **Auth change**: Same as above
- **Response 401** added for unauthenticated requests

### `POST /chat/{document_id}`

- **Auth change**: Same as above
- **Response 401** added for unauthenticated requests

### `GET /chat/{document_id}/history`

- **Auth change**: Same as above
- **Response 401** added for unauthenticated requests

## Error Response: 401 Unauthorized

All protected endpoints now return 401 when the token is missing, invalid, or expired:

```json
{
  "error": "unauthorized",
  "message": "Please sign in to continue."
}
```

This replaces the previous 400 error for missing `X-User-ID` header.

## Unchanged Endpoints

### `GET /health`

No authentication required. No changes.

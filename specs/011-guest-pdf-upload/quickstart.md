# Quickstart: Guest PDF Upload with Size Limit

**Feature**: 011-guest-pdf-upload
**Date**: 2026-04-03

## What Changes

Guests (unauthenticated users) gain full access to upload PDFs and chat with them. The only restriction: PDFs must be ≤ 1 MB for guests. Authenticated users see no change.

## Files to Change

### Backend

| File | Change |
|------|--------|
| `backend/models/schemas.py` | Add `is_guest: bool = False` to `UserProfile` |
| `backend/routers/dependencies.py` | Add `get_user_or_guest()` dependency |
| `backend/routers/documents.py` | Use `get_user_or_guest`; add `GUEST_MAX_FILE_SIZE`; enforce guest limit on upload |
| `backend/routers/chat.py` | Use `get_user_or_guest` on both endpoints |

### Frontend

| File | Change |
|------|--------|
| `frontend/lib/api.ts` | Add `requestHeaders()`, `getGuestId()`, `GUEST_MAX_FILE_SIZE`, `GUEST_ID_KEY` |
| `frontend/components/DocumentUpload.tsx` | Add `isGuest` prop; apply 1 MB limit + updated UI text for guests |
| `frontend/components/LibraryView.tsx` | Accept and pass through `isGuest` prop |
| `frontend/components/HomeClient.tsx` | Fix guest `onUpload` redirect; remove chat view auth gate; pass `isGuest` to `LibraryView` |

## Key Implementation Notes

### Guest UUID lifecycle (frontend)
`getGuestId()` in `api.ts`:
```
read 'guest-uuid' from localStorage
  → if missing: generate crypto.randomUUID(), write to localStorage, return it
  → if present: return it
```

### requestHeaders() (frontend)
```
getSession() from Supabase
  → if session.access_token exists: return { Authorization: `Bearer ${token}` }
  → else: return { 'X-Guest-ID': getGuestId() }
```

### get_user_or_guest() (backend)
```
if Authorization header starts with 'Bearer ':
  validate JWT via supabase.auth.get_user()
  return UserProfile(is_guest=False, ...)
elif X-Guest-ID header present and is valid UUID:
  return UserProfile(id=guest_uuid, email='', is_guest=True)
else:
  raise 401
```

### Guest upload size enforcement (backend)
```python
GUEST_MAX_FILE_SIZE = 1 * 1024 * 1024
# ...
if user.is_guest and len(file_bytes) > GUEST_MAX_FILE_SIZE:
    raise HTTPException(413, {"error": "file_too_large_guest", "message": "..."})
```

### DocumentUpload.tsx guest limit
- `isGuest` prop defaults to `false`
- `MAX_SIZE = isGuest ? GUEST_MAX_FILE_SIZE : 50 * 1024 * 1024`
- UI text for guests: `"Max file size 1 MB · Sign in to upload up to 50 MB"`
- Error for oversized guest file: `"File exceeds the 1 MB limit for guests. Sign in to upload larger files."`

### HomeClient.tsx fixes
1. `onUpload`: remove redirect-to-auth branch; always call `libraryViewRef.current?.triggerUpload()`
2. ChatView gate: remove the `isGuest` check that shows "Log in to view this document"; render `ChatView` unconditionally when `activeDocId` is set

## Test Checklist

- [ ] Guest uploads PDF < 1 MB → succeeds, chat works
- [ ] Guest uploads PDF > 1 MB → rejected immediately with clear error; retry works
- [ ] Guest uploads PDF = 1 MB exactly → succeeds
- [ ] Authenticated user uploads PDF > 1 MB → succeeds (no regression)
- [ ] Guest bypasses client check via direct API call with > 1 MB → server returns 413
- [ ] Guest returns to app in new tab → same UUID, same documents visible
- [ ] Authenticated user flow unchanged end-to-end

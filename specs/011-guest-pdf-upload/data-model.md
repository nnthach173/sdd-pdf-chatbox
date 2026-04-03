# Data Model: Guest PDF Upload with Size Limit

**Feature**: 011-guest-pdf-upload
**Date**: 2026-04-03

## Changed Entities

### UserProfile (backend schema)

The existing `UserProfile` Pydantic model gains one field.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `str` | — | UUID. For guests: the browser-local UUID from `X-Guest-ID`. For auth users: Supabase Auth user ID. |
| `email` | `str` | — | Email address. Empty string `""` for guest users. |
| `display_name` | `Optional[str]` | `None` | Display name. `None` for guest users. |
| `avatar_url` | `Optional[str]` | `None` | Avatar URL. `None` for guest users. |
| `is_guest` | `bool` | `False` | **NEW.** `True` when the user was identified by `X-Guest-ID` header, not by JWT. |

No database schema changes. The `documents` table already uses `owner_id UUID` — guest documents continue to use the browser-local UUID as the owner, identical to the 008 per-user-storage behavior.

---

## New Constants

### Backend (`backend/routers/documents.py`)

| Constant | Value | Meaning |
|----------|-------|---------|
| `GUEST_MAX_FILE_SIZE` | `1 * 1024 * 1024` (1,048,576 bytes) | Maximum PDF size for unauthenticated (guest) users. |
| `MAX_FILE_SIZE` | `50 * 1024 * 1024` (52,428,800 bytes) | Maximum PDF size for authenticated users (unchanged). |

### Frontend (`frontend/lib/api.ts`)

| Constant | Value | Meaning |
|----------|-------|---------|
| `GUEST_MAX_FILE_SIZE` | `1 * 1024 * 1024` | Re-exported so `DocumentUpload` can use it without duplicating the value. |
| `GUEST_ID_KEY` | `'guest-uuid'` | `localStorage` key for the browser-local guest UUID. |

---

## State Transitions

No new state transitions. The guest upload follows the same document lifecycle as authenticated uploads:

```
file selected → [client validates size/type] → uploading → processing → ready
                                            ↘ rejected (guest > 1 MB)
```

Guest documents persist across sessions via the browser-local UUID — returning to the same browser restores access to previously uploaded documents (see clarification session 2026-04-03).

# Quickstart: Per-User Isolated PDF Storage

**Feature**: 008-per-user-storage
**Date**: 2026-03-30

---

## Prerequisites

- Backend and frontend running (see root README)
- Supabase project accessible
- `.env` files configured for backend

---

## Step 1: Database Migration

Run the following SQL in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query):

```sql
-- Step 1: Add owner_id column with a temporary default to handle existing rows
ALTER TABLE documents
  ADD COLUMN owner_id TEXT NOT NULL DEFAULT '';

-- Step 2: Clear existing data (recommended for local dev — all existing files are now orphaned anyway)
TRUNCATE documents CASCADE;
-- CASCADE also clears document_chunks and chat_messages

-- Step 3: Remove the default so future inserts must supply owner_id explicitly
ALTER TABLE documents ALTER COLUMN owner_id DROP DEFAULT;

-- Step 4: Add index for efficient owner-scoped list queries
CREATE INDEX IF NOT EXISTS idx_documents_owner_id
  ON documents (owner_id, created_at DESC);
```

> **Warning**: `TRUNCATE documents CASCADE` permanently deletes all documents and their associated chunks and chat messages. Only run this in a development environment where data loss is acceptable.

---

## Step 2: Restart the Backend

No additional environment variables are required. Restart to pick up code changes:

```bash
cd backend
uvicorn main:app --reload
```

---

## Step 3: Verify Isolation

### Test A — Same browser, different tabs (should share files)

1. Open `http://localhost:3000` in a normal browser tab.
2. Upload a PDF. Note its name appears in the list.
3. Open a **second tab** at `http://localhost:3000`.
4. **Expected**: The same PDF appears in the list (same `localStorage` identity = same owner).

### Test B — Incognito window (should be isolated)

1. Open `http://localhost:3000` in a **normal** browser window and upload a PDF.
2. Open `http://localhost:3000` in an **incognito** window.
3. **Expected**: The file list is empty — incognito has its own `localStorage`, so a new UUID is generated.
4. Upload a different PDF in the incognito window.
5. Switch back to the normal window — the incognito file should NOT appear there.

### Test C — Verify header in DevTools

1. Open DevTools → Network tab.
2. Navigate to `http://localhost:3000`.
3. Observe any request to `http://localhost:8000/documents`.
4. **Expected**: Request headers include `x-user-id: <some UUID>`.

### Test D — Manual API test (curl)

```bash
# Using a known user ID
USER_ID="f47ac10b-58cc-4372-a567-0e02b2c3d479"

# Upload a file
curl -X POST http://localhost:8000/documents/upload \
  -H "X-User-ID: $USER_ID" \
  -F "file=@/path/to/test.pdf"

# List documents (should see the uploaded file)
curl http://localhost:8000/documents \
  -H "X-User-ID: $USER_ID"

# List documents with a different user ID (should return empty array)
curl http://localhost:8000/documents \
  -H "X-User-ID: 00000000-0000-0000-0000-000000000001"
```

### Test E — Missing header returns 400

```bash
curl http://localhost:8000/documents
# Expected: 400 {"detail": "Your session could not be identified. Please reload the page."}
```

---

## Troubleshooting

**Files disappear after clearing browser data**: This is expected behaviour. Clearing `localStorage` removes the user's identity, so a new UUID is generated on next visit. The old files exist in Supabase Storage and the database but are no longer accessible via the app (orphaned). This is documented in the spec as accepted behaviour.

**"Your session could not be identified" error**: The frontend did not send the `X-User-ID` header. Check that `localStorage['pdf-chatbox-user-id']` exists in the browser console and that `lib/api.ts` is sending it on all requests.

**Existing files no longer visible after migration**: Run `TRUNCATE documents CASCADE` as described in Step 1. Old files stored under `{doc_id}/{filename}` paths in Supabase Storage are now stale and can be deleted manually via the Supabase Storage dashboard.

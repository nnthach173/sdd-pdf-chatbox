# Tasks: Per-User Isolated PDF Storage

**Input**: Design documents from `/specs/008-per-user-storage/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api-changes.md ✅ · quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every description

---

## Phase 1: Setup (Database Migration)

**Purpose**: Apply the schema change to Supabase before any code runs. This is a manual step.

- [x] T001 Run database migration SQL in Supabase SQL Editor: add `owner_id TEXT NOT NULL DEFAULT ''` to `documents`, create index `idx_documents_owner_id`, truncate existing data with `TRUNCATE documents CASCADE`, then drop the default — full SQL in `specs/008-per-user-storage/data-model.md`

**Checkpoint**: `documents` table has `owner_id` column and `idx_documents_owner_id` index. Existing rows are cleared.

---

## Phase 2: Foundational (Shared Backend Dependency)

**Purpose**: Create the reusable FastAPI `Header` dependency that extracts and validates `X-User-ID` from every request. All backend routes depend on this.

**⚠️ CRITICAL**: No user story backend work can begin until this phase is complete.

- [x] T002 Create `backend/routers/dependencies.py` with a `get_owner_id` FastAPI dependency function that reads the `X-User-ID` header (using `Header(...)`) and raises `HTTPException(status_code=400, detail="Your session could not be identified. Please reload the page.")` if the value is missing or empty — returns the owner ID string on success

**Checkpoint**: `get_owner_id` is importable and can be injected into any FastAPI route via `Depends(get_owner_id)`.

---

## Phase 3: User Story 1 — Private PDF Library Per Browser (Priority: P1) 🎯 MVP

**Goal**: Files uploaded in one browser are completely invisible to any other browser, device, or incognito window. Every document is owned by exactly one `X-User-ID`.

**Independent Test**: Upload 2 PDFs in a normal browser tab. Open incognito. Verify incognito shows an empty file list. Verify curl with a different `X-User-ID` value also returns `[]`. See `quickstart.md` Test B and Test D.

### Implementation for User Story 1

- [x] T003 [US1] Update `GET /documents` route in `backend/routers/documents.py`: inject `owner_id: str = Depends(get_owner_id)` and add `.eq("owner_id", owner_id)` filter to the Supabase query so only the caller's documents are returned
- [x] T004 [P] [US1] Update `POST /documents/upload` route in `backend/routers/documents.py`: inject `owner_id = Depends(get_owner_id)`, include `owner_id` in the `documents` insert payload, and change the Supabase Storage upload path from `{doc_id}/{filename}` to `{owner_id}/{doc_id}/{filename}` — update the `file_path` value stored in the DB accordingly
- [x] T005 [P] [US1] Update `GET /documents/{document_id}` route in `backend/routers/documents.py`: inject `owner_id = Depends(get_owner_id)`, fetch the document, and raise `HTTPException(status_code=404, detail="Document not found.")` if the document's `owner_id` does not match the caller's — do NOT return a 403 (intentional: avoids confirming the resource exists)
- [x] T006 [P] [US1] Update `DELETE /documents/{document_id}` route in `backend/routers/documents.py`: inject `owner_id = Depends(get_owner_id)`, fetch the document first, and raise `HTTPException(status_code=404, detail="Document not found.")` if `owner_id` does not match — only proceed with delete if ownership confirmed
- [x] T007 [US1] Update both routes in `backend/routers/chat.py` (`POST /chat/{document_id}` and `GET /chat/{document_id}/history`): inject `owner_id = Depends(get_owner_id)`, fetch the parent document at the start of each handler, and raise `HTTPException(status_code=404, detail="Document not found.")` if the document's `owner_id` does not match the caller's before any chat processing occurs
- [x] T008 [US1] Update `frontend/lib/api.ts`: add an `initUserId()` function that reads `localStorage['pdf-chatbox-user-id']`, generates a new UUID via `crypto.randomUUID()` if absent, saves it back to `localStorage`, and returns the string — call this function once at module load to set a module-level `userId` constant — add `'X-User-ID': userId` to the headers of every existing `fetch` call in the file (`uploadDocument`, `listDocuments`, `getDocument`, `deleteDocument`, `getChatHistory`, `streamChat`)

**Checkpoint**: User Story 1 is fully functional. Uploading in Browser A and checking in incognito returns an empty list. `curl` with different `X-User-ID` values returns independent document lists.

---

## Phase 4: User Story 2 — Session Persistence Within Same Browser (Priority: P2)

**Goal**: A visitor's identity and files survive tab close and browser restart within the same browser profile.

**Independent Test**: Upload a PDF, close the browser entirely, reopen and navigate to the app. The uploaded file must still appear in the list without re-uploading. See `quickstart.md` Test A.

**Note**: US2 is automatically delivered by the Phase 3 implementation. `localStorage` natively persists across tab closes and browser restarts. The task here confirms the correct storage API is used and adds a clarifying comment.

### Implementation for User Story 2

- [x] T009 [US2] Review `frontend/lib/api.ts` (written in T008): confirm that `localStorage` is used (not `sessionStorage`) for `pdf-chatbox-user-id` — add a brief inline comment on the `localStorage` call explaining that `localStorage` is intentional because it persists across browser restarts, unlike `sessionStorage`

**Checkpoint**: User Story 2 verified. Closing and reopening the browser preserves the visitor's file list.

---

## Phase 5: User Story 3 — Clean Slate in Incognito / New Browser (Priority: P3)

**Goal**: Opening the app in an incognito window or on a new device produces an empty workspace with no data from other sessions.

**Independent Test**: Open incognito. Verify empty file list. Upload a file in incognito. Switch to normal browser. Verify the incognito file does NOT appear. See `quickstart.md` Test B.

**Note**: US3 is automatically delivered by the Phase 3 implementation. Incognito and new browsers start with empty `localStorage`, so `initUserId()` generates a fresh UUID. The task here confirms the initialization handles "no prior key" cleanly.

### Implementation for User Story 3

- [x] T010 [US3] Review `frontend/lib/api.ts` `initUserId()` (written in T008): confirm the function handles the case where `localStorage['pdf-chatbox-user-id']` returns `null` or `undefined` by branching to `crypto.randomUUID()` — add a brief inline comment noting that this path is taken in incognito windows and new browsers (clean slate)

**Checkpoint**: User Story 3 verified. Incognito and new browsers start with a fresh identity and empty file list.

---

## Phase 6: Polish & End-to-End Validation

**Purpose**: Run the quickstart validation suite to confirm all three user stories pass together.

- [ ] T011 [P] Run quickstart.md Test A (same-browser tabs share files), Test B (incognito isolation), Test C (DevTools header check), Test D (curl isolation with different X-User-ID values), and Test E (missing header returns 400) — all five tests must pass
- [ ] T012 [P] Verify Supabase Storage in the dashboard: confirm new uploads appear under `pdfs/{owner_id}/{doc_id}/` path structure (not the old `pdfs/{doc_id}/` structure)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run immediately (manual Supabase SQL step)
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all backend user story work
- **User Stories (Phase 3–5)**: Depend on Phase 2 completion
  - US1 (Phase 3) must complete before US2 (Phase 4) and US3 (Phase 5) can be verified
  - US2 and US3 phases are verification-only: no new code beyond what US1 produces
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. Delivers core isolation. Required before US2/US3 can be verified.
- **US2 (P2)**: Starts after US1 complete. No new code — review + comment only.
- **US3 (P3)**: Starts after US1 complete. No new code — review + comment only.

### Within Phase 3 (US1)

- T002 (Foundational) must complete first
- T003 → sequential (sets up list filter; safe to do first)
- T004, T005, T006 → can run in parallel [P] (all different routes in documents.py but independent edits)
- T007 → can start in parallel with T003–T006 [P] (different file: chat.py)
- T008 → can run in parallel with T003–T007 [P] (different codebase: frontend/lib/api.ts)

### Parallel Opportunities

```bash
# After T002 completes, launch in parallel:
Task T003: Update GET /documents in backend/routers/documents.py
Task T004: Update POST /documents/upload in backend/routers/documents.py
Task T005: Update GET /documents/{id} in backend/routers/documents.py
Task T006: Update DELETE /documents/{id} in backend/routers/documents.py
Task T007: Update both chat routes in backend/routers/chat.py
Task T008: Update frontend/lib/api.ts (completely separate file)

# After T011 passes, launch in parallel:
Task T009: Review localStorage usage in frontend/lib/api.ts
Task T010: Review initUserId() in frontend/lib/api.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Supabase migration — ~5 minutes)
2. Complete Phase 2: Foundational (`dependencies.py` — ~10 minutes)
3. Complete Phase 3: User Story 1 (6 tasks across 3 files — ~30 minutes)
4. **STOP and VALIDATE**: Run quickstart.md Test B and Test D
5. US1 delivers full isolation — app is ready to use

### Incremental Delivery

1. Phase 1 + Phase 2 + Phase 3 → **Full isolation live** (MVP — all three user stories implicitly satisfied)
2. Phase 4 → Confirm + document persistence behaviour
3. Phase 5 → Confirm + document clean-slate behaviour
4. Phase 6 → Full validation suite passes

### Files Changed (Complete List)

| File | Change |
|------|--------|
| `backend/routers/dependencies.py` | **New file** — `get_owner_id` FastAPI dependency |
| `backend/routers/documents.py` | Add `Depends(get_owner_id)` to 4 routes; filter/tag queries; change storage path |
| `backend/routers/chat.py` | Add `Depends(get_owner_id)` to 2 routes; verify document ownership |
| `frontend/lib/api.ts` | Add `initUserId()`; inject `X-User-ID` header on all 6 API calls |

---

## Notes

- [P] tasks = touch different files, no unresolved dependencies — safe to parallelize
- Each user story phase is independently verifiable (US1 especially: upload + incognito check)
- US2 and US3 require no new implementation beyond US1 — they are behaviours of `localStorage`
- Commit after Phase 2 (foundation) and again after Phase 3 (US1 complete) at minimum
- If the Supabase dashboard is not accessible for migration, the backend will error on insert (missing NOT NULL column) — Phase 1 is a hard prerequisite

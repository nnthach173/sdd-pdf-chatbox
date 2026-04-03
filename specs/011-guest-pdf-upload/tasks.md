# Tasks: Guest PDF Upload with Size Limit

**Input**: Design documents from `/specs/011-guest-pdf-upload/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

No project initialization required — this feature modifies existing files only. Proceed directly to foundational work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Guest identity infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until T001–T003 are complete.

- [x] T001 Add `is_guest: bool = False` field to `UserProfile` in `backend/models/schemas.py`
- [x] T002 Add `get_user_or_guest()` dependency to `backend/routers/dependencies.py` — accepts `Authorization: Bearer <jwt>` (try first) OR `X-Guest-ID: <uuid>` header; returns `UserProfile` with `is_guest=True` for UUID path; raises 401 if neither header is valid (depends on T001)
- [x] T003 [P] Add guest identity helpers to `frontend/lib/api.ts`: add `GUEST_ID_KEY = 'guest-uuid'` and `GUEST_MAX_FILE_SIZE = 1 * 1024 * 1024` constants; add `getGuestId()` (reads/creates UUID in localStorage); add `requestHeaders()` (tries Supabase session first, falls back to `{ 'X-Guest-ID': getGuestId() }`); replace all `authHeaders()` calls in the file with `requestHeaders()`

**Checkpoint**: Guest identity plumbing is in place. Backend can identify guests; frontend can send guest credentials. User story implementation can begin.

---

## Phase 3: User Story 1 — Guest Uploads a PDF and Chats (Priority: P1) 🎯 MVP

**Goal**: A guest user can upload a PDF (any size up to the existing limits) and chat with it — without being redirected to the login page.

**Independent Test**: Open the app without logging in → upload any small PDF → verify the chat interface is accessible and responds to a question about the document.

- [x] T004 [P] [US1] Update `backend/routers/documents.py` — replace all four `Depends(get_authenticated_user)` occurrences (upload, list, get, delete) with `Depends(get_user_or_guest)`; update import accordingly (depends on T002)
- [x] T005 [P] [US1] Update `backend/routers/chat.py` — replace both `Depends(get_authenticated_user)` occurrences (chat and history endpoints) with `Depends(get_user_or_guest)`; update import accordingly (depends on T002)
- [x] T006 [US1] Update `frontend/components/HomeClient.tsx` — (1) change `onUpload` so both `isGuest === true` and `isGuest === null` call `libraryViewRef.current?.triggerUpload()`, removing the `/auth` redirect branch; (2) remove the `isGuest` conditional that renders "Log in to view this document" for guests in the ChatView slot — render `<ChatView>` unconditionally when `activeDocId` is set; (3) add `isGuest={isGuest ?? false}` prop to `<LibraryView>` (depends on T003)
- [x] T007 [US1] Update `frontend/components/LibraryView.tsx` — add `isGuest?: boolean` to the `Props` interface; forward it as `isGuest={isGuest}` on the `<DocumentUpload>` element (depends on T006)
- [x] T008 [US1] Update `frontend/components/DocumentUpload.tsx` — add `isGuest?: boolean` to the `Props` interface (defaulting to `false`); no size-limit logic change in this task (that is US2/T010) (depends on T007)

**Checkpoint**: Guests can now upload a PDF and chat. The sidebar upload button works. The chat view is visible after selecting a document. Auth users are unaffected.

---

## Phase 4: User Story 2 — Guest Exceeds the 1 MB File Size Limit (Priority: P2)

**Goal**: When a guest selects a PDF larger than 1 MB, the upload is blocked immediately with a clear, actionable error message. The guest can retry with a smaller file.

**Independent Test**: Without logging in, attempt to upload a PDF > 1 MB → verify an error message appears instantly (no server call) stating the 1 MB limit and suggesting sign-in → dismiss the error → upload a PDF < 1 MB → verify it succeeds.

- [x] T009 [US2] Update `backend/routers/documents.py` — add `GUEST_MAX_FILE_SIZE = 1 * 1024 * 1024` constant directly below `MAX_FILE_SIZE`; in `upload_document`, add a guest size guard after `file_bytes = await file.read()` and before the `MAX_FILE_SIZE` check: `if user.is_guest and len(file_bytes) > GUEST_MAX_FILE_SIZE: raise HTTPException(status_code=413, detail={"error": "file_too_large_guest", "message": "File exceeds the 1 MB limit for guests. Sign in to upload files up to 50 MB."})` (depends on T004)
- [x] T010 [US2] Update `frontend/components/DocumentUpload.tsx` — in `validate()`: compute `const maxSize = isGuest ? GUEST_MAX_FILE_SIZE : 50 * 1024 * 1024` and use it for the size check; update the error string for oversized guest files to read `"File exceeds the 1 MB limit for guests. Sign in to upload larger files."`; update the `<p>` description text below the upload button to show `"Max file size 1 MB for guests · Sign in to upload up to 50 MB."` when `isGuest` is true, and the original `"Upload PDF documents to transform them into interactive knowledge artifacts. Max file size 50 MB."` otherwise; import `GUEST_MAX_FILE_SIZE` from `@/lib/api` (depends on T008)

**Checkpoint**: Guests see the 1 MB limit before uploading. Oversized files are rejected instantly with a clear error message and a path to sign in. Retrying with a smaller file works without a page reload.

---

## Phase 5: User Story 3 — Logged-In User Faces No New Restrictions (Priority: P3)

**Goal**: Verify authenticated users are unaffected — they still upload PDFs up to 50 MB with no size error, and all existing behavior is intact.

**Independent Test**: Log in → upload a PDF between 1 MB and 50 MB → verify it uploads and processes successfully with no rejection.

- [x] T011 [US3] Verify `backend/routers/documents.py` — confirm the upload endpoint guard reads `if user.is_guest and len(file_bytes) > GUEST_MAX_FILE_SIZE` (not simply `len(file_bytes) > GUEST_MAX_FILE_SIZE`); confirm `is_guest` is `False` for JWT-authenticated users by tracing `get_user_or_guest()` in `backend/routers/dependencies.py`; no code change expected — this is a correctness review task
- [x] T012 [P] [US3] Verify `frontend/components/DocumentUpload.tsx` — confirm `isGuest` defaults to `false` in the `Props` interface; confirm `validate()` uses `50 * 1024 * 1024` when `isGuest` is `false`; confirm the description text falls through to the original "50 MB" copy for auth users; no code change expected — correctness review task

**Checkpoint**: Logged-in users are confirmed unaffected. All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T013 Run all 7 test scenarios from `specs/011-guest-pdf-upload/quickstart.md` test checklist manually to confirm end-to-end correctness across all user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Foundational (T001–T003). T004 and T005 can run in parallel with each other. T006 → T007 → T008 must be sequential (prop chain).
- **US2 (Phase 4)**: T009 depends on T004 (US1 switched the endpoint). T010 depends on T008 (US1 added the prop).
- **US3 (Phase 5)**: Depends on T009 (US2 enforcement) and T010 (US2 frontend) being complete.
- **Polish (Phase 6)**: Depends on all prior phases.

### User Story Dependencies

- **US1 (P1)**: Unblocked after Foundational completes
- **US2 (P2)**: Depends on US1 (T004, T008) being complete
- **US3 (P3)**: Depends on US2 (T009, T010) being complete — purely a correctness verification

### Within Each User Story

- Backend tasks (T004, T005) are parallel; frontend prop-chain (T006 → T007 → T008) is sequential
- US2 backend (T009) and frontend (T010) can run in parallel once their US1 prerequisites are met

### Parallel Opportunities

```bash
# Foundational — T003 runs in parallel with T001+T002 (frontend vs backend):
Task: "T001 — backend/models/schemas.py: add is_guest"
Task: "T003 — frontend/lib/api.ts: guest identity helpers"
# (T002 must wait for T001)

# US1 backend — T004 and T005 in parallel:
Task: "T004 — backend/routers/documents.py: switch to get_user_or_guest"
Task: "T005 — backend/routers/chat.py: switch to get_user_or_guest"

# US3 verification — T011 and T012 in parallel:
Task: "T011 — verify backend guest guard is scoped to is_guest"
Task: "T012 — verify frontend defaults to 50 MB for auth users"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001–T003)
2. Complete Phase 3: User Story 1 (T004–T008)
3. **STOP and VALIDATE**: Guest can upload and chat. No auth gate.
4. Ship if US1 alone delivers sufficient value.

### Incremental Delivery

1. Foundational → US1 (guests unblocked) → Demo
2. US2 (size limit enforcement) → Demo
3. US3 verification → Ship

---

## Notes

- [P] tasks touch different files with no blocking dependencies — safe to run in parallel
- T006 is the most impactful single task: it removes both frontend guest blockers
- T009 + T010 together enforce the 1 MB guarantee on both server and client (per clarification Q1)
- T011 and T012 are review-only — no code changes expected; they exist to explicitly validate the US3 acceptance scenario before the feature is considered done

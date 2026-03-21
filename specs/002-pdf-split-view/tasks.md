# Tasks: PDF Split-Panel View

**Input**: Design documents from `/specs/002-pdf-split-view/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅ · quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared state dependency)
- **[Story]**: Which user story this task belongs to (US1, US1b, US2, US3)

---

## Phase 1: Setup

**Purpose**: Install the one new dependency this feature requires.

- [x] T001 Add `react-pdf` to `frontend/package.json` and run `npm install` in `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared `DocumentDetail` type on both sides of the API boundary. These changes must land before any user story work can begin — they unblock backend, frontend, and component tasks simultaneously.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `signed_url: Optional[str] = None` field to `DocumentDetail` in `backend/models/schemas.py`
- [x] T003 [P] Add `signed_url: string | null` field to `DocumentDetail` interface in `frontend/lib/api.ts`

**Checkpoint**: Both sides of the API contract now know about `signed_url`. Backend and frontend story tasks can begin in parallel.

---

## Phase 3: User Story 1 — View PDF Alongside Chat (Priority: P1) 🎯 MVP

**Goal**: Replace the single-column chat page layout with a side-by-side split panel — PDF on the left, chat on the right — each scrolling independently. The backend generates a signed URL on every page load; the frontend consumes it via `react-pdf`.

**Independent Test**: Navigate to any `ready` document's chat page → confirm the PDF renders in the left panel within 3 s → confirm the chat interface is visible in the right panel → scroll each panel independently and verify the other does not move.

### Implementation

- [x] T004 [P] [US1] Extend `get_document()` in `backend/routers/documents.py` — after the existing 404 check, if `doc["status"] == "ready"` call `db.storage.from_("pdfs").create_signed_url(doc["file_path"], 3600)` and set `signed_url = result["signedURL"]`; otherwise leave `signed_url = None`; update the `DocumentDetail(**rows.data[0])` construction to pass the computed `signed_url`

- [x] T005 [P] [US1] Create `frontend/components/PdfViewer.tsx` — `'use client'` component accepting `signedUrl: string` prop; at module level set `pdfjs.GlobalWorkerOptions.workerSrc = \`//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs\``; import `AnnotationLayer.css` and `TextLayer.css`; render `<Document file={signedUrl} onLoadSuccess={({numPages}) => setNumPages(numPages)} onLoadError={() => setError(true)} loading={<LoadingSpinner />}>` with one `<Page pageNumber={n} width={containerWidth} />` per page in a scrollable column; on error show plain-language message ("Could not display this PDF.") and `<a href={signedUrl} download className="...">Download PDF</a>`

- [x] T006 [US1] Rewrite the layout in `frontend/app/chat/[documentId]/page.tsx` — replace the outer `flex-col h-screen` container with `flex-row h-screen overflow-hidden`; add a left panel `<div className="overflow-y-auto h-full">` that renders `<PdfViewer signedUrl={doc.signed_url!} />` when `doc.status === 'ready'`, or a processing message ("Document is still processing…") with a status indicator when not ready; keep the right panel `<div className="overflow-y-auto h-full flex flex-col">` rendering `<ChatInterface>`; add a `setInterval` (5 000 ms) when `doc.status !== 'ready'` that calls `getDocument(documentId)` and updates `doc` state, clearing itself when status becomes `'ready'`; keep the existing header (back button, document name)

**Checkpoint**: US1 is independently functional — PDF renders alongside chat, both panels scroll without affecting each other.

---

## Phase 4: User Story 1b — Resize Panels by Dragging (Priority: P1)

**Goal**: Add a draggable vertical divider between the two panels. Default split is 50/50. Drag range is clamped to [20%, 80%]. Proportions reset to 50/50 on page reload. No keyboard support required.

**Independent Test**: Load the chat page → drag the divider right → confirm both panels resize in real time → drag past 80/20 → confirm divider stops → reload → confirm panels return to 50/50.

### Implementation

- [x] T007 [US1b] Create `frontend/components/PanelDivider.tsx` — accept `onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void` prop; render `<div onMouseDown={onMouseDown} className="w-1 flex-shrink-0 bg-border cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors" />`; no internal state — all drag logic lives in the parent

- [x] T008 [US1b] Add drag-resize state to `frontend/app/chat/[documentId]/page.tsx` — add `leftPct` state (default `50`); add `containerRef` on the outer flex container; implement `handleDividerMouseDown`: on `mousedown` add `mousemove` and `mouseup` listeners to `document`, in `mousemove` compute `pct = ((e.clientX - containerRef.current.getBoundingClientRect().left) / containerRef.current.getBoundingClientRect().width) * 100` clamped to `[20, 80]` and call `setLeftPct(pct)`, in `mouseup` remove both listeners; add the same logic for `touchstart`/`touchmove`/`touchend` using `e.touches[0].clientX`; apply `style={{ width: \`${leftPct}%\` }}` to the left panel and `style={{ width: \`${100 - leftPct}%\` }}` to the right panel; render `<PanelDivider onMouseDown={handleDividerMouseDown} />` between the two panels

**Checkpoint**: US1 + US1b are both functional — drag-to-resize works within 20/80 limits and resets on reload.

---

## Phase 5: User Story 2 — Secure PDF Display (Priority: P2)

**Goal**: Ensure the signed URL flow is hardened — generation failure returns a structured error rather than an unhandled exception, and the frontend's existing error path surfaces the backend message to the user.

**Independent Test**: Open the chat page for a ready document → confirm PDF loads without any manual auth prompt → reload → confirm a fresh URL is used (the page refetches the document on mount) → simulate Supabase storage failure (temporarily use an invalid bucket name in `.env`) → confirm a readable error message appears.

### Implementation

- [x] T009 [US2] Add try/except around `create_signed_url` in `backend/routers/documents.py` — wrap the storage call added in T004 with `try: ... except Exception: raise HTTPException(status_code=500, detail={"error": "signed_url_failed", "message": "Could not generate a secure access link for this document. Please try again."})` so a storage failure returns a structured 500 rather than an unhandled crash

**Checkpoint**: US2 is complete — all three acceptance scenarios pass: silent auth, fresh URL on reload, and readable error on storage failure.

---

## Phase 6: User Story 3 — Mobile-Friendly Stacked Layout (Priority: P3)

**Goal**: On screens narrower than 768 px, stack the PDF panel above the chat panel in a single-column layout. The drag divider is hidden on mobile. No resize controls are available on mobile.

**Independent Test**: Open the chat page with a viewport narrower than 768 px → confirm the PDF panel appears above the chat panel → scroll down to confirm the chat panel is fully accessible → confirm no drag divider is visible.

### Implementation

- [x] T010 [US3] Add responsive layout classes to `frontend/app/chat/[documentId]/page.tsx` — change outer container from `flex-row` to `flex-col md:flex-row`; add `w-full h-[50vh] md:h-full md:overflow-y-auto` to the left (PDF) panel so it has a fixed height on mobile and auto-overflow on desktop; add `w-full flex-1 md:overflow-y-auto` to the right (chat) panel; add `hidden md:block` to `<PanelDivider>` to suppress it on mobile; verify `overflow-y-auto` on the outer page body allows full-page scrolling on mobile to reach the chat panel below the PDF

**Checkpoint**: All three priority levels complete — the full feature works on desktop (split + drag) and mobile (stacked).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Format enforcement and end-to-end validation.

- [x] T011 [P] Run `black backend/` and verify no formatting changes remain uncommitted in `backend/models/schemas.py` and `backend/routers/documents.py`

- [x] T012 [P] Run `npx prettier --write frontend/components/PdfViewer.tsx frontend/components/PanelDivider.tsx frontend/app/chat/\[documentId\]/page.tsx frontend/lib/api.ts` and verify output is clean

- [ ] T013 Execute all 7 validation scenarios in `specs/002-pdf-split-view/quickstart.md` — PDF renders, independent scroll, drag resize with limit enforcement, reload resets to 50/50, chat still works, error state on offline, mobile stacked layout at 375 px viewport

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Phase 2 — T004 and T005 can run in parallel; T006 depends on T004 and T005
- **US1b (Phase 4)**: Depends on T006 (layout must exist to integrate divider)
- **US2 (Phase 5)**: Depends on T004 (hardening the same function); can overlap with US1b in parallel
- **US3 (Phase 6)**: Depends on T008 (divider must exist to hide it on mobile)
- **Polish (Phase 7)**: Depends on all story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependency on other stories
- **US1b (P1)**: Starts after T006 — depends on US1 layout being in place
- **US2 (P2)**: Starts after T004 — hardens the same backend function; can run in parallel with US1b
- **US3 (P3)**: Starts after T008 — adds responsive classes to the completed layout

### Parallel Opportunities per Story

**Phase 2 (Foundational)**:
- T002 (backend schema) and T003 (frontend api.ts) can run in parallel — different files, no shared dependency

**Phase 3 (US1)**:
- T004 (backend endpoint) and T005 (PdfViewer component) can run in parallel — different codebases
- T006 must wait for both T004 and T005

**Phase 7 (Polish)**:
- T011 (black) and T012 (prettier) can run in parallel — different directories

---

## Implementation Strategy

### MVP First (US1 + US1b Only)

1. Complete Phase 1: Install react-pdf
2. Complete Phase 2: Extend `DocumentDetail` schema (backend + frontend)
3. Complete Phase 3: US1 — backend endpoint + PdfViewer + split layout
4. Complete Phase 4: US1b — PanelDivider + drag state
5. **STOP and VALIDATE**: Open chat page, confirm PDF renders, both panels scroll independently, drag resize works
6. Demo/deploy MVP

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → PDF visible in split panel (MVP!)
3. Phase 4 → Drag-to-resize works
4. Phase 5 → Hardened error handling for storage failures
5. Phase 6 → Mobile stacked layout
6. Phase 7 → Format + full validation

---

## Notes

- [P] tasks touch different files and have no inter-dependency — safe to run simultaneously
- [Story] label maps each task to its user story for traceability back to spec.md acceptance scenarios
- `page.tsx` is the most-touched file (T006, T008, T010) — implement in order, not in parallel
- `PdfViewer.tsx` must be dynamically imported in `page.tsx` with `{ ssr: false }` to avoid server-side canvas errors (Next.js App Router SSR cannot access `document` or canvas APIs)
- `react-pdf` CSS imports (`AnnotationLayer.css`, `TextLayer.css`) must be inside the dynamically imported component, not at the page level
- Commit after each phase checkpoint to make rollback clean if a story causes regressions

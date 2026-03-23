# Tasks: Independent Scroll for PDF and Chat Panels

**Input**: Design documents from `/specs/007-independent-scroll/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: Not requested — visual verification only (layout/scroll behaviour).

**Organization**: All three user stories are unlocked by the same foundational layout fix (3 CSS class changes across 2 files). User story phases handle any story-specific cleanup and manual checkpoint verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- All paths are relative to repository root

---

## Phase 1: Setup

**Purpose**: No new dependencies or files. Project already set up. Confirm current branch.

- [x] T001 Confirm active branch is `007-independent-scroll` (run `git branch --show-current`)

---

## Phase 2: Foundational — Layout Height Containment

**Purpose**: Fix the three CSS classes that prevent panels from forming independent scroll containers. These changes block ALL user stories — complete before any story phase.

**Root cause** (from research.md): `min-h-*` utilities on `<body>` and the HomeClient containers allow the document to grow past viewport height. Child panels with `h-full` cannot resolve to a fixed pixel value, so `overflow-y-auto` never creates a true scroll box. All scrolling happens at document level via one shared scrollbar.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 In `frontend/app/layout.tsx` line 38: change `<body className="min-h-full">` to `<body className="h-full">`
- [x] T003 [P] In `frontend/components/HomeClient.tsx` line 37: change root div class from `flex min-h-screen bg-background text-foreground` to `flex h-screen overflow-hidden bg-background text-foreground`
- [x] T004 [P] In `frontend/components/HomeClient.tsx` line 43: change main column class from `ml-64 flex flex-1 flex-col min-h-screen bg-obsidian-well` to `ml-64 flex flex-1 flex-col overflow-hidden bg-obsidian-well`

**Checkpoint**: Layout height chain is now fully defined — `html: h-full` → `body: h-full` → HomeClient: `h-screen overflow-hidden` → content area: `flex-1 overflow-hidden`. Each panel now forms an independent scroll container.

---

## Phase 3: User Story 1 — PDF Starts at Top (Priority: P1) 🎯 MVP

**Goal**: Opening a document shows the PDF panel at the top of the document without any user action.

**Independent Test**: Open any document → PDF panel displays page 1 at the top. No manual scroll needed.

**Why this is complete after Phase 2**: PdfViewer's root div (`overflow-y-auto`) starts at `scrollTop = 0` by default. The layout fix in Phase 2 ensures the PDF wrapper's `h-full` resolves to a fixed pixel value, making PdfViewer's scroll container properly bounded. No additional code change is needed.

### Implementation for User Story 1

- [ ] T005 [US1] Verify US1 manually: start the dev server, open a document, confirm the PDF panel opens at page 1 (top) with its own scrollbar — no full-page scroll occurs
- [x] T006 [US1] In `frontend/components/ChatView.tsx` line 225: remove redundant `overflow-y-auto` from PDF panel wrapper (`<div className="overflow-y-auto h-full"` → `<div className="h-full"`) — PdfViewer manages its own scroll; the wrapper's duplicate `overflow-y-auto` is unused and misleading

**Checkpoint**: User Story 1 fully functional — PDF opens at top, scrolls independently.

---

## Phase 4: User Story 2 — Chat Starts at Latest Message (Priority: P2)

**Goal**: Opening a document with chat history shows the latest message and input bar without scrolling.

**Independent Test**: Open a document with existing messages → chat panel shows the most recent message and the input bar is visible immediately.

**Why this is complete after Phase 2**: `ChatInterface` already has a `bottomRef` div and a `useEffect` calling `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` whenever `messages` changes. Previously, this call scrolled the document (dragging both panels). After the Phase 2 fix, the messages div (`flex-1 overflow-y-auto`) is height-constrained and becomes the nearest scrollable ancestor — `scrollIntoView` now scrolls only the messages container. No code change needed.

### Implementation for User Story 2

- [ ] T007 [US2] Verify US2 manually: open a document that has existing chat history, confirm chat panel is scrolled to the bottom showing the latest message and the input bar without any manual scroll

**Checkpoint**: User Story 2 fully functional — chat opens at latest message.

---

## Phase 5: User Story 3 — Panels Scroll Independently (Priority: P3)

**Goal**: Scrolling one panel does not affect the other panel's scroll position.

**Independent Test**: Scroll the PDF to a middle page, then scroll the chat panel up — verify the PDF position is unchanged.

**Why this is complete after Phase 2 + Phase 3**: The layout fix establishes two separate scroll containers. The PDF panel's scroll container lives inside `PdfViewer` (`overflow-y-auto`). The chat panel's scroll container lives inside `ChatInterface`'s messages div (`overflow-y-auto`). Neither shares ancestors with the other at the scroll level. Independent scrolling is a direct consequence of the layout fix.

### Implementation for User Story 3

- [ ] T008 [US3] Verify US3 manually: scroll PDF panel to a middle page, then scroll up and down in the chat panel — confirm PDF stays at its position; then scroll chat to top, scroll PDF — confirm chat position unchanged

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify edge cases from spec.md and confirm no regressions.

- [ ] T009 [P] Verify mobile layout: resize browser to < 768px viewport width, open a document, toggle between PDF and Chat tabs — confirm each tab starts at its default scroll position (PDF at top, Chat at bottom)
- [ ] T010 [P] Verify panel divider: drag the split divider left and right — confirm no layout breakage and both panels maintain their scroll positions after resize
- [ ] T011 Verify processing state: open a document that is still processing — confirm the spinner in the PDF panel does not cause layout issues
- [ ] T012 Verify new message auto-scroll: send a new chat message, confirm the chat panel auto-scrolls to show the AI response as it streams in

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories** (T003 and T004 are parallel within the phase)
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 (can start in parallel with Phase 3 since they touch different files)
- **Phase 5 (US3)**: Depends on Phase 2 (can start in parallel with Phases 3 and 4)
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5 complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Depends on Phase 2 — no dependency on US1 or US3
- **US3 (P3)**: Depends on Phase 2 — no dependency on US1 or US2

### Within Each User Story

- Phase 2 (foundational) must complete before any story phase begins
- T003 and T004 (Phase 2) are in different sections of `HomeClient.tsx` but the same file — apply both changes before testing
- T006 (cleanup in ChatView.tsx) is independent and can run in parallel with T005 and T007

### Parallel Opportunities

- T003 and T004 are technically in the same file but different lines with no edit conflict — treat as sequential to avoid overlapping writes
- T005 (US1 verify) and T007 (US2 verify) can run in parallel (manual checks)
- T009, T010 (polish) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# T002, T003, T004 all together (2 files, non-conflicting lines)
File 1: frontend/app/layout.tsx          → T002 (body class change)
File 2: frontend/components/HomeClient.tsx → T003 + T004 (two class changes, different lines)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Confirm branch
2. Complete Phase 2: 3 CSS class changes (T002, T003, T004) — **~5 lines of code**
3. Complete Phase 3: Cleanup T006 + verify T005
4. **STOP and VALIDATE**: PDF opens at top independently ✅

### Incremental Delivery

1. Phase 1 + Phase 2 → layout fixed, all stories unblocked
2. Phase 3 → PDF scroll verified + cleanup ✅
3. Phase 4 → Chat scroll verified ✅
4. Phase 5 → Independent scroll confirmed ✅
5. Phase 6 → Edge cases and regressions cleared ✅

---

## Notes

- Total code changes: **~5 lines** across 3 files (`layout.tsx`, `HomeClient.tsx`, `ChatView.tsx`)
- No new dependencies, no new components, no backend changes
- All user stories are delivered by the Phase 2 layout fix; story phases are verification + cleanup
- [P] tasks = different files or non-conflicting edits
- [Story] label maps task to specific user story for traceability

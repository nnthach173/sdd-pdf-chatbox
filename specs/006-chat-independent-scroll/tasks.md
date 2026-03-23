# Tasks: Chat Panel Independent Scroll

**Input**: Design documents from `/specs/006-chat-independent-scroll/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Not requested — manual verification per quickstart.md.

**Organization**: Tasks are grouped by user story. This feature requires 2 code changes in 1 file (`ChatView.tsx`). No new files, no backend work, no new dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

Web app — frontend only: `frontend/components/`

---

## Phase 3: User Story 1 + 2 — Chat Input Accessible & Independent Scroll (Priority: P1/P2) 🎯 MVP

**Goal**: The chat input bar is always visible on screen and the chat panel scrolls independently from the PDF viewer. Both stories are resolved by the same two-line fix in `ChatView.tsx`.

**Independent Test**: Load a long PDF, scroll it, confirm the chat input bar is visible without scrolling. Scroll the PDF — confirm chat position unchanged. Scroll chat — confirm PDF position unchanged.

### Implementation

- [x] T001 [US1] In `frontend/components/ChatView.tsx` line 243, change the desktop chat panel wrapper class from `"flex flex-col overflow-y-auto h-full"` to `"flex flex-col overflow-hidden h-full"`
- [x] T002 [US2] In `frontend/components/ChatView.tsx` line 203, change the mobile active panel wrapper class from `"flex-1 overflow-y-auto"` to `"flex flex-1 flex-col overflow-hidden"`

**Checkpoint**: Desktop and mobile chat panels now own their scroll context. Input bar is anchored. PDF and chat scroll independently. User Stories 1 and 2 are complete.

---

## Phase 4: User Story 3 — Auto-Scroll to Latest Message (Priority: P3)

**Goal**: Confirm that new messages automatically scroll the chat panel to the bottom. This behavior is already implemented in `ChatInterface.tsx` via `bottomRef` and a `useEffect` that fires on every `messages` state change.

**Independent Test**: Scroll up in chat history, trigger a new AI response, confirm the panel scrolls to show the new message.

### Implementation

- [x] T003 [US3] Read `frontend/components/ChatInterface.tsx` lines 18–23 and confirm the `bottomRef` `useEffect` fires on `[messages]` dependency and calls `scrollIntoView({ behavior: 'smooth' })` — no code change needed if already correct; document finding in a comment or leave as-is

**Checkpoint**: Auto-scroll to latest message confirmed. User Story 3 is complete.

---

## Phase N: Polish & Verification

**Purpose**: Full end-to-end verification per quickstart.md

- [ ] T004 Manually run all test scenarios in `specs/006-chat-independent-scroll/quickstart.md` on both desktop and mobile viewports — confirm all acceptance scenarios from spec.md pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (US1 + US2)**: No prerequisites — can start immediately
- **Phase 4 (US3)**: Can start after Phase 3 (or in parallel since it reads a different file)
- **Polish**: Depends on Phases 3 and 4

### User Story Dependencies

- **US1 (P1)**: T001 — standalone, no dependencies
- **US2 (P2)**: T002 — standalone, no dependencies (same file as T001 but different line)
- **US3 (P3)**: T003 — read-only verification, no dependencies

### Parallel Opportunities

T001 and T002 edit different lines in the same file — implement sequentially in one commit to avoid conflicts.
T003 reads a different file and can run in parallel with T001/T002.

---

## Parallel Example: User Story 1 + 2

```bash
# Both changes are in the same file — edit together in one pass:
Task T001: Change line 243 in frontend/components/ChatView.tsx
Task T002: Change line 203 in frontend/components/ChatView.tsx

# Parallel (different file):
Task T003: Read and verify frontend/components/ChatInterface.tsx auto-scroll
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 Only)

1. Make the 2 class changes (T001, T002) in `frontend/components/ChatView.tsx`
2. **STOP and VALIDATE**: Open a long PDF, confirm input is always visible, confirm independent scroll
3. Done — this is the full fix

### Full Delivery

1. T001 + T002: Fix wrappers in ChatView.tsx
2. T003: Verify auto-scroll in ChatInterface.tsx
3. T004: Full manual test pass per quickstart.md

---

## Notes

- All changes are in `frontend/components/ChatView.tsx` (T001, T002)
- `ChatInterface.tsx` already has correct internal layout — do not modify it
- No backend, no database, no new files, no new dependencies
- Commit T001 + T002 together as one atomic change
- Total implementation time: ~5 minutes

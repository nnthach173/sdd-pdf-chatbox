---
description: "Task list for AI Document Chat UI Overhaul"
---

# Tasks: AI Document Chat UI Overhaul

**Input**: Design documents from `/specs/004-ai-chat-ui-update/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks grouped by user story. Each story is independently testable.
All new components are in `frontend/components/`. All layout wiring is in
`frontend/app/chat/[documentId]/page.tsx`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Scaffold the three new component files so all phases can proceed independently.

- [X] T001 Create empty stub files: `frontend/components/ChatPageHeader.tsx`, `frontend/components/DocumentSidebar.tsx`, and `frontend/components/MetadataExplorer.tsx` (each as a minimal exported React component returning `null`)

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Restructure `page.tsx` to the three-panel outer shell. This is the layout
foundation that US1 and US2 wire their components into. Must complete before Phases 3 and 4.

**⚠️ CRITICAL**: US1 wiring (T004) and US2 wiring (T007) depend on this phase.

- [X] T002 Restructure `frontend/app/chat/[documentId]/page.tsx` outer layout: wrap the existing PDF-viewer + PanelDivider + ChatInterface area in a `flex flex-1` inner div, and add a fixed-width (`w-64 shrink-0`) sidebar slot as a sibling to the left of it, so the PanelDivider resize scope is unchanged. The header slot goes above both panels. Pass `documentName` and `documentStatus` as props placeholders for T007.

**Checkpoint**: Page renders the existing split-view correctly with an empty sidebar column to the left. Panel resize still works.

---

## Phase 3: User Story 1 — Three-Panel Layout + Header (Priority: P1) 🎯 MVP

**Goal**: Branded header with tab navigation, user profile, and notification icon visible above the three-panel content area. Split-view resize confirmed working.

**Independent Test**: Open any chat page → header with branding + 4 tabs + user profile visible; clicking Settings/Support does nothing; dragging divider resizes PDF/chat panels while sidebar stays fixed width.

### Implementation for User Story 1

- [X] T003 [P] [US1] Implement `frontend/components/ChatPageHeader.tsx`: render app branding ("Obsidian Curator | AI Research Studio"), four tab buttons (Documents, Chat, Settings, Support) with "Chat" highlighted as active, static user profile area ("Research Lead — Pro Plan" + `UserCircle` icon), and a `Bell` notification icon. Settings and Support tabs have no `onClick` handler. Use Tailwind + lucide-react. Accept props: `documentName: string`, `activeTab?: 'documents' | 'chat' | 'settings' | 'support'` (defaults to `'chat'`).

- [X] T004 [US1] Wire `ChatPageHeader` into `frontend/app/chat/[documentId]/page.tsx`: import the component and render it above the three-panel content area, passing `documentName` and `activeTab="chat"`. Remove the existing back-button/title header that it replaces. (Depends on T002, T003)

- [X] T005 [US1] Commit all Phase 3 changes: `git add frontend/components/ChatPageHeader.tsx frontend/app/chat/[documentId]/page.tsx && git commit -m "feat(004): US1 — three-panel layout + branded header"` (Principle IX — Incremental Commits)

**Checkpoint**: US1 fully functional. Header visible, tabs rendered, panel resize working, sidebar column present.

---

## Phase 4: User Story 2 — Document Sidebar (Priority: P2)

**Goal**: Fixed-width left sidebar showing active document filename, status badge, and non-functional search input.

**Independent Test**: Open chat page → sidebar shows document filename + status badge; search input visible; typing in search does nothing; sidebar width unchanged when dragging divider.

### Implementation for User Story 2

- [X] T006 [P] [US2] Implement `frontend/components/DocumentSidebar.tsx`: accept props `documentName: string` and `documentStatus: 'processing' | 'ready' | 'error'`. Render document filename using `title-sm` typography, a shadcn `Badge` component reflecting the status (`'ready'` → "Ready" in secondary variant, `'processing'` → "Processing" in warning/muted variant, `'error'` → "Error" in destructive variant), and a search input with a `Search` lucide icon and no `onChange` handler. Apply `w-64 h-full` fixed sizing and the project's `surface_container_low` background.

- [X] T007 [US2] Wire `DocumentSidebar` into `frontend/app/chat/[documentId]/page.tsx`: import the component and render it in the sidebar slot created in T002, passing the document's `name` and `status` from existing page state. (Depends on T002, T006)

- [X] T008 [US2] Commit all Phase 4 changes: `git add frontend/components/DocumentSidebar.tsx frontend/app/chat/[documentId]/page.tsx && git commit -m "feat(004): US2 — document sidebar"` (Principle IX — Incremental Commits)

**Checkpoint**: US2 fully functional. Sidebar shows doc name + badge. Sidebar width unchanged on divider drag.

---

## Phase 5: User Story 3 — AI Message Action Buttons (Priority: P3)

**Goal**: Copy (functional), Regenerate, and Verify Critical Data buttons visible beneath each AI response message.

**Independent Test**: Send a chat message → AI response renders with 3 buttons below it; clicking Copy copies text to clipboard; clicking Regenerate and Verify produces no action; user messages show no buttons.

### Implementation for User Story 3

- [X] T009 [P] [US3] Modify `frontend/components/ChatMessage.tsx`: add `const [copied, setCopied] = useState(false)` local state. Below the message content, render three buttons only when `role === 'assistant'`: (1) **Copy** — `Copy` icon normally, swaps to `Check` icon for 1500ms after click via `navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })`; (2) **Regenerate** — `RefreshCw` icon, no `onClick`; (3) **Verify** — `ShieldCheck` icon, no `onClick`. All buttons use the project's existing button styling (not greyed out, consistent with active elements).

- [X] T010 [US3] Commit all Phase 5 changes: `git add frontend/components/ChatMessage.tsx && git commit -m "feat(004): US3 — AI message action buttons (Copy functional, Regenerate/Verify placeholders)"` (Principle IX — Incremental Commits)

**Checkpoint**: US3 fully functional. Copy works. Placeholder buttons styled but inert.

---

## Phase 6: User Story 4 — Metadata Explorer (Priority: P4)

**Goal**: Collapsible Metadata Explorer section below the message list in the right chat panel. Collapsed by default. Expand/collapse toggle works. Export button is a placeholder.

**Independent Test**: Open chat page → "Metadata Explorer" label + chevron visible below messages; clicking it expands the section body + Export button; clicking Export does nothing; clicking again collapses.

### Implementation for User Story 4

- [X] T011 [P] [US4] Implement `frontend/components/MetadataExplorer.tsx`: no props. Add `const [isExpanded, setIsExpanded] = useState(false)`. Render a clickable header row with the label "Metadata Explorer" and a `ChevronDown` lucide icon (rotated 180° via Tailwind `rotate-180` when `isExpanded` is true). When expanded, render a section body with static placeholder text ("No metadata available") and an Export button using the `Download` lucide icon — no `onClick` handler on Export. Apply a smooth CSS height/opacity transition for the expand/collapse animation.

- [X] T012 [US4] Add `MetadataExplorer` to `frontend/components/ChatInterface.tsx`: import and render `<MetadataExplorer />` directly below the message list `<div>` and above the error banner + input bar. (Depends on T011)

- [X] T013 [US4] Commit all Phase 6 changes: `git add frontend/components/MetadataExplorer.tsx frontend/components/ChatInterface.tsx && git commit -m "feat(004): US4 — Metadata Explorer collapsible section"` (Principle IX — Incremental Commits)

**Checkpoint**: US4 fully functional. Expand/collapse works. Export is inert.

---

## Phase 7: User Story 5 — Chat Input Placeholder Icons (Priority: P5)

**Goal**: Paperclip (attachment) and Image upload icons visible in the chat input bar. Both are non-functional placeholders.

**Independent Test**: Open chat page → Paperclip and Image icons visible in input bar alongside send button; clicking either produces no action; existing send/typing behaviour unchanged.

### Implementation for User Story 5

- [X] T014 [US5] Modify `frontend/components/ChatInterface.tsx` input bar: add a `Paperclip` lucide icon button and an `Image` lucide icon button to the left of the existing textarea (or in a grouped area). Both buttons have no `onClick` handler. Style them with the project's icon button treatment (at least `p-2` padding, same color as existing icons, not disabled/greyed). (Depends on T012 being complete to avoid conflicts in the same file)

- [X] T015 [US5] Commit all Phase 7 (committed with T013 — same file) changes: `git add frontend/components/ChatInterface.tsx && git commit -m "feat(004): US5 — chat input attachment and image placeholder icons"` (Principle IX — Incremental Commits)

**Checkpoint**: US5 complete. Icons visible, inert, no regression on send behaviour.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and final cleanup.

- [X] T016 Run the full quickstart.md verification checklist at `specs/004-ai-chat-ui-update/quickstart.md` — walk through all 7 sections and confirm every ✅ item passes. Note any failures and fix before proceeding.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS T004 and T007
- **Phase 3 (US1)**: T003 can start after Phase 1; T004 depends on T002 + T003
- **Phase 4 (US2)**: T006 can start after Phase 1; T007 depends on T002 + T006
- **Phase 5 (US3)**: T009 can start after Phase 1 (independent file)
- **Phase 6 (US4)**: T011 can start after Phase 1; T012 depends on T011
- **Phase 7 (US5)**: T014 depends on T012 (same file as T012)
- **Phase 8 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational (T002). No dependency on US2–US5.
- **US2 (P2)**: Depends on Foundational (T002). No dependency on US1, US3–US5.
- **US3 (P3)**: No foundational dependency. Fully independent (different file).
- **US4 (P4)**: No foundational dependency for component creation. T012 modifies ChatInterface.
- **US5 (P5)**: Depends on T012 completing first (same file: ChatInterface.tsx).

### Within Each User Story

- New component implementation before wiring into page/parent
- Commit at end of each story

### Parallel Opportunities

- T003 [US1 impl], T006 [US2 impl], T009 [US3 impl], T011 [US4 impl] — all target different files → can all run in parallel after T001
- T002 (Foundational) — runs once T001 is done, unblocks T004 and T007

---

## Parallel Execution Example (after Phase 1 + 2)

```
After T001 (stubs created):
  Parallel batch A — all different files:
    T003: Implement ChatPageHeader.tsx
    T006: Implement DocumentSidebar.tsx
    T009: Modify ChatMessage.tsx (action buttons)
    T011: Implement MetadataExplorer.tsx

  Parallel batch B — page.tsx restructure (can overlap with batch A):
    T002: Restructure page.tsx layout shell

After batch A + T002 complete:
  T004: Wire ChatPageHeader → page.tsx
  T007: Wire DocumentSidebar → page.tsx
  T012: Add MetadataExplorer → ChatInterface.tsx

After T012:
  T014: Add input icons → ChatInterface.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002) — CRITICAL
3. Complete Phase 3: US1 (T003 → T004 → T005)
4. **STOP and VALIDATE**: Three-panel layout, header, tab nav, split-view resize all working
5. Demo-ready: core layout overhaul is visible

### Incremental Delivery

1. Setup + Foundational → layout shell ready
2. US1 → header + layout → **MVP demo**
3. US2 → sidebar added → commit
4. US3 → AI message actions → commit
5. US4 → Metadata Explorer → commit
6. US5 → input icons → commit
7. Polish → full quickstart verification

---

## Notes

- [P] tasks = different files, no shared dependencies at time of execution
- [Story] label maps each task to its user story for traceability
- Commit after each user story phase (Principle IX — Incremental Commits)
- US5 (T014) must run after T012 — both modify `ChatInterface.tsx`
- All placeholder elements: styled but no `onClick` handler — do not add disabled styling
- The `navigator.clipboard` API requires HTTPS or localhost — verify on the correct origin

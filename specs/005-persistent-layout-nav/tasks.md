# Tasks: Persistent Layout Navigation

**Input**: Design documents from `/specs/005-persistent-layout-nav/`
**Branch**: `005-persistent-layout-nav`
**Stack**: TypeScript / Next.js App Router · React 19 · Tailwind CSS
**Backend changes**: None — pure frontend refactor

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All paths relative to repo root

---

## Phase 1: Setup

**Purpose**: Remove the old routing model so the new one can be built cleanly.

- [X] T001 Delete obsolete files: `frontend/app/chat/[documentId]/page.tsx`, `frontend/components/ChatPageHeader.tsx`, `frontend/components/DocumentSidebar.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the four new component shells and wire the base orchestrator. ALL tasks here must complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `frontend/components/AppHeader.tsx` — unified top bar rendering branding ("Obsidian Curator"), search input, and an optional `docName`/`docStatus` pill (props passed when in chat mode; null renders the library header variant)
- [X] T003 [P] Create `frontend/components/AppSidebar.tsx` — persistent nav sidebar with Documents, Chat, Upload PDF, and Settings items; accepts `activeView: 'library' | 'chat'` and `onNavigate` callback props; Upload PDF button triggers file input via forwarded ref (same pattern as current `page.tsx`)
- [X] T004 [P] Create `frontend/components/LibraryView.tsx` — extract the hero upload zone + document list section from current `frontend/app/page.tsx`; expose `onDocumentOpen: (docId: string) => void` and `onUploaded`/`onDeleted` callbacks; own the polling and document list state internally
- [X] T005 [P] Create `frontend/components/ChatView.tsx` — extract split-panel content from `frontend/app/chat/[documentId]/page.tsx`; accept `documentId: string` as prop instead of `useParams`; initially stub out localStorage (hardcoded `leftPct = 50`) and mobile tab (render both panels always); error and processing states from the old page are preserved
- [X] T006 [P] Update `frontend/components/DocumentCard.tsx` — replace `router.push('/chat/${doc.id}')` with an `onOpen: (id: string) => void` callback prop; remove the `useRouter` import
- [X] T007 Update `frontend/components/DocumentList.tsx` — add `onOpen: (id: string) => void` prop and pass it through to each `DocumentCard`
- [X] T008 Rewrite `frontend/app/page.tsx` as thin URL-driven orchestrator — use `useSearchParams` to read `activeDocId = searchParams.get('doc')`; render `AppSidebar` + `AppHeader` + either `LibraryView` (when `activeDocId` is null) or `ChatView` (when `activeDocId` is a string); pass `activeView` and `onNavigate` to `AppSidebar`; pass `docName`/`docStatus` to `AppHeader` (initially null until ChatView reports them up via callback or `useEffect`)

**Checkpoint**: App renders with persistent sidebar and header; Library View loads documents; Chat View is visually reachable (though navigation wiring comes in US1).

---

## Phase 3: User Story 1 — Open Document in Chat View (Priority: P1) 🎯 MVP

**Goal**: Clicking a document switches the content area to the split PDF+chat view; URL updates to `/?doc=<id>`; browser back/forward work; header + sidebar never unmount.

**Independent Test**: Load the app → click any document → confirm content area shows PDF+chat split while sidebar and top header remain; confirm URL is `/?doc=<id>`; press browser Back → confirm return to library.

- [X] T009 [US1] In `frontend/app/page.tsx`, wire `LibraryView`'s `onDocumentOpen` to `router.push('/?doc=${docId}')` — this is the single line that triggers view switching
- [X] T010 [US1] In `frontend/components/ChatView.tsx`, implement document load: call `getDocument(documentId)` and `getChatHistory(documentId)` in a `useEffect` keyed on `documentId`; handle `loading`, `error`, and `processing` (doc not ready) states; expose loaded `doc.name` and `doc.status` upward via an `onDocumentLoaded` callback prop so `page.tsx` can pass them to `AppHeader`
- [X] T011 [US1] In `frontend/components/AppHeader.tsx`, render document name + status badge when `docName` prop is non-null (status badge: "Processing…" spinner or "Ready" chip matching existing status styles); library variant shows only brand + search
- [X] T012 [US1] In `frontend/components/ChatView.tsx`, add document-not-found error state: when `getDocument` throws a 404-equivalent error, show a friendly message ("Document not found") and a "Return to library" button that calls `router.push('/')`

**Checkpoint**: US1 fully functional. Open any document, confirm split view + URL + back button all work.

---

## Phase 4: User Story 2 — Return to Library via Sidebar (Priority: P2)

**Goal**: "Documents" sidebar item navigates content area back to library from any state.

**Independent Test**: While in chat view, click "Documents" in the sidebar → content area shows library + upload zone; no page reload; document list state is unchanged.

- [X] T013 [US2] In `frontend/components/AppSidebar.tsx`, implement navigation callbacks: wire "Documents" item `onClick` to `onNavigate('library')` (which calls `router.push('/')` in `page.tsx`); keep "Chat" item `onClick` as a no-op (cursor-default, pointer-events-none) with visually dimmed style when `activeView === 'library'`

**Checkpoint**: US2 functional. Round-trip library → chat → library works via sidebar.

---

## Phase 5: User Story 3 — Resize PDF and Chat Panels (Priority: P3)

**Goal**: Users can drag the vertical divider to resize panels; ratio persists across sessions and documents.

**Independent Test**: In chat view, drag divider left/right — both panels resize. Refresh the page, reopen a document — the same ratio is applied. Mobile viewport shows tab toggle instead of divider.

- [X] T014 [US3] In `frontend/components/ChatView.tsx`, restore drag resize: read `leftPct` initial value from `localStorage.getItem('obsidian-split-ratio')` in `useEffect` (SSR-safe); on `mouseup`/`touchend` in `PanelDivider` handlers, write `localStorage.setItem('obsidian-split-ratio', String(leftPct))` — write on drag end only, not on every mouse-move
- [X] T015 [US3] In `frontend/components/ChatView.tsx`, implement mobile tab toggle: detect `isDesktop` via `window.innerWidth >= 768` in a `useEffect` with resize listener; on mobile render a two-button tab strip ("PDF" | "Chat") above the content area using `useState<'pdf' | 'chat'>` (default `'chat'`); conditionally render only the active panel; hide `PanelDivider` on mobile via existing `md:` Tailwind class

**Checkpoint**: US3 functional. Resize + localStorage persistence + mobile toggle all work.

---

## Phase 6: User Story 4 — Sidebar Active State (Priority: P4)

**Goal**: Sidebar always reflects the current view through visual highlighting.

**Independent Test**: Navigate between library view and chat view; "Documents" item is highlighted in library; "Chat" item is highlighted in chat.

- [X] T016 [US4] In `frontend/components/AppSidebar.tsx`, apply active styles based on `activeView` prop: when `activeView === 'library'`, apply `bg-[#22262e] text-primary` to "Documents" and dim "Chat"; when `activeView === 'chat'`, apply active styles to "Chat" and reset "Documents" to inactive — use the same active class pattern already present in the current `page.tsx` nav

**Checkpoint**: US4 functional. Sidebar orientation cues match current view at all times.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T017 [P] Verify `frontend/components/MetadataExplorer.tsx` is no longer imported anywhere; delete it if unused
- [X] T018 [P] Search codebase for any remaining references to `/chat/` route or `DocumentSidebar`/`ChatPageHeader` imports; remove them

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (deleted files must not block creation) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational complete
- **US2 (Phase 4)**: Depends on Foundational complete; integrates with US1 layout but independently testable
- **US3 (Phase 5)**: Depends on Foundational complete (specifically T005 ChatView stub); can work in parallel with US2
- **US4 (Phase 6)**: Depends on Foundational complete (specifically T003 AppSidebar); can work in parallel with US2/US3
- **Polish (Final)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story dependencies
- **US2 (P2)**: After Foundational — independent of US1, though tests naturally chain after US1 layout exists
- **US3 (P3)**: After Foundational (T005 ChatView) — independent of US2
- **US4 (P4)**: After Foundational (T003 AppSidebar) — independent of US2/US3

### Within Each Phase

- Foundational T002–T006 are all [P] (different files) — run in parallel
- T007 depends on T006 (DocumentList threads DocumentCard's new prop)
- T008 depends on T002–T007 (orchestrator imports all new components)

---

## Parallel Example: Foundational Phase

```
# These 5 tasks touch different files — run simultaneously:
T002: Create AppHeader.tsx
T003: Create AppSidebar.tsx
T004: Create LibraryView.tsx
T005: Create ChatView.tsx
T006: Update DocumentCard.tsx

# After T006 completes:
T007: Update DocumentList.tsx

# After T002-T007 all complete:
T008: Rewrite page.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T008)
3. Complete Phase 3: US1 (T009–T012)
4. **STOP and VALIDATE**: Click document → split view opens, URL updates, back button works
5. Demo / deploy

### Incremental Delivery

1. Phase 1 + Phase 2 → Persistent layout shell renders
2. + Phase 3 (US1) → Documents open in chat view ← **MVP**
3. + Phase 4 (US2) → Full navigation round-trip
4. + Phase 5 (US3) → Resizable panels with memory
5. + Phase 6 (US4) → Sidebar orientation cues
6. + Final Phase → Clean up

---

## Notes

- No backend changes: all existing API calls (`getDocument`, `getChatHistory`, `listDocuments`) are reused as-is
- `useSearchParams` requires `Suspense` boundary in Next.js App Router — wrap the `page.tsx` client component or its `useSearchParams` consumer accordingly
- `localStorage` access must be guarded in `useEffect` (not top-level) to avoid SSR errors
- `[P]` = different files, no dependency on each other's completion
- Each user story phase should be independently completable and testable before proceeding

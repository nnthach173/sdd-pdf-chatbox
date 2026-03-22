# Feature Specification: Persistent Layout Navigation

**Feature Branch**: `005-persistent-layout-nav`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Change page navigation so the sidebar and top header are always visible. Clicking a document switches the content area to a split PDF+chat view with a resizable divider. Clicking Documents in the sidebar returns to the library/upload view. Based on Stitch designs: Refined PDF Dashboard and Refined AI Document Chat."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Document in Chat View (Priority: P1)

A researcher is on the document library view. They click on a document to start chatting with it. Instead of being taken to a completely new page, the content area smoothly transitions to a split-panel view showing the PDF on the left and the AI chat on the right — all without the top header or sidebar ever disappearing.

**Why this priority**: This is the core interaction change the user is requesting. Everything else depends on this in-place view switching working correctly.

**Independent Test**: Load the app, upload or select any existing document, click it, and confirm the content area changes to the PDF+chat split view while the sidebar and top header remain unchanged.

**Acceptance Scenarios**:

1. **Given** the user is on the document library view, **When** they click on a document, **Then** the content area replaces the library with a split panel showing the PDF viewer on the left and the chat interface on the right — without any full-page navigation or reload.
2. **Given** the document is still processing, **When** the user clicks on it, **Then** the content area still switches to the chat view but shows a "processing" indicator in the PDF panel until the document is ready.
3. **Given** the content area is in chat view, **When** the page is loaded directly via a bookmarked or shared URL, **Then** the app restores the correct document in chat view with the persistent header and sidebar visible.
4. **Given** the user is in chat view, **When** they press the browser Back button, **Then** the content area returns to the library view (or the previous document if navigating between chats).

---

### User Story 2 - Return to Library via Sidebar (Priority: P2)

A researcher is in the chat view for a document. They want to switch to a different document or upload a new one. They click the "Documents" button in the persistent sidebar and the content area returns to the full document library and upload interface.

**Why this priority**: This completes the round-trip navigation loop and makes the persistent layout meaningful. Without it, users are stuck in chat view.

**Independent Test**: While in a chat view, click "Documents" in the sidebar — the content area should return to the library and upload zone, with no other layout change.

**Acceptance Scenarios**:

1. **Given** the user is in the chat view, **When** they click "Documents" in the sidebar, **Then** the content area returns to the document library view without any page reload or loss of document list state.
2. **Given** the user is in the library view, **When** they click "Documents" in the sidebar, **Then** the sidebar item shows an active/selected state and the library view remains unchanged.

---

### User Story 3 - Resize PDF and Chat Panels (Priority: P3)

While reviewing a document, a researcher wants to see more of the PDF without losing the chat. They drag a vertical divider between the PDF and chat panels to adjust their relative widths to their preference.

**Why this priority**: Improves comfort for power users reviewing complex documents but the feature is usable without it (a fixed 50/50 split is a valid default).

**Independent Test**: In chat view, grab the divider between the PDF and chat panels and drag it left/right — both panels should resize responsively while enforcing minimum-width constraints.

**Acceptance Scenarios**:

1. **Given** the user is in chat view, **When** they drag the divider to the right, **Then** the chat panel widens and the PDF panel shrinks, with both panels remaining usable (minimum ~20% width each).
2. **Given** the user drags the divider to an extreme, **When** it reaches the minimum width limit, **Then** further dragging is blocked and the panels do not collapse entirely.
3. **Given** the user is on a mobile-width viewport, **When** they enter chat view, **Then** a "PDF | Chat" tab toggle appears above the content area, showing one panel at a time, with no horizontal divider or resize interaction available.

---

### User Story 4 - Sidebar Shows Active State (Priority: P4)

The sidebar always reflects which view is active: "Documents" highlighted when in the library view, "Chat" highlighted when in a document chat view.

**Why this priority**: Provides orientation cues and makes the persistent layout feel intentional rather than confusing.

**Independent Test**: Navigate between library view and chat view; confirm the sidebar item active styling changes to match the current view.

**Acceptance Scenarios**:

1. **Given** the user is in the library view, **When** they look at the sidebar, **Then** the "Documents" nav item is visually highlighted/active.
2. **Given** the user opens a document, **When** the content area switches to chat view, **Then** the "Chat" nav item becomes visually highlighted and "Documents" becomes inactive.

---

### Edge Cases

- What happens when the user opens a document that no longer exists (deleted in another tab)? → The content area should show a friendly error with a "Return to library" action.
- What happens when the browser is resized from desktop to mobile width while in chat view? → The layout adapts gracefully: the divider hides, and the "PDF | Chat" tab toggle appears. The currently visible panel (PDF or chat) is retained as the active tab.
- What happens to the in-progress chat if the user accidentally clicks "Documents" and then back to the same document? → The chat history should reload from the server; no message loss since messages are persisted.
- What happens when the divider is dragged and the user releases the mouse outside the browser window? → The drag operation should safely cancel and panels should remain at the last valid position.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The top header (branding, search) and the left sidebar (Documents, Chat, Upload PDF, Settings) MUST remain visible and functional at all times, regardless of whether the user is in the library view or chat view.
- **FR-002**: The main content area MUST support two distinct view states: **Library View** (document upload zone + document list) and **Chat View** (PDF viewer + chat interface side by side). Transitions between view states are instant (no animation).
- **FR-003**: Clicking a document in the library MUST switch the content area to Chat View for that document without a full-page reload, and MUST update the URL to `/?doc=<id>` (query parameter on the root route, managed via `useSearchParams` / `useRouter`) so the view is bookmarkable and shareable.
- **FR-003a**: The browser Back and Forward buttons MUST navigate between library view and chat view states, using the URL history managed during view transitions.
- **FR-004**: Clicking the "Documents" nav item in the sidebar MUST switch the content area to Library View from any other state.
- **FR-005**: The Chat View MUST display the selected document's PDF on the left panel and the AI chat interface on the right panel.
- **FR-006**: Users MUST be able to drag a vertical divider between the PDF and chat panels to resize their relative widths. The chosen ratio MUST be saved as a global preference and applied automatically whenever any document is opened in chat view, including across browser sessions.
- **FR-007**: The resizable panels MUST enforce minimum width constraints so neither panel can be collapsed to zero.
- **FR-008**: The sidebar MUST reflect the active view state through visual highlighting of the current nav item ("Documents" when in library view, "Chat" when in chat view).
- **FR-009**: On narrow viewports (mobile), a "PDF | Chat" tab toggle MUST appear above the content area, showing only one panel at a time. The draggable divider MUST be hidden and the resize interaction MUST be unavailable.
- **FR-010**: The Chat View MUST preserve or reload the document's existing chat history when switching into it.

### Key Entities

- **View State**: The current mode of the main content area — either `library` or `chat`. Tracks which document is active when in `chat` mode.
- **Active Document**: The document currently displayed in chat view; has an identifier, name, processing status, and signed PDF URL.
- **Panel Split Ratio**: The percentage of horizontal width allocated to the PDF panel vs. the chat panel. Constrained between 20% and 80%. This is a **global user preference** — one ratio applies across all documents and persists across browser sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch from the document library to a document's chat view in a single click with no full-page reload.
- **SC-002**: Users can return from chat view to the library view in a single click with no full-page reload.
- **SC-003**: The top header and sidebar remain visible and uninterrupted during all view transitions.
- **SC-004**: Users can resize the PDF and chat panels across the full allowed range (20%–80%) in a single drag interaction, and the selected ratio is automatically applied when opening any subsequent document.
- **SC-005**: 100% of navigation interactions (library → chat, chat → library) complete without losing document list state or chat history.
- **SC-006**: The layout renders correctly on both desktop (≥768px wide) and mobile (< 768px wide) viewports, with the mobile tab toggle ("PDF | Chat") fully functional on narrow screens.

## Assumptions

- The existing chat history is persisted on the server and can be reloaded when re-entering a chat view — no client-side-only state preservation is needed.
- The "Chat" sidebar nav item activates only when a specific document is open in chat view; it is inactive/dimmed when in library view.
- The Upload PDF button in the sidebar remains functional from both views and always triggers the upload flow.
- The Settings sidebar link remains a dead link for this feature; wiring it up is out of scope.
- The "Chat" sidebar nav item is non-interactive (no-op) when in library view; clicking it does nothing. Wiring it to a last-opened document is out of scope for this feature.

## Clarifications

### Session 2026-03-22

- Q: Should the URL update to reflect the active document when switching views? → A: Yes — URL updates when entering/leaving chat view; browser back/forward work.
- Q: On mobile, how do users switch between the PDF and chat panels? → A: A "PDF | Chat" tab toggle shows one panel at a time; no vertical stacking.
- Q: Should the panel split ratio persist across sessions and documents? → A: Yes — global preference, persists across all sessions and applies to all documents.
- Q: What URL scheme should reflect the active document? → A: Query param on root — `/?doc=<id>`, managed via `useSearchParams` / `useRouter`.
- Q: What happens when the user clicks the "Chat" sidebar nav item while in library view? → A: No-op — item stays dimmed/inactive; click is ignored. Activating it from library is out of scope.
- Q: Should the library ↔ chat view transition be animated? → A: Instant swap — no animation; content area replaces immediately.

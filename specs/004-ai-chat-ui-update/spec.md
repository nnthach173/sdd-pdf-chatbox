# Feature Specification: AI Document Chat UI Overhaul

**Feature Branch**: `004-ai-chat-ui-update`
**Created**: 2026-03-22
**Status**: Draft
**Input**: Update the AI Document chatroom UI to match the "Refined AI Document Chat" layout from Google Stitch. Features present in the design but absent from the current implementation must be added as non-functional visual placeholders.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Oriented in the Updated Chat Layout (Priority: P1)

A user opens the AI chat page for a document and immediately sees a structured, three-panel workspace: a left document sidebar, a central PDF viewer, and a right chat panel. The top of the page shows a branded header with tab navigation, a user profile area, and a notification icon. The overall visual style matches the Obsidian Curator dark design language.

**Why this priority**: This is the foundational layout change. Every other story depends on this structure being in place first.

**Independent Test**: Open any chat page and confirm the three-panel layout, header branding, tab bar (Documents | Chat | Settings | Support), user profile indicator, and notification icon are all visible.

**Acceptance Scenarios**:

1. **Given** a user navigates to the chat page for any document, **When** the page loads, **Then** a header displays the app branding, a four-tab navigation bar (Documents, Chat, Settings, Support), a user profile area, and a notification icon.
2. **Given** the chat page is loaded, **When** the user views the main content area, **Then** they see a left sidebar panel, a central PDF viewer panel, and a right chat panel arranged side by side.
3. **Given** the user clicks the Settings or Support tab, **When** the click is registered, **Then** nothing happens — these are non-functional placeholders.
4. **Given** the chat page is loaded, **When** the user drags the divider between the PDF viewer and the chat panel, **Then** the two panels resize in real time while the left sidebar remains unaffected.

---

### User Story 2 — Document Sidebar Provides Context (Priority: P2)

The left sidebar shows the currently active document with its name, a status badge (e.g., "Ready"), and a search input field. This gives the user at-a-glance context about which document they are analyzing without leaving the chat page.

**Why this priority**: The sidebar is a visible structural element of the new design that gives the user document context. It requires no new backend functionality.

**Independent Test**: Verify the sidebar panel renders with the active document's name, a status badge, and a search input — independent of chat functionality.

**Acceptance Scenarios**:

1. **Given** a document has been loaded into the chat page, **When** the sidebar is visible, **Then** it displays the document's filename and a status badge (e.g., "Ready").
2. **Given** the sidebar is visible, **When** the user views it, **Then** a search input field is present (non-functional placeholder — it does not filter documents).

---

### User Story 3 — AI Response Action Buttons Are Available (Priority: P3)

Each AI-generated message in the chat panel shows three action buttons beneath it: Copy, Regenerate, and Verify Critical Data. The Copy button copies the message text to the clipboard. Regenerate and Verify Critical Data are non-functional placeholders styled to match the design.

**Why this priority**: Enhances the perceived capability of the assistant and aligns with the design. Copy provides immediate functional value; the others are low-cost placeholders.

**Independent Test**: Send a message, wait for an AI response, and verify all three buttons appear. Clicking Copy should copy the message text; clicking the other two should produce no action.

**Acceptance Scenarios**:

1. **Given** an AI response has been rendered, **When** the user views the message, **Then** three buttons are visible: Copy, Regenerate, and Verify Critical Data.
2. **Given** an AI response is displayed, **When** the user clicks Copy, **Then** the message text is copied to the clipboard.
3. **Given** an AI response is displayed, **When** the user clicks Regenerate or Verify Critical Data, **Then** nothing happens — non-functional placeholders.

---

### User Story 4 — Metadata Explorer Section Is Visible (Priority: P4)

A Metadata Explorer section is present inside the right chat panel, below the chat message list, as a collapsible or scrollable area. It includes an Export button. Both the section content and the Export button are non-functional placeholders — styled correctly but not connected to any data or action.

**Why this priority**: Adds visual completeness to the design without requiring any backend work. Lowest structural priority as it has no functional impact.

**Independent Test**: Confirm the Metadata Explorer header label is visible in the right chat panel below messages, that clicking it expands the section body and Export button, and that clicking Export produces no action.

**Acceptance Scenarios**:

1. **Given** the chat page is loaded, **When** the user views the right panel below the message list, **Then** a "Metadata Explorer" header label is visible in its collapsed state.
2. **Given** the Metadata Explorer is collapsed, **When** the user clicks the header label, **Then** the section expands to reveal its body content and an Export button.
3. **Given** the Metadata Explorer is expanded, **When** the user clicks Export, **Then** nothing happens — non-functional placeholder.

---

### User Story 5 — Chat Input Has Attachment and Image Upload Icons (Priority: P5)

The chat input bar displays a file attachment icon and an image upload icon alongside the text field and send button. Both icons are non-functional placeholders styled consistently with the input bar.

**Why this priority**: Cosmetic change aligned to the design. Lowest priority as it has no functional impact.

**Independent Test**: Confirm the two icons appear in the input bar and that clicking them produces no action.

**Acceptance Scenarios**:

1. **Given** the chat page is loaded, **When** the user views the input bar, **Then** a file attachment icon and an image upload icon are visible alongside the send button.
2. **Given** the icons are visible, **When** the user clicks either icon, **Then** nothing happens — non-functional placeholders.

---

### Edge Cases

- What happens when the document fails to load — the sidebar and PDF panel should still render without errors; the chat panel must remain functional.
- What happens when a user rapidly clicks non-functional placeholder buttons — no errors, no state changes, no visible side effects occur.
- What happens when the page is viewed at less than 1280px width — the existing responsive split-view behaviour is preserved; no panels are hidden or broken.
- What happens when the user drags the PDF/chat divider to its minimum or maximum constraint — the divider must stop at its boundary (20% / 80%) and must not affect the sidebar width.

---

## Clarifications

### Session 2026-03-22

- Q: Should the existing draggable split-view divider (allowing users to resize the ratio between PDF viewer and chat panel) be preserved in the new three-panel layout? → A: Yes — the split-view resize feature remains fully functional and unchanged; it is incorporated into the new design, not replaced.
- Q: Is the new left document sidebar fixed-width or user-resizable? → A: Fixed-width — its width is set by the design and cannot be resized by the user.
- Q: Where is the Metadata Explorer section placed in the layout? → A: Inside the right chat panel, as a collapsible/scrollable section below the chat message list.
- Q: What is the default visibility state of the Metadata Explorer section? → A: Collapsed by default — shows a header label the user can click to expand.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chat page header MUST display the app branding, a four-tab navigation bar (Documents, Chat, Settings, Support), a user profile indicator, and a notification icon.
- **FR-002**: The Settings and Support tabs MUST be rendered as non-functional placeholders — they MUST NOT navigate or trigger any action when clicked.
- **FR-003**: A left sidebar panel MUST be present on the chat page, displaying the active document's filename and a status badge.
- **FR-004**: The left sidebar MUST include a search input field rendered as a non-functional placeholder.
- **FR-005**: Each AI-generated message MUST display three action buttons: Copy (functional), Regenerate (non-functional placeholder), and Verify Critical Data (non-functional placeholder).
- **FR-006**: The Copy action MUST copy the full text of the AI message to the user's clipboard.
- **FR-007**: A Metadata Explorer section MUST be present inside the right chat panel, below the chat message list. It MUST be collapsed by default, showing only a clickable header label. When expanded, it MUST reveal its body content and an Export button, both rendered as non-functional placeholders.
- **FR-008**: The chat input bar MUST display a file attachment icon and an image upload icon as non-functional placeholders.
- **FR-009**: All non-functional placeholder elements MUST be visually styled consistently with the active design theme — they MUST NOT appear disabled, greyed out, or visually degraded compared to functional elements.
- **FR-010**: All existing functional features (sending messages, viewing PDF, streaming AI responses, back navigation, and draggable PDF/chat panel resizing) MUST continue to operate without regression after the UI update.
- **FR-012**: The draggable divider between the central PDF viewer panel and the right chat panel MUST remain functional — users MUST be able to drag it horizontally to shrink or enlarge the relative width of each panel, within the existing minimum (20%) and maximum (80%) constraints.
- **FR-013**: The left document sidebar MUST have a fixed width defined by the design — it MUST NOT be user-resizable. The draggable divider only controls the ratio between the PDF viewer and chat panel.
- **FR-011**: The overall layout MUST follow the three-panel structure from the Refined AI Document Chat design: left document sidebar, central PDF viewer, right chat panel.

### Key Entities

- **Chat Page Layout**: The full page structure for the AI chat view, composed of a header, left document sidebar, central PDF viewer panel, and right chat panel.
- **AI Message**: A single AI-generated response in the chat panel, enriched with Copy, Regenerate, and Verify Critical Data action buttons.
- **Non-Functional Placeholder**: A UI element that is visually styled and interactive-looking but performs no action and modifies no application state when interacted with.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All layout sections from the Refined AI Document Chat Stitch design (branded header with tab navigation, left document sidebar, central PDF panel, right chat panel, Metadata Explorer) are visible when the chat page loads.
- **SC-002**: All existing functional features — sending a message, receiving a streamed AI response, viewing the PDF, navigating back, and dragging the PDF/chat panel divider to resize — work without regression after the UI update.
- **SC-003**: Every non-functional placeholder element (Settings tab, Support tab, sidebar search, Regenerate button, Verify Critical Data button, Export button, attachment icon, image upload icon) produces no visible side effects, errors, or state changes when interacted with.
- **SC-004**: The Copy button on AI messages successfully copies message text to the clipboard on every attempt in supported browsers.
- **SC-005**: The updated chat page renders without broken layout, overflow, or hidden panels at 1280px width and above.

---

## Assumptions

- The existing split-view layout (PDF viewer + chat panel) is retained; the new sidebar is added as an additional left panel, making the full layout three panels wide.
- The user profile area in the header displays static placeholder content (e.g., "Research Lead — Pro Plan") — it is not connected to a real authentication or profile system.
- The status badge shown in the sidebar ("Ready" / "Processing") can reuse document status data already available from the existing backend — no new API endpoint is required.
- The Metadata Explorer section renders as a static placeholder panel with no live data — no new backend work is needed for this feature.
- The Obsidian Curator dark design system (near-black surfaces, electric blue/cyan accent, Manrope + Inter fonts, glassmorphism panel treatment) is already present in the codebase and is applied to new elements without requiring a full design-system rebuild.

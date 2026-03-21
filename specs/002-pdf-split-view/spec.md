# Feature Specification: PDF Split-Panel View

**Feature Branch**: `002-pdf-split-view`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "On the chat page, replace the current layout with a split-panel view. Left half renders the uploaded PDF inline using a PDF viewer. Right half is the existing chat interface. Both panels scroll independently. The PDF loads via a signed URL from the backend since the Supabase storage bucket is private. On mobile, stack vertically with PDF on top."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View PDF Alongside Chat (Priority: P1)

A user opens a document's chat page and sees their PDF rendered inline on the left half of the screen while the chat interface occupies the right half. They can scroll through the PDF without losing their place in the chat, and vice versa — referencing the document while composing or reading messages without switching tabs or windows.

**Why this priority**: This is the core value proposition of the feature — eliminating the need to context-switch between the PDF and the chat. Everything else depends on this working first.

**Independent Test**: Open a chat page for a ready document → confirm the PDF renders in the left panel → confirm the chat interface is visible in the right panel → scroll each panel independently → verify both remain in place without affecting each other.

**Acceptance Scenarios**:

1. **Given** a user navigates to a document's chat page, **When** the page loads, **Then** the PDF is displayed in the left panel and the chat interface is displayed in the right panel simultaneously, each occupying 50% of the screen width.
2. **Given** the split-panel view is loaded, **When** the user scrolls within the PDF panel, **Then** the chat panel position does not change, and vice versa.
3. **Given** the user is in the right (chat) panel, **When** they type a question and submit it, **Then** the chat interaction functions identically to the existing chat experience.
4. **Given** the PDF is loading, **When** it has not yet appeared, **Then** a loading indicator is shown in the left panel so the user understands the document is being fetched.

---

### User Story 1b - Resize Panels by Dragging (Priority: P1)

A user drags the divider between the PDF and chat panels left or right to change the proportion of screen space each panel occupies. The default split is 50/50. They can adjust it anywhere between 20/80 and 80/20 — for example, widening the chat panel when typing long queries, or widening the PDF panel when reading dense content. The divider snaps within those limits and cannot be dragged beyond them.

**Why this priority**: Grouped with P1 because it directly enhances the core split-panel experience. A fixed 50/50 split does not suit all reading and chatting styles; drag-to-resize makes the layout adaptable without adding complexity to the core feature.

**Independent Test**: Load the chat page → drag the divider leftward → confirm the PDF panel shrinks and the chat panel grows → drag to the 80/20 limit in each direction → confirm the divider stops and cannot be dragged further.

**Acceptance Scenarios**:

1. **Given** the split-panel view is displayed, **When** the user clicks and drags the divider between panels, **Then** both panels resize in real time to reflect the new proportion.
2. **Given** the user drags the divider, **When** the PDF panel would exceed 80% of the available width, **Then** the divider stops and cannot be dragged further in that direction.
3. **Given** the user drags the divider, **When** the chat panel would exceed 80% of the available width, **Then** the divider stops and cannot be dragged further in that direction.
4. **Given** the user has adjusted the panel split, **When** the page is refreshed, **Then** the panels reset to the default 50/50 split (no persistence required).

---

### User Story 2 - Secure PDF Display (Priority: P2)

A user's PDF is stored privately and is not publicly accessible. The system automatically fetches a time-limited access link and uses it to display the PDF inline, so the user never needs to manage access credentials or encounter a broken viewer due to permission errors.

**Why this priority**: Without secure access, the PDF panel would be broken for all users (permissions error) or require making storage public — a security regression. This must work for US1 to be viable.

**Independent Test**: Open a chat page → confirm the PDF renders without any manual authentication steps from the user → confirm the PDF is not served from a permanent public link.

**Acceptance Scenarios**:

1. **Given** a user opens the chat page, **When** the PDF panel loads, **Then** the PDF content is displayed without requiring any manual authentication or token entry from the user.
2. **Given** a PDF access link has expired, **When** the user reloads the page, **Then** a fresh access link is obtained automatically and the PDF displays correctly.
3. **Given** a document cannot be accessed (e.g., deleted from storage), **When** the PDF panel attempts to load, **Then** a clear error message is shown instead of a broken or blank viewer.

---

### User Story 3 - Mobile-Friendly Stacked Layout (Priority: P3)

A user opens the chat page on a mobile device or narrow browser window and sees the PDF displayed above the chat interface in a vertically stacked layout. They can scroll down past the PDF to access the chat, or scroll up to reference the document.

**Why this priority**: The side-by-side layout is unusable on small screens. A stacked fallback ensures the feature remains fully accessible on mobile without degrading the experience.

**Independent Test**: Open the chat page on a screen narrower than 768px → confirm the PDF panel appears above the chat panel → confirm both are fully usable by scrolling.

**Acceptance Scenarios**:

1. **Given** a user opens the chat page on a screen narrower than 768px, **When** the page renders, **Then** the PDF panel appears above the chat panel in a single-column layout.
2. **Given** the stacked mobile layout, **When** the user scrolls the page, **Then** they can reach both the PDF and the chat interface without content being hidden or clipped.

---

### Edge Cases

- What happens when the PDF is very large (100+ pages) — does the viewer remain usable without freezing the browser tab?
- What happens if the backend fails to generate a signed URL — does the user see a descriptive error rather than a blank panel?
- What happens when the document status is not "ready" (e.g., still processing) — the PDF panel MUST display a status message ("Document is still processing…") and poll the document status every 5 seconds, automatically replacing the message with the PDF viewer once the status becomes "ready".
- If `react-pdf` fails to render the document (e.g., corrupted file, memory exhaustion), the PDF panel MUST display an error message and a direct download link via the signed URL so the user can open the file externally.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chat page MUST display the PDF viewer and chat interface side-by-side on screens 768px wide and above, defaulting to each panel occupying 50% of the available width.
- **FR-002**: The chat page MUST display the PDF viewer above the chat interface in a single-column layout on screens narrower than 768px.
- **FR-003**: Each panel (PDF viewer and chat) MUST scroll independently — scrolling one panel MUST NOT affect the scroll position of the other.
- **FR-003b**: A draggable divider MUST be displayed between the two panels on desktop, allowing the user to resize them horizontally by clicking and dragging. Keyboard accessibility for the divider is explicitly out of scope — mouse and touch interaction only is required.
- **FR-003c**: The draggable divider MUST enforce a minimum panel width of 20% and a maximum of 80% for either panel — the divider MUST stop at these limits and not allow further dragging.
- **FR-003d**: Panel proportions do NOT need to persist across page reloads — the layout MUST reset to 50/50 on each page load.
- **FR-004**: The system MUST obtain a secure, time-limited access link for the PDF file before displaying it — no permanent public URL may be used.
- **FR-005**: The PDF panel MUST display a loading indicator while the document and its access link are being fetched.
- **FR-006**: If the PDF cannot be loaded or rendered for any reason, the PDF panel MUST display a descriptive, user-readable error message and a direct download link (via the signed URL) so the user can open the file externally. A retry action MUST also be offered.
- **FR-009**: If the document status is not "ready" when the chat page loads, the PDF panel MUST display a processing status message and poll the document status endpoint every 5 seconds, automatically initialising the PDF viewer once status transitions to "ready".
- **FR-007**: All existing chat functionality (sending messages, receiving streamed responses, viewing history) MUST continue to work unchanged within the chat panel.
- **FR-008**: The document name MUST remain visible on the chat page so the user always knows which document they are viewing.

### Key Entities

- **Document**: An uploaded PDF with a name, status, and a private storage location. The split-panel view requires a document in "ready" status to display both the PDF and an active chat.
- **Signed URL**: A time-limited, authenticated link to the private PDF file generated by the backend on demand and used by the browser to render the document inline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The PDF panel begins rendering content within 3 seconds of the chat page loading under normal network conditions.
- **SC-002**: Users can read the PDF and conduct the full chat interaction without leaving the page — 100% of chat actions are completable within the split-panel view.
- **SC-003**: The layout renders correctly at the 768px breakpoint — both the desktop split-panel and mobile stacked layouts show no broken, overlapping, or clipped elements.
- **SC-003b**: Dragging the divider resizes both panels smoothly in real time with no visible lag or content reflow outside the panels. The divider enforces the 20/80 to 80/20 range without allowing panels to collapse.
- **SC-004**: Signed URL generation succeeds silently on every page load — users are never prompted to authenticate manually in order to view their document.
- **SC-005**: 100% of PDF load failure states display a user-readable error message — no blank panels or raw error codes are shown to the user.

## Assumptions

- Only the chat page (`/chat/[documentId]`) is being modified; the home/documents page and document management flows are out of scope.
- The existing document fetch endpoint (e.g., `GET /documents/{id}`) will be extended to include a `signed_url` field in its response; no separate endpoint is added. The frontend does not construct storage URLs directly.
- Signed URLs are valid for at least 10 minutes — sufficient for a typical reading session without requiring mid-session refresh.
- The panel split defaults to 50/50 on desktop and is user-resizable by dragging. The allowed range is 20/80 to 80/20. Proportions are not persisted across page reloads.
- The existing chat history, streaming, and delete functionality are preserved as-is and do not require re-implementation.
- The PDF viewer MUST be implemented using `react-pdf` (pdf.js-based). Native `<iframe>`/`<embed>` is explicitly rejected due to unreliable mobile browser support and lack of rendering control.

## Clarifications

### Session 2026-03-22

- Q: Which PDF rendering approach should the inline viewer use? → A: `react-pdf` (pdf.js-based wrapper)
- Q: What should the PDF panel show when document status is not "ready"? → A: Status message with auto-poll every 5 s, swap to viewer on ready
- Q: How should the signed URL reach the frontend? → A: Extend existing document fetch endpoint to include `signed_url` field (single round-trip)
- Q: What is the fallback when react-pdf fails to render? → A: Error message + direct download link via signed URL
- Q: Does the draggable divider require keyboard accessibility? → A: No — mouse and touch only; keyboard support is out of scope

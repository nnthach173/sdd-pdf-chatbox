# Feature Specification: Independent Scroll for PDF and Chat Panels

**Feature Branch**: `007-independent-scroll`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "I want to update the UX of the AI chat room. The AI Chatroom has 2 sides, the left side is the pdf uploaded, right side is the chat box. Both sides use the same scroll bar and it auto scroll down to the end, meaning that if I want to see the start of the pdf file I have scroll up everytime I open a file. What I want: both pdf and chatbox has its own scroll bar, pdf scrollbar would always start at the top so users can read the pdf, and the chatbox scrollbar would always start at the end so that user can see the latest messages and input bar"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - PDF Starts at Top (Priority: P1)

A user opens a PDF document in the chat room. The PDF panel displays the document beginning at the first page, so the user can immediately start reading from the top without having to manually scroll up.

**Why this priority**: This is the most disruptive current pain point. Every time a user opens a document, they must scroll up to find the beginning. Fixing this delivers immediate, visible improvement to the core reading workflow.

**Independent Test**: Open any document and verify the PDF panel shows the first page/top of the document without any manual scrolling.

**Acceptance Scenarios**:

1. **Given** a user navigates to a document, **When** the chat room loads, **Then** the PDF panel displays from the very beginning of the document (top of page 1).
2. **Given** a user has previously scrolled down in a PDF, **When** they navigate away and return to the same document, **Then** the PDF panel resets to the top on reload.
3. **Given** the chat panel has many messages that would normally push the whole page down, **When** the document loads, **Then** the PDF panel is unaffected and still starts at the top.

---

### User Story 2 - Chat Starts at Latest Message (Priority: P2)

A user opens a document they have previously chatted about. The chat panel automatically scrolls to the most recent message and the input bar, so the user can immediately continue the conversation without scrolling.

**Why this priority**: Users returning to an ongoing conversation expect to see the latest context. This is the standard behavior for chat interfaces and prevents users from losing their place in the conversation.

**Independent Test**: Open a document with existing chat history and verify the chat panel shows the most recent message and input bar without manual scrolling.

**Acceptance Scenarios**:

1. **Given** a document has existing chat history, **When** the chat room loads, **Then** the chat panel is scrolled to the bottom showing the most recent message and input bar.
2. **Given** a document has no chat history, **When** the chat room loads, **Then** the chat panel shows an empty state with the input bar visible.
3. **Given** the user sends a new message, **When** the AI responds, **Then** the chat panel automatically scrolls to show the new response.

---

### User Story 3 - Panels Scroll Independently (Priority: P3)

A user is reading a PDF while also reviewing the chat. Scrolling in the PDF panel does not affect the chat panel's scroll position, and vice versa. Each panel maintains its own independent scroll state.

**Why this priority**: Without independent scrolling, interacting with one panel disrupts the user's position in the other. This is essential for the split-panel layout to be genuinely useful.

**Independent Test**: Scroll to the middle of the PDF panel, then scroll in the chat panel — verify neither action affects the other panel's scroll position.

**Acceptance Scenarios**:

1. **Given** the user has scrolled to the middle of a PDF, **When** they scroll up or down in the chat panel, **Then** the PDF panel remains at its current scroll position.
2. **Given** the user is reading a chat message mid-thread, **When** they scroll the PDF panel, **Then** the chat panel remains at its current scroll position.
3. **Given** both panels have their own scrollbars, **When** the content in one panel overflows, **Then** only that panel's scrollbar appears and responds to scrolling.

---

### Edge Cases

- What happens when a PDF is still processing and later becomes ready — does the PDF panel start at the top when it loads?
- How does the chat panel behave on mobile (single-panel tab view) where the panels are not displayed side by side?
- What happens if the chat panel receives a new AI message while the user has scrolled up to read earlier messages — does it force-scroll to the bottom or stay put?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The PDF panel MUST have its own independent scrollable area, separate from the chat panel.
- **FR-002**: The chat panel MUST have its own independent scrollable area, separate from the PDF panel.
- **FR-003**: When a document is opened, the PDF panel MUST display from the top of the document by default.
- **FR-004**: When the chat room loads, the chat panel MUST be scrolled to the bottom, showing the most recent message and the input bar.
- **FR-005**: Scrolling within the PDF panel MUST NOT affect the scroll position of the chat panel.
- **FR-006**: Scrolling within the chat panel MUST NOT affect the scroll position of the PDF panel.
- **FR-007**: When a new message is added to the chat (by the user or the AI), the chat panel MUST automatically scroll to show the new message.
- **FR-008**: On mobile (tab-based layout), each tab panel MUST independently manage its own scroll position when displayed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When opening any document, the PDF panel shows the beginning of the document without requiring any user action — verified on 100% of document loads.
- **SC-002**: When opening a document with chat history, the chat input bar is immediately visible without scrolling — verified on 100% of loads with history.
- **SC-003**: Scrolling one panel does not cause any visible movement in the other panel — zero cross-panel scroll interference during interaction.
- **SC-004**: New messages (user or AI) cause the chat panel to scroll to the bottom automatically — verified for every message sent.
- **SC-005**: Both panels display their own scrollbars and respond only to scroll interactions within their own boundaries.

## Assumptions

- The mobile tab-based view (single panel at a time) already functions correctly as a side effect of this change, since panels are shown one at a time.
- When the user manually scrolls up in the chat panel to review history, auto-scroll on new messages will re-engage and scroll back to the bottom (standard chat behavior).
- The PDF panel does not need to remember scroll position between sessions — starting at the top on every load is the intended behavior.
- The chat panel scroll-to-bottom behavior on load applies whether there are 0 or many messages.

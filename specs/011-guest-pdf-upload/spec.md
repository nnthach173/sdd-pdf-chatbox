# Feature Specification: Guest PDF Upload with Size Limit

**Feature Branch**: `011-guest-pdf-upload`
**Created**: 2026-04-03
**Status**: Draft
**Input**: User description: "right now guest user can see the homepage but they can't do anything, I want to change that guest users can still upload document and use the page as usual, but limit guests pdf file size limit to 1MB"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Uploads a PDF and Chats (Priority: P1)

A guest user (not logged in) visits the homepage and uploads a PDF document under 1 MB. They can then interact with the document via the chat interface just like a logged-in user.

**Why this priority**: This is the core feature request — guests should be able to use the product without creating an account, which removes friction and allows first-time exploration.

**Independent Test**: Can be fully tested by opening the app without logging in, uploading a PDF under 1 MB, and verifying the chat responds to questions about the document.

**Acceptance Scenarios**:

1. **Given** a user is not logged in, **When** they visit the homepage, **Then** the upload UI is visible and interactive (not locked or hidden behind an auth prompt).
2. **Given** a guest user selects a PDF file under 1 MB, **When** they upload it, **Then** the document is processed and the chat interface becomes functional.
3. **Given** a guest user has uploaded a document, **When** they send a message in the chat, **Then** they receive a relevant AI response based on the document content.

---

### User Story 2 - Guest Exceeds the 1 MB File Size Limit (Priority: P2)

A guest user attempts to upload a PDF that is larger than 1 MB and receives a clear, actionable error message explaining the limit and how to proceed.

**Why this priority**: Enforcing the limit gracefully is critical to user experience — a poor error state would frustrate potential users and harm retention.

**Independent Test**: Can be tested by uploading a PDF over 1 MB as a guest and verifying an informative error message is shown without crashing or silently failing.

**Acceptance Scenarios**:

1. **Given** a guest user selects a PDF file larger than 1 MB, **When** they attempt to upload it, **Then** the upload is rejected before any processing begins.
2. **Given** the upload is rejected due to file size, **Then** a clear error message is displayed stating the 1 MB guest limit and suggesting login/signup to upload larger files.
3. **Given** the error is shown, **When** the user dismisses it, **Then** they can still upload a different (smaller) file without refreshing the page.

---

### User Story 3 - Logged-In User Faces No New Size Restrictions (Priority: P3)

An authenticated user should not be affected by the 1 MB guest limit — they can upload PDFs of any size supported by the existing system.

**Why this priority**: Ensures the guest restriction does not accidentally constrain existing users.

**Independent Test**: Can be tested by logging in and uploading a PDF larger than 1 MB, verifying it succeeds.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they upload a PDF larger than 1 MB, **Then** the upload proceeds normally with no size-related error.

---

### Edge Cases

- What happens when a guest uploads a PDF that is exactly 1 MB (boundary condition — should be allowed)?
- What happens if a guest tries to upload a non-PDF file — does the existing file-type validation still apply?
- How does the system behave if a guest has existing documents from a prior session (via browser-local UUID)?
- What happens if the guest's session identifier is lost mid-upload?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow guest users (unauthenticated) to upload PDF documents on the homepage without requiring login or account creation.
- **FR-002**: System MUST reject PDF uploads from guest users if the file size exceeds 1 MB, before any processing takes place.
- **FR-003**: System MUST display a clear error message to guest users when a file is rejected due to size, stating the 1 MB limit and suggesting they sign in to upload larger files.
- **FR-004**: System MUST allow guest users to use the full chat interface after a successful document upload, with no feature restrictions beyond the file size limit.
- **FR-005**: System MUST NOT apply the 1 MB size restriction to authenticated (logged-in) users.
- **FR-006**: System MUST allow a guest user to retry with a different file after a rejected upload, without requiring a page reload.
- **FR-007**: System MUST perform the file size check immediately upon file selection (client-side), before initiating any upload or server request.
- **FR-008**: System MUST also enforce the 1 MB guest upload limit on the server side, rejecting any oversized request that bypasses the client-side check.

### Key Entities

- **Guest User**: An unauthenticated visitor identified by a browser-local session. Subject to the 1 MB PDF upload limit.
- **Authenticated User**: A logged-in user. Not subject to the 1 MB guest upload limit.
- **PDF Upload**: A document upload action with attributes: file size, file type, uploader type (guest vs. authenticated).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guest users can upload a PDF under 1 MB and start chatting in the same experience as logged-in users, with no additional steps required.
- **SC-002**: 100% of PDF uploads from guest users exceeding 1 MB are rejected with an informative error message before any processing begins.
- **SC-003**: Authenticated users experience no change in upload capability or file size limits.
- **SC-004**: Error messages for oversized guest uploads clearly indicate the 1 MB limit and provide a path to remove that restriction (e.g., sign in or create an account).
- **SC-005**: File size feedback is immediate — guests see the rejection message without waiting for a server response.

## Clarifications

### Session 2026-04-03

- Q: Should the 1 MB file size limit for guest uploads be enforced on the server as well as the client? → A: Both client and server must enforce the limit. Client-side provides instant UX feedback; server-side is the security guarantee against bypasses.
- Q: Should guest documents persist across browser sessions (via the browser-local UUID)? → A: Yes — guest documents persist. Returning to the same browser restores previously uploaded documents via the existing UUID mechanism.
- Q: Should there be a per-session document count limit for guests? → A: No cap for now. The 1 MB size limit sufficiently bounds per-upload cost; a document count limit is deferred to a future feature if abuse is observed.

## Assumptions

- The existing upload flow works for authenticated users; this feature extends it to guests without breaking existing behavior.
- The browser-local UUID mechanism (from feature 008) already handles guest session identity — no new session management is needed. Guest documents persist across sessions; returning to the same browser with the same UUID restores access to previously uploaded documents.
- "1 MB" means 1,048,576 bytes (binary). Files at exactly this threshold are accepted.
- No other feature restrictions apply to guests beyond file size — guests have full chat functionality after a successful upload.
- Authenticated users retain whatever upload size limits already exist in the system; no new upper bound is introduced for them.
- There is no cap on the number of documents a guest may upload. Per-document count limits are out of scope and deferred to a future feature if storage abuse is observed.

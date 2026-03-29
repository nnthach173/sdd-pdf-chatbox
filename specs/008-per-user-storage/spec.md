# Feature Specification: Per-User Isolated PDF Storage

**Feature Branch**: `008-per-user-storage`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "I want to upgrade the project. Right now all the pdf files are shared across everyone who pulled this project on Github. I want to have dedicated storage for each user, that means when I upload PDF files on computer A, only computer A can see and work with the files, if I open incognito or go to another computer I won't see the files uploaded by computer A. Find for me the best solutions to solve this"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Private PDF Library Per Browser (Priority: P1)

A visitor opens the application on their computer and uploads PDF files. When they return to the app in the same browser later, they see exactly the files they uploaded — no one else's files, and no files from other devices or browsers.

**Why this priority**: This is the core ask. Without file isolation, every other feature degrades into a shared mess. All other stories depend on identity working correctly.

**Independent Test**: Open the app in Browser A and upload 2 PDFs. Open the app in Browser B (or incognito). Verify Browser B shows an empty file list, not Browser A's files. This delivers the primary isolation guarantee.

**Acceptance Scenarios**:

1. **Given** a visitor on Computer A has uploaded 3 PDF files, **When** they reload the page in the same browser, **Then** they see their 3 files and can continue working with them.
2. **Given** Computer A has uploaded 3 PDF files, **When** a different visitor opens the app on Computer B (or in an incognito window), **Then** they see an empty file list — none of Computer A's files are visible.
3. **Given** two visitors are using the app simultaneously on different devices, **When** each uploads a file, **Then** each visitor only sees their own uploaded file, not the other's.

---

### User Story 2 - Session Persistence Within Same Browser (Priority: P2)

A visitor uploads PDF files and has an active chat conversation. When they close and reopen the browser tab (or restart the browser), their files and identity are still intact — they do not need to re-upload to continue working.

**Why this priority**: Without session persistence, users lose their work every time they close the tab, making the tool frustrating to use for any non-trivial task.

**Independent Test**: Upload a PDF, close the tab, reopen the app. Verify the uploaded file is still listed and accessible for chat.

**Acceptance Scenarios**:

1. **Given** a visitor has uploaded a PDF, **When** they close and reopen the browser tab, **Then** their uploaded file is still listed and the chat history is preserved.
2. **Given** a visitor returns to the app after several hours, **When** they view their file list, **Then** their files are still available without needing to re-upload.

---

### User Story 3 - Clean Slate in Incognito / New Browser (Priority: P3)

A visitor who opens the app in a private/incognito window, or on a device they have never used before, starts with a completely empty workspace — no files, no chat history from other sessions.

**Why this priority**: This confirms the isolation boundary and gives users a way to start fresh deliberately, which is useful for demos, privacy, or shared computers.

**Independent Test**: Open the app in an incognito window. Verify the file list is empty and no prior data is shown. Upload a file in incognito, then verify it does not appear in the normal browser session.

**Acceptance Scenarios**:

1. **Given** a visitor opens the app in incognito mode, **When** the page loads, **Then** they see an empty file list even if another browser session has uploaded files.
2. **Given** a visitor uploads a file in incognito mode, **When** they switch to a normal browser window, **Then** the incognito-uploaded file does not appear in the normal session.

---

### Edge Cases

- What happens when the visitor clears their browser's local storage or cookies? They lose their identity token and can no longer access their previously uploaded files (files become orphaned). No recovery mechanism is in scope for this feature.
- What if two browser tabs are open simultaneously for the same visitor? Both tabs share the same identity and see the same file list.
- How does the system handle a visitor whose stored identity token is expired or invalid? The system silently assigns a new identity (starting fresh) rather than crashing or exposing another user's files.
- What if a visitor manually tampers with their stored identity to impersonate another user's ID? The system must reject or ignore requests for files not belonging to the presented identity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign a unique, persistent identity to each browser session upon first visit, without requiring the visitor to register or log in.
- **FR-002**: The assigned identity MUST persist across page reloads, tab closes, and browser restarts within the same browser profile.
- **FR-003**: The identity MUST NOT carry over to a different browser, a private/incognito window, or a different device.
- **FR-004**: The system MUST associate every uploaded PDF file with the uploader's identity at the time of upload.
- **FR-005**: The file list shown to a visitor MUST contain only files associated with their own identity — never files belonging to other identities.
- **FR-006**: Chat history and conversations MUST be scoped to the visitor's identity and not visible to other identities.
- **FR-007**: The system MUST reject any attempt to retrieve files or chat history belonging to a different identity, regardless of how the request is constructed.
- **FR-008**: If a visitor's stored identity is missing or invalid upon return, the system MUST silently create a new identity for them rather than surfacing an error or exposing other users' data.

### Key Entities

- **Visitor Identity**: A stable, opaque identifier assigned to a browser session. Persists locally in the visitor's browser; requires no account. Scopes all data (files, chats) to one visitor.
- **Owned Document**: A PDF file associated with exactly one visitor identity. Cannot be listed or accessed by other identities.
- **Scoped Chat Session**: A conversation thread tied to a specific document and visitor identity. Not shared across identities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Files uploaded in one browser are visible only to that browser — verified in 100% of isolation test cases (different device, incognito, different browser).
- **SC-002**: A returning visitor's files remain accessible after closing and reopening the browser, in at least 95% of cases under normal browser usage (no manual storage clearing by the visitor).
- **SC-003**: A new visitor (incognito or new device) sees an empty file list within 2 seconds of the app loading, with no data from other sessions shown.
- **SC-004**: No visitor can access another visitor's files or chat history, even by directly manipulating URLs or request parameters — 0 unauthorized access events in security testing.
- **SC-005**: The identity assignment is seamless — visitors experience no login prompt, no visible delay, and no behavioral change compared to the current app.

## Assumptions

- No user registration or login system is in scope for this feature. Authentication support will be added in a future feature; this spec covers anonymous identity-based isolation only.
- Files belonging to a visitor who clears their browser storage become orphaned (inaccessible to that visitor). Cleanup of orphaned files is out of scope.
- The isolation guarantee applies to the application layer. Physical access to the database (e.g., by a developer with credentials) is outside the threat model for this feature.
- Visitors using a shared computer with the same browser profile are treated as the same identity — shared-computer user-switching is out of scope.

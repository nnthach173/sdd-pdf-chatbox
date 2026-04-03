# Feature Specification: User Authentication System

**Feature Branch**: `009-user-auth`
**Created**: 2026-04-03
**Status**: Draft
**Input**: User description: "Add login system with Google OAuth and/or email+password registration, per-user PDF storage with user info stored in database"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registers with Email and Password (Priority: P1)

A new visitor arrives at the application and sees a login/register page instead of the main app. They choose to create an account by entering their email address and a password. After submitting, they are logged in and can immediately access the main application to upload and manage their own PDF files.

**Why this priority**: Email/password registration is the foundational authentication method that all users can access regardless of whether they have a Google account. It establishes the core identity system that all other features depend on.

**Independent Test**: Can be fully tested by creating an account with email/password, logging in, uploading a PDF, logging out, logging back in, and verifying the PDF is still accessible. Delivers the core value of persistent, secure, per-user document management.

**Acceptance Scenarios**:

1. **Given** a visitor with no account, **When** they navigate to the app, **Then** they see a login/register page with options to sign up or sign in.
2. **Given** a visitor on the registration form, **When** they enter a valid email and password (minimum 8 characters) and submit, **Then** an account is created and they are redirected to the main application.
3. **Given** a visitor entering an email already in use, **When** they submit the registration form, **Then** they see a clear error message indicating the email is already registered.
4. **Given** a registered user on the login form, **When** they enter correct credentials, **Then** they are authenticated and redirected to the main application with access to their documents.
5. **Given** a user entering incorrect credentials, **When** they submit the login form, **Then** they see a generic error message (not revealing whether the email or password was wrong).

---

### User Story 2 - User Signs In with Google (Priority: P2)

A visitor chooses to sign in using their Google account. They click a "Sign in with Google" button, complete the Google OAuth flow, and are either registered automatically (first time) or logged in (returning user). They land in the main application with access to their documents.

**Why this priority**: Google OAuth provides a frictionless sign-in experience for users who prefer not to create yet another password. It significantly reduces registration abandonment but depends on the core auth infrastructure from P1.

**Independent Test**: Can be tested by clicking "Sign in with Google", completing the OAuth consent screen, and verifying the user lands in the main app with a profile linked to their Google account.

**Acceptance Scenarios**:

1. **Given** a visitor on the login page, **When** they click "Sign in with Google", **Then** they are redirected to Google's OAuth consent screen.
2. **Given** a first-time Google user completing OAuth, **When** they authorize the application, **Then** a new account is created using their Google email and name, and they are redirected to the main app.
3. **Given** a returning Google user, **When** they complete the OAuth flow, **Then** they are logged into their existing account with all their documents intact.
4. **Given** a user who previously registered with email/password using the same email as their Google account, **When** they sign in with Google, **Then** the accounts are linked and they can use either method to sign in going forward.

---

### User Story 3 - Authenticated User Manages Documents (Priority: P1)

A logged-in user uploads PDF files, and those files are stored under their authenticated identity. When they log in from a different device or browser, they see the same documents. No other user can see or access their files.

**Why this priority**: This is the core value proposition — replacing the fragile browser-local UUID system with real per-user isolation tied to authenticated identity. Without this, login has no practical benefit.

**Independent Test**: Can be tested by logging in on two different browsers, uploading a document in one, and verifying it appears in the other. Also test that a different user account cannot see those documents.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they upload a PDF, **Then** the document is associated with their authenticated account (not a browser-local ID).
2. **Given** a user who uploaded documents, **When** they log in from a different browser or device, **Then** they see all their previously uploaded documents.
3. **Given** two different authenticated users, **When** each views their document library, **Then** they only see their own documents and cannot access the other user's files.
4. **Given** a user who had documents under the old browser-local system, **When** they create an account and log in, **Then** they start with an empty document library. Old browser-local documents are not migrated and will be treated as orphaned data.

---

### User Story 4 - User Logs Out and Session Management (Priority: P2)

A logged-in user can log out of the application. After logging out, they are returned to the login page and cannot access any protected content until they sign in again. Sessions persist across browser tabs but expire after a reasonable period of inactivity.

**Why this priority**: Logout and session management are essential for security and multi-user scenarios (shared computers), but the core login flow must work first.

**Independent Test**: Can be tested by logging in, verifying access, clicking logout, and confirming the login page appears and protected routes are inaccessible.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they click "Sign out" from the user menu, **Then** their session is terminated and they are redirected to the login page.
2. **Given** a logged-out user, **When** they try to navigate directly to a protected page (e.g., document view), **Then** they are redirected to the login page.
3. **Given** a user with an active session, **When** they open a new browser tab to the app, **Then** they are automatically authenticated without needing to log in again.

---

### User Story 5 - User Profile Display (Priority: P3)

A logged-in user sees their identity in the application header or sidebar — their name, email, or avatar (from Google). This provides confirmation of which account they are using and gives access to sign-out functionality.

**Why this priority**: Profile display is a UX nicety that confirms identity, but the system works without it.

**Independent Test**: Can be tested by logging in and verifying the user's name/email appears in the header area, with a dropdown or menu containing a sign-out option.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they view the application header/sidebar, **Then** they see their display name or email address.
2. **Given** a Google-authenticated user, **When** they view their profile indicator, **Then** their Google profile name is displayed.
3. **Given** a logged-in user, **When** they click their profile indicator, **Then** a menu appears with at least a "Sign out" option.

---

### Edge Cases

- What happens when a user's session token expires mid-upload? The upload should fail gracefully with a prompt to re-authenticate.
- What happens when a user tries to access the app with a manipulated or expired authentication token? They should be redirected to the login page.
- What happens if Google OAuth is temporarily unavailable? The email/password option remains functional; the Google button shows an appropriate error.
- What happens when two users try to register with the same email using different methods (one via email, one via Google)? Accounts should be linked by email address.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an email/password registration flow with email validation and minimum password strength (8+ characters).
- **FR-002**: System MUST provide an email/password login flow that authenticates users and establishes a session.
- **FR-003**: System MUST provide Google OAuth sign-in as an alternative authentication method.
- **FR-004**: System MUST automatically create a user profile when a new user registers via either method.
- **FR-005**: System MUST link accounts when the same email is used across different authentication methods (email + Google).
- **FR-006**: System MUST replace the current browser-local UUID identity system with authenticated user identity for all document operations (upload, list, view, delete, chat).
- **FR-007**: System MUST protect all application routes — unauthenticated users can only access the login/register page.
- **FR-008**: System MUST provide a sign-out function that terminates the user session.
- **FR-009**: System MUST store user profile information (display name, email, avatar URL, authentication method).
- **FR-010**: System MUST display the authenticated user's identity (name or email) in the application interface.
- **FR-011**: System MUST ensure complete data isolation — users can only access their own documents and chat history.
- **FR-012**: System MUST maintain sessions across browser tabs and page refreshes without requiring re-authentication.

### Key Entities

- **User**: Represents an authenticated person. Key attributes: unique identifier, email address, display name, avatar URL, authentication method(s), account creation date.
- **Document** (existing, modified): Currently has `owner_id` as a browser-local UUID. Must be updated to reference the authenticated User entity instead.
- **Session**: Represents an active authenticated session. Key attributes: user reference, creation time, expiration time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can register and log in within 30 seconds using email/password.
- **SC-002**: Users can sign in via Google OAuth in under 15 seconds (including the Google consent screen).
- **SC-003**: 100% of document operations (upload, view, delete, chat) are gated behind authentication — no anonymous access to protected resources.
- **SC-004**: Users accessing the app from a new device see all their previously uploaded documents after logging in.
- **SC-005**: Zero cross-user data leakage — no user can view, modify, or delete another user's documents under any circumstance.
- **SC-006**: Sessions persist across page refreshes and new tabs without requiring re-login for at least 24 hours of activity.

## Clarifications

### Session 2026-04-03

- Q: Should existing browser-local documents be migrated to new authenticated accounts? → A: No migration. New accounts start fresh; old browser-local documents are orphaned.
- Q: Should users be able to delete their own account and data? → A: Deferred to a future iteration. No self-service account deletion in this feature.
- Q: Should orphaned browser-local documents be automatically cleaned up? → A: No. Leave orphaned data in place; handle manually via DB if needed later.

## Assumptions

- The application already uses Supabase, which provides built-in authentication services including email/password and Google OAuth — this is a reasonable platform choice but left to the planning phase.
- Password reset/recovery flow is deferred to a future iteration. Users who forget their password can re-register or use Google OAuth if they linked their account.
- Self-service account deletion is deferred to a future iteration. Account removal will be handled manually if needed.
- Email verification on registration is optional for the initial release — the system should work without requiring email confirmation, though it may be added later.
- The existing `documents` table `owner_id` column will need to transition from browser-local UUIDs to authenticated user IDs, but the migration strategy is an implementation concern. Orphaned browser-local documents will not be automatically cleaned up.
- Rate limiting on login attempts is assumed as a standard security practice.

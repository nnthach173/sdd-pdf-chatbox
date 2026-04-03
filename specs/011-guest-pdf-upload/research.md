# Research: Guest PDF Upload with Size Limit

**Feature**: 011-guest-pdf-upload
**Date**: 2026-04-03

## Decision 1: Guest Identity Transport Mechanism

**Decision**: Pass the browser-local guest UUID as an `X-Guest-ID` HTTP header.

**Rationale**: The frontend already stores (or can create) a UUID in `localStorage` (established by feature 008). Sending it as a dedicated header keeps the backend's auth logic clean — `Authorization: Bearer` remains exclusive to JWT tokens, avoiding ambiguity. A custom header (`X-Guest-ID`) is explicit, easy to validate (UUID v4 format check), and trivially stripped if the feature is rolled back.

**Alternatives considered**:
- Sending the UUID in the request body — rejected because document list/get/delete are GET/DELETE requests with no body.
- Sending it as a query parameter — rejected because it appears in server logs, browser history, and CORS preflight URLs, leaking the guest identity.
- Reusing `Authorization: Bearer <uuid>` — rejected because it conflates two distinct auth schemes and would require differentiating JWT vs. UUID inside the Bearer prefix check.

---

## Decision 2: Backend Guest Dependency Pattern

**Decision**: Add `get_user_or_guest()` alongside the existing `get_authenticated_user()`. Endpoints that need to serve both guests and auth users switch to the new dependency. Endpoints that remain auth-only keep the existing dependency unchanged.

**Rationale**: Avoids modifying the existing `get_authenticated_user` dependency (no breakage risk). The new dependency attempts JWT validation first; if no Bearer token is present it falls back to the `X-Guest-ID` header. This means future endpoints can opt in to guest access selectively, not globally.

**Alternatives considered**:
- Modifying `get_authenticated_user` to accept both — rejected because it changes behavior for endpoints that should remain auth-only (auth router endpoints).
- A separate guest-only dependency with no fallback to JWT — rejected because it would require duplicate endpoint definitions for the same route.

---

## Decision 3: Guest Flag on UserProfile

**Decision**: Add `is_guest: bool = False` to the existing `UserProfile` Pydantic model.

**Rationale**: The upload handler already receives a `UserProfile` and needs to branch on guest vs. auth user to apply the 1 MB limit. Adding `is_guest` to the existing model is the minimal change — no new type, no Union, no overloading. All existing callers default to `False` with no migration needed.

**Alternatives considered**:
- A separate `GuestProfile` type — rejected as over-engineering; the models share all the same fields, the only difference is the size limit logic.
- Passing `is_guest` as a separate FastAPI dependency parameter — rejected because it would require two Depends() per endpoint instead of one.

---

## Decision 4: Frontend API Header Strategy

**Decision**: Replace per-function `authHeaders()` calls with a shared `requestHeaders()` function in `api.ts` that tries Supabase session first, falls back to `X-Guest-ID`.

**Rationale**: Avoids duplicating the fallback logic across every API function. The function is async, so it can call `supabase.auth.getSession()` without blocking. Guest UUID is read from (or written to) `localStorage` in the same call, meaning no component needs to pass the guest ID down as a prop.

**Alternatives considered**:
- Passing `isGuest` as a prop to every API call — rejected because it leaks auth state into every call site and requires all callers to know the user's auth status up front.
- Having two separate API modules (guest vs. auth) — rejected as unnecessary duplication.

---

## Decision 5: Guest Size Limit UX

**Decision**: Show the 1 MB limit on the upload drop-zone for guests, with a sign-in call-to-action link in the error message when the limit is exceeded.

**Rationale**: Guests should understand the constraint before attempting an upload (preventive), and receive an actionable recovery path if they exceed it (corrective). The sign-in CTA in the error converts frustrated guests into registered users.

**Alternatives considered**:
- Showing no limit hint until the error fires — rejected because it creates surprise friction.
- Disabling the upload button for files over 1 MB via file input restrictions — rejected because browsers don't support per-size `accept` attributes; only client-side validation at file selection time is reliable.

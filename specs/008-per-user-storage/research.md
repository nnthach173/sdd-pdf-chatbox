# Research: Per-User Isolated PDF Storage

**Feature**: 008-per-user-storage
**Phase**: 0 — Research & Decision Making
**Date**: 2026-03-30

---

## Decision 1: Identity Mechanism

**Decision**: Browser-local UUID stored in `localStorage`, sent as a custom HTTP header (`X-User-ID`) on every request.

**Rationale**:
- `localStorage` is natively partitioned per browser profile and is inaccessible in incognito windows — which is precisely the isolation boundary the spec requires.
- No external auth service is needed. A UUID is generated with the browser's built-in `crypto.randomUUID()` on first visit.
- The identity is opaque (just a UUID string). The backend treats it as a stable owner tag, never as authentication. No JWT, no session cookie, no network call required.
- Satisfies spec FR-001 through FR-003 exactly: auto-assigned, persists across reloads in the same profile, does not carry across devices or incognito.

**Alternatives considered**:

| Option | Why Rejected |
|--------|-------------|
| Supabase Anonymous Auth (JWT) | Adds auth infrastructure, JWT verification on backend, and a network call on every page load. Constitution Principle VI (Simplicity/YAGNI) prohibits this complexity when a simpler mechanism suffices for the current scope. Supabase Auth will be introduced when real user accounts are added. |
| Session cookie | Cookies can be shared across tabs but not across incognito by default — similar to localStorage. However, cookies require backend Set-Cookie handling and add CSRF considerations that a custom header avoids. |
| IP-based identity | Non-persistent, shared by households/offices, not user-controllable. Fails FR-002 (persistence) and FR-003 (isolation). |

---

## Decision 2: Where Isolation Is Enforced

**Decision**: Application layer only — backend queries always filter by `owner_id`. Supabase Row-Level Security (RLS) is NOT enabled for this feature.

**Rationale**:
- The backend already uses the `service_role` key, which bypasses RLS by design. Enabling RLS without switching to user-scoped JWTs provides no actual protection (service_role ignores it).
- Enforcing `WHERE owner_id = ?` in every backend query provides sufficient isolation for the current threat model (spec Assumption: "physical DB access is outside the threat model").
- RLS + Supabase Auth will be the right investment when real accounts are added. Adding it now for anonymous users would add complexity without benefit.
- Constitution Principle VI: no premature security infrastructure.

**Alternatives considered**:

| Option | Why Rejected |
|--------|-------------|
| Supabase RLS with anon JWT | Requires switching auth context per request, setting up RLS policies, and issuing Supabase JWTs from the frontend. Significant complexity; save for the auth feature. |
| Separate Supabase bucket per user | Bucket creation is an admin operation that can't happen at runtime on free tier. Not feasible. |

---

## Decision 3: Storage Path Structure

**Decision**: Change Supabase Storage file paths from `{doc_id}/{filename}` to `{owner_id}/{doc_id}/{filename}`.

**Rationale**:
- Namespacing by `owner_id` in the path mirrors the isolation in the database and makes storage browsable by owner (useful for future cleanup jobs).
- Signed URL generation still works identically — just pass the new path to `create_signed_url()`.
- Deletion paths update accordingly in the delete endpoint.
- No Supabase policy changes required (bucket remains the same; path is just a string).

---

## Decision 4: Schema Changes

**Decision**: Add `owner_id TEXT NOT NULL` to the `documents` table only. Do NOT add `owner_id` to `document_chunks` or `chat_messages`.

**Rationale**:
- `document_chunks` is only queried via the `match_document_chunks` RPC filtered by `document_id`. Ownership is already implied by `documents.owner_id` → no change needed.
- `chat_messages` is always queried `WHERE document_id = ?`. Ownership verification happens at the document level before any chat query — denormalizing `owner_id` into `chat_messages` would be premature.
- Constitution Principle VI: add columns only where they are directly needed.

**Migration note**: Existing rows in `documents` have no `owner_id`. For development environments, the recommended path is to truncate existing data (or assign a sentinel `owner_id = 'legacy'`). Since this is a local dev project with no real user data, truncation is acceptable.

---

## Decision 5: Header vs. Request Body for Identity

**Decision**: Pass identity as a custom HTTP header `X-User-ID`, not in the request body or query string.

**Rationale**:
- Headers are a natural place for cross-cutting request context (analogous to `Authorization` headers).
- Avoids changing the JSON shape of every request body.
- Query strings are visible in server logs and browser history — unsuitable for an identity token.
- A FastAPI `Header` dependency can be declared once and reused across all routers.

---

## Decision 6: Missing/Invalid Identity Handling

**Decision**: If a request arrives without an `X-User-ID` header (or with an empty value), the backend returns HTTP 400 with a user-friendly error message ("Your session could not be identified. Please reload the page."). It does NOT auto-generate a server-side ID.

**Rationale**:
- Server-side ID generation would create orphaned server identities for every bot, crawler, or misconfigured client.
- The frontend always sets the header (generated on first load). A missing header signals a genuine bug, not a normal use case.
- User-friendly message satisfies Constitution Principle V.
- 400 is appropriate (bad request from client side).

---

## Summary Table

| Concern | Decision |
|---------|----------|
| Identity source | `crypto.randomUUID()` in browser on first visit |
| Identity persistence | `localStorage` key `pdf-chatbox-user-id` |
| Identity transport | `X-User-ID` HTTP header on all requests |
| Enforcement layer | Backend application layer (`WHERE owner_id = ?`) |
| DB schema change | Add `owner_id TEXT NOT NULL` to `documents` only |
| Storage path change | `{owner_id}/{doc_id}/{filename}` |
| RLS | Not used (service_role key; defer to auth feature) |
| Missing header handling | HTTP 400 with user-friendly message |
| Existing data | Truncate or assign sentinel — documented in quickstart |

# Research: User Authentication System

**Branch**: `009-user-auth` | **Date**: 2026-04-03

## R1: Authentication Provider Choice

**Decision**: Use Supabase Auth (built-in to the existing Supabase instance)

**Rationale**:
- The project already uses Supabase for database and storage — Auth is included at no extra cost
- Supabase Auth provides email/password, Google OAuth, JWT sessions, and account linking out of the box
- No additional services or infrastructure needed
- Free tier supports 50,000 monthly active users — far exceeds project needs
- Handles password hashing, token refresh, session persistence automatically

**Alternatives considered**:
- **NextAuth.js / Auth.js**: Would require a separate session store and more glue code. Doesn't leverage existing Supabase infra.
- **Custom JWT auth**: Significant effort to build password hashing, token management, OAuth flows. No benefit over Supabase Auth.
- **Firebase Auth**: Would introduce a second cloud provider. More complexity, no benefit.

## R2: Frontend-Backend Auth Flow

**Decision**: Frontend authenticates directly with Supabase Auth; backend validates JWT tokens

**Rationale**:
- Standard Supabase pattern: frontend uses `@supabase/ssr` for sign up/in/out
- Frontend receives a JWT access token from Supabase session
- Frontend sends `Authorization: Bearer <token>` header on every API call to FastAPI
- Backend verifies the JWT using the Supabase JWT secret (symmetric HS256 verification) or by calling `supabase.auth.get_user(token)`
- This avoids the backend needing auth endpoints for signup/login — Supabase handles it
- Only backend auth endpoint needed: `GET /auth/me` for frontend to verify backend can read the token

**Alternatives considered**:
- **Backend-mediated auth** (frontend sends credentials to FastAPI, FastAPI calls Supabase): More code, more latency, no security benefit. Rejected per YAGNI.

## R3: JWT Verification Strategy

**Decision**: Use `supabase.auth.get_user(token)` for JWT verification in the backend

**Rationale**:
- The `supabase-py` library already provides `auth.get_user(token)` which validates the token and returns user data
- This verifies the token against Supabase's auth service (not just signature verification) — catches revoked tokens
- Simpler than manual JWT decoding with `python-jose` or `PyJWT`
- Small latency cost (~50ms per request) is acceptable for this scale
- Existing `get_supabase()` singleton is already available in dependencies

**Alternatives considered**:
- **Local JWT decode with SUPABASE_JWT_SECRET**: Faster (no network call) but doesn't catch revoked tokens. Would require adding `PyJWT` dependency. Could be a future optimization if latency becomes an issue.

## R4: User Profile Storage

**Decision**: Create a `profiles` table in the `public` schema with a database trigger for auto-creation

**Rationale**:
- Supabase Auth stores user data in `auth.users` (auth schema) — not directly queryable from application code via the standard client
- Standard Supabase pattern: a `public.profiles` table mirrors essential auth data (display name, email, avatar URL)
- A Supabase database trigger on `auth.users` INSERT auto-creates the profile row — no application code needed for profile creation
- The profile's `id` column matches `auth.users.id` — same UUID used as `owner_id` in documents

**Alternatives considered**:
- **Query `auth.users` directly via service role**: Possible but mixes concerns and bypasses RLS patterns. Not recommended by Supabase docs.
- **No profiles table, just use auth metadata**: Would work for simple display, but harder to query/join if needed later. Profile table is the standard pattern.

## R5: Frontend Auth Library

**Decision**: Use `@supabase/ssr` (the current Supabase library for server-rendered frameworks)

**Rationale**:
- `@supabase/ssr` is the official Supabase library for Next.js App Router
- Handles cookie-based session storage that works with SSR and client-side rendering
- Replaces the deprecated `@supabase/auth-helpers-nextjs`
- Provides `createBrowserClient()` for client components and `createServerClient()` for server components/middleware

**Alternatives considered**:
- **`@supabase/auth-helpers-nextjs`**: Deprecated in favor of `@supabase/ssr`
- **Manual cookie/localStorage management**: More code, error-prone, no benefit

## R6: Route Protection Strategy

**Decision**: Client-side auth guard component (AuthGuard) wrapping the main app layout

**Rationale**:
- The app is entirely client-rendered (`'use client'` throughout) — Next.js middleware won't have access to Supabase session cookies reliably without extra server-side setup
- A simple `AuthGuard` component checks for an active Supabase session on mount, redirects to `/auth` if absent
- The login page (`/auth`) is the only unprotected route
- Simpler than setting up Next.js middleware with server-side Supabase client for this app's architecture

**Alternatives considered**:
- **Next.js middleware**: Would require server-side Supabase client configuration and cookie forwarding. More robust for SSR apps, but this app is CSR-only. Over-engineered for current needs.

## R7: Google OAuth Setup

**Decision**: Configure Google OAuth via Supabase Dashboard + Google Cloud Console

**Rationale**:
- Supabase Auth supports Google as a built-in provider — just needs Client ID and Client Secret configured in the Supabase dashboard
- OAuth callback URL is handled by Supabase (`<supabase-url>/auth/v1/callback`)
- Frontend triggers Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Account linking (same email) is handled automatically by Supabase when "Auto-confirm users" is enabled

**Setup required**:
- Google Cloud Console: Create OAuth 2.0 credentials (Client ID + Secret)
- Supabase Dashboard: Add Google provider with the credentials
- Supabase Dashboard: Add redirect URL for the app (`http://localhost:3000/auth/callback` for dev)

## R8: Migration from Browser-Local UUID

**Decision**: No migration. Clean cutover — new auth system replaces old UUID system entirely.

**Rationale**:
- Per clarification: new accounts start fresh, old browser-local documents are orphaned
- The `documents.owner_id` column changes from browser UUID strings to Supabase Auth user UUIDs
- No data type change needed (both are UUID strings stored as TEXT)
- Old rows remain in the database but are inaccessible (no user will have the old browser UUID as their auth ID)
- Storage path structure (`{owner_id}/{doc_id}/{filename}`) remains the same — just the owner_id values change

**Cleanup note**: Orphaned data can be manually purged later via a SQL query: `DELETE FROM documents WHERE owner_id NOT IN (SELECT id::text FROM auth.users)`

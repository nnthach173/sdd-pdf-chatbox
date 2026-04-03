# Research: Guest Homepage Access

**Branch**: `010-guest-homepage-access` | **Date**: 2026-04-03

## Overview

This feature is a purely frontend routing change. All unknowns are resolvable by reading the existing codebase — no external research is required. Findings below are derived from reading the live source files.

---

## Finding 1: Current Auth Redirect Mechanism

**Decision**: The auto-redirect lives in `AuthGuard.tsx` (client component), not in Next.js middleware.

**Rationale**: `AuthGuard` wraps the entire app in `layout.tsx`. It calls `supabase.auth.getSession()` on mount and redirects to `/auth` if no session is found and the current path is not `/auth`. This is the single point of change for FR-001/FR-002.

**Change required**: Add `/` to the list of paths that are allowed through without a session. When redirecting a protected path, encode the full URL (pathname + search) as a `?redirect=` query parameter on the `/auth` destination.

**Alternatives considered**:
- Next.js `middleware.ts`: Would require adding a middleware file and handling Supabase session cookies server-side. More robust long-term but significantly more complex for this scope — rejected per YAGNI.
- Per-page `useEffect` guards: Would require touching every page that needs auth. Not scalable — rejected.

---

## Finding 2: Guest State in UserMenu

**Decision**: `UserMenu` currently returns `null` when `user === null` (line 59). The fix is to render a Login button instead.

**Rationale**: `AppHeader` renders `<UserMenu />` in the top-right on every page. Making `UserMenu` guest-aware (Login button vs. user dropdown) is the minimal, isolated change for FR-003/FR-004.

**Change required**: When `user` is null after the initial Supabase `getUser()` call, render a styled Login button that navigates to `/auth`. No new component needed.

---

## Finding 3: Post-Login Return URL

**Decision**: `AuthForm` currently hardcodes `router.push('/')` after login (line 41). It must instead read a `?redirect=` query param via `useSearchParams()`.

**Rationale**: `AuthForm` is a client component (`'use client'`). `useSearchParams()` is available and safe. The redirect value must be validated to prevent open-redirect attacks: only same-origin paths (starting with `/`) are accepted.

**Change required**: Add `useSearchParams()`, extract `redirect` param, validate it starts with `/`, pass to `router.push()` after login. Same applies to the Google OAuth `redirectTo` — not in scope for this feature (OAuth callback flow already goes to `/auth/callback`).

---

## Finding 4: Guest-Aware Homepage Content

**Decision**: `HomeClient.tsx` needs to check auth state and conditionally handle upload and doc-view actions.

**Rationale**:
- The **upload trigger** is passed as `onUpload` to `AppSidebar`. For guests, `onUpload` should redirect to `/auth?redirect=/` instead of calling `libraryViewRef.current?.triggerUpload()`.
- The **chat view** (`ChatView`) is shown when `activeDocId` is set. For a guest with `?doc=<id>` in the URL, rendering `ChatView` would result in failed API calls. Instead, show an inline "Log in to view this document" prompt.

**Change required**: `HomeClient` reads its own auth state (same `supabase.auth.getUser()` pattern used in `UserMenu`). Two conditional branches keyed on `isGuest`:
1. `onUpload`: guest → `router.push('/auth?redirect=/')`, authenticated → existing upload trigger
2. Chat view slot: guest + `activeDocId` → login prompt card; authenticated → existing `<ChatView />`

**Alternatives considered**:
- Pass auth state down from `AuthGuard` via React context: more elegant long-term but adds a context provider for a single use — rejected per YAGNI.
- Rely on `ChatView` failing gracefully: would produce silent failures or cryptic errors — rejected per Principle V.

---

## Finding 5: Protected Route Redirect URL Encoding

**Decision**: Use `encodeURIComponent(pathname + search)` when building the `/auth?redirect=` URL inside `AuthGuard`.

**Rationale**: The return URL may include `?doc=<id>` query params. These must be encoded to survive as a query parameter value on the `/auth` URL. On the receiving end (`AuthForm`), `useSearchParams().get('redirect')` will already decode the value.

**No alternatives needed** — standard URL encoding is the unambiguous correct approach.

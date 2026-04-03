# Tasks: User Authentication System

**Input**: Design documents from `/specs/009-user-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-auth.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story. User stories ordered by priority (P1 → P2 → P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for auth features

- [X] T001 Install frontend auth dependencies: `@supabase/supabase-js` and `@supabase/ssr` in frontend/package.json
- [X] T002 [P] Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables to frontend/.env.local (and document in quickstart.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Run SQL migration in Supabase: create `profiles` table, `idx_profiles_email` index, `handle_new_user()` trigger function, and `on_auth_user_created` trigger per data-model.md
- [X] T004 Create Supabase browser client utility in frontend/lib/supabase.ts — export `createClient()` using `createBrowserClient()` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [X] T005 [P] Add `UserProfile` Pydantic schema (id, email, display_name, avatar_url) in backend/models/schemas.py
- [X] T006 Replace `get_owner_id()` dependency with `get_authenticated_user()` in backend/routers/dependencies.py — verify JWT via `supabase.auth.get_user(token)`, extract user ID from Bearer token, raise 401 on invalid/missing token
- [X] T007 [P] Create auth router `GET /auth/me` in backend/routers/auth.py — uses `get_authenticated_user` dependency, queries `profiles` table, returns UserProfile response (200) or 401 per contracts/api-auth.md
- [X] T008 Register auth router in backend/main.py with `app.include_router(auth_router)`
- [X] T009 Update frontend/lib/api.ts — replace `getUserId()` / `X-User-ID` header with `getAccessToken()` from Supabase session, send `Authorization: Bearer <token>` on all API calls

**Checkpoint**: Auth infrastructure ready — user story implementation can now begin

---

## Phase 3: User Story 1 — New User Registers with Email and Password (Priority: P1) 🎯 MVP

**Goal**: Visitors see a login/register page. They can create an account with email/password, get authenticated, and access the main app.

**Independent Test**: Create account with email/password → log in → verify access to main app → log out → log back in → still works.

- [X] T010 [P] [US1] Create login/register page at frontend/app/auth/page.tsx — client component that renders AuthForm, accessible without authentication
- [X] T011 [P] [US1] Create AuthForm component in frontend/components/AuthForm.tsx — toggle between Sign In and Sign Up modes; email + password fields; minimum 8-char password validation; call `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`; show generic error on failure (not revealing whether email or password was wrong); redirect to `/` on success
- [X] T012 [US1] Create AuthGuard component in frontend/components/AuthGuard.tsx — check Supabase session on mount via `supabase.auth.getSession()`; listen for `onAuthStateChange`; redirect to `/auth` if no session; show loading state while checking; render children when authenticated
- [X] T013 [US1] Wrap main app layout with AuthGuard in frontend/app/layout.tsx — AuthGuard checks `usePathname()` and skips redirect when path starts with `/auth`; unauthenticated users on all other routes are redirected to `/auth`; show loading spinner while session is resolving

**Checkpoint**: Users can register with email/password and access the app. Core authentication works end-to-end.

---

## Phase 4: User Story 3 — Authenticated User Manages Documents (Priority: P1) 🎯 MVP

**Goal**: Logged-in user's documents are stored under their Supabase Auth user ID. Documents persist across devices/browsers. No cross-user data leakage.

**Independent Test**: Log in on two browsers → upload a PDF in one → verify it appears in the other → verify a different user cannot see it.

- [X] T014 [P] [US3] Update backend/routers/documents.py — replace `owner_id: str = Depends(get_owner_id)` with `user = Depends(get_authenticated_user)` and use `user.id` as `owner_id` in upload, list, get, and delete endpoints
- [X] T015 [P] [US3] Update backend/routers/chat.py — replace `owner_id: str = Depends(get_owner_id)` with `user = Depends(get_authenticated_user)` and use `user.id` as `owner_id` in chat and history endpoints
- [X] T016 [US3] Remove browser-local UUID generation and storage from frontend — delete `getUserId()` in frontend/lib/api.ts (or its caller), remove any `localStorage` UUID logic; all identity now comes from Supabase Auth session

**Checkpoint**: Document operations are fully gated behind authentication. Documents are isolated per authenticated user. The old browser-local UUID system is removed.

---

## Phase 5: User Story 2 — User Signs In with Google (Priority: P2)

**Goal**: Users can sign in via Google OAuth. First-time Google users get an account auto-created. Returning Google users access their existing documents. Same-email accounts are linked.

**Independent Test**: Click "Sign in with Google" → complete OAuth → land in main app with profile linked to Google account.

- [X] T017 [US2] Add "Sign in with Google" button to AuthForm in frontend/components/AuthForm.tsx — call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`
- [X] T018 [US2] Create OAuth callback route at frontend/app/auth/callback/route.ts — exchange auth code for session using `@supabase/ssr` server client, redirect to `/` on success or `/auth` on error

**Checkpoint**: Google OAuth works end-to-end. Email + Google account linking handled by Supabase automatically.

---

## Phase 6: User Story 4 — User Logs Out and Session Management (Priority: P2)

**Goal**: Users can sign out. After logout, they're redirected to login page and cannot access protected content. Sessions persist across tabs.

**Independent Test**: Log in → verify access → click sign out → confirm redirect to login page → verify protected routes are inaccessible.

- [X] T019 [US4] Create UserMenu component in frontend/components/UserMenu.tsx — display user email/name from Supabase session; dropdown with "Sign out" option; call `supabase.auth.signOut()` on click; redirect to `/auth` after sign out
- [X] T020 [US4] Add UserMenu to application header in frontend/components/HomeClient.tsx — render UserMenu in the header/sidebar area alongside existing controls

**Checkpoint**: Full session lifecycle works — login, persist across tabs, sign out.

---

## Phase 7: User Story 5 — User Profile Display (Priority: P3)

**Goal**: Logged-in user sees their identity (name, email, avatar) in the app header. Google users see their Google profile name/avatar.

**Independent Test**: Log in → verify name/email appears in header → Google user sees Google profile name.

- [X] T021 [US5] Enhance UserMenu in frontend/components/UserMenu.tsx — fetch profile from `GET /auth/me` endpoint for display name and avatar; show Google avatar if available; fall back to email if no display name
- [X] T022 [US5] Style profile indicator and dropdown menu in frontend/components/UserMenu.tsx — avatar circle or initials, dropdown with user info and sign-out button, consistent with existing shadcn/ui design

**Checkpoint**: User identity is visible in the UI. Profile display complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and validation across all stories

- [X] T023 Handle expired session during upload — detect 401 response in frontend/lib/api.ts, prompt re-authentication by redirecting to `/auth`
- [X] T024[P] Handle Google OAuth unavailability gracefully — show error message on Google button if OAuth fails, email/password remains functional (in frontend/components/AuthForm.tsx)
- [ ] T024b [P] Verify account linking — register with email/password, then sign in with Google using the same email; confirm Supabase links both identities to one account and documents are shared (validates FR-005)
- [ ] T025 Run quickstart.md validation — walk through all setup steps and verify the full flow: register → upload → sign out → sign back in → documents persist → Google OAuth → profile display. Also verify: (a) session survives page refresh without re-login (FR-012), (b) opening a new tab preserves auth state (FR-012/SC-006), (c) session auto-refreshes after >1 hour of activity (SC-006 — 24h persistence via Supabase refresh tokens)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 must complete before T004, T009)
- **US1 (Phase 3)**: Depends on Foundational — needs Supabase client (T004), auth guard pattern, API auth (T009)
- **US3 (Phase 4)**: Depends on Foundational (T006) — can run in parallel with US1 backend tasks
- **US2 (Phase 5)**: Depends on US1 (AuthForm exists at T011) — adds Google button to existing form
- **US4 (Phase 6)**: Depends on US1 (auth must work to test logout)
- **US5 (Phase 7)**: Depends on US4 (UserMenu exists at T019) — enhances it with profile data
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story dependencies
- **US3 (P1)**: After Foundational — can parallelize backend work (T014, T015) with US1 frontend work (T010, T011)
- **US2 (P2)**: After US1 (extends AuthForm)
- **US4 (P2)**: After US1 (needs auth working to test logout)
- **US5 (P3)**: After US4 (extends UserMenu component)

### Within Each User Story

- Models/schemas before services
- Services before endpoints
- Backend before frontend integration
- Core implementation before polish

### Parallel Opportunities

- T002, T005, T007 can run in parallel (different files, no dependencies)
- T010, T011 can run in parallel (different files)
- T014, T015 can run in parallel (different backend routers)
- US1 frontend work (T010-T013) can overlap with US3 backend work (T014-T015)

---

## Parallel Example: Foundational Phase

```bash
# After T003 (DB migration) and T004 (Supabase client) complete:
Task: T005 — UserProfile schema in backend/models/schemas.py
Task: T007 — Auth router in backend/routers/auth.py
# These touch different files with no shared dependencies
```

## Parallel Example: US1 + US3

```bash
# After Foundational complete, launch in parallel:
Task: T010 — Auth page (frontend/app/auth/page.tsx)
Task: T011 — AuthForm component (frontend/components/AuthForm.tsx)
Task: T014 — Update documents router (backend/routers/documents.py)
Task: T015 — Update chat router (backend/routers/chat.py)
# All touch different files; US3 backend can proceed while US1 frontend is built
```

---

## Implementation Strategy

### MVP First (US1 + US3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (email/password registration)
4. Complete Phase 4: US3 (document management with auth)
5. **STOP and VALIDATE**: Register, upload PDF, sign out, sign back in, verify PDF persists
6. Deploy/demo if ready — core value delivered

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 + US3 → Auth + documents work → **MVP!**
3. US2 → Google OAuth adds convenience
4. US4 → Logout/session management adds security
5. US5 → Profile display adds polish
6. Polish → Edge cases and validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps tasks to spec.md user stories
- Manual testing only (no test framework configured per plan.md)
- SQL migration (T003) must be run manually in Supabase SQL Editor
- Google OAuth requires Supabase Dashboard + Google Cloud Console configuration (see quickstart.md steps 1-2)
- Old browser-local UUID documents become orphaned — no migration per clarification
- Rate limiting on login attempts (spec assumption) is handled by Supabase Auth's built-in rate limiter (default: 30 requests/hour per IP for signup, 360/hour for token). No custom implementation needed.

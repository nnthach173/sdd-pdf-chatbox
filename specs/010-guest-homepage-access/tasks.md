# Tasks: Guest Homepage Access

**Input**: Design documents from `/specs/010-guest-homepage-access/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No test tasks generated — not requested in spec. Use quickstart.md for manual validation.

**Organization**: Tasks grouped by user story. 4 files modified, no new files created.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Web application: `frontend/components/`, `frontend/app/`

---

## Phase 1: Setup

**Not applicable** — this feature modifies 4 existing files only. No new project structure or dependencies required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Not applicable** — all changes are isolated to individual components with no shared infrastructure prerequisites. User story phases can begin immediately.

---

## Phase 3: User Story 1 - Browse as Guest (Priority: P1) 🎯 MVP

**Goal**: Unauthenticated visitors land on the homepage without being redirected. The same layout is shown to guests, with upload/chat actions replaced by login prompts.

**Independent Test**: Open app in incognito. Navigate to `http://localhost:3000/`. Homepage renders. No redirect to `/auth`. Upload action shows a login prompt instead of triggering an upload dialog. Navigating directly to `http://localhost:3000/?doc=any-id` shows a login prompt instead of a broken ChatView.

### Implementation for User Story 1

- [X] T001 [US1] Modify `AuthGuard` to make `/` public: remove the redirect-to-`/auth` logic when `pathname === '/'`; when redirecting any other protected route, include `?redirect=<encodeURIComponent(pathname + search)>` in the redirect URL — in `frontend/components/AuthGuard.tsx`

- [X] T002 [P] [US1] Modify `HomeClient` to detect guest state via `supabase.auth.getUser()`: (a) if guest, pass `onUpload={() => router.push('/auth?redirect=/')}` to `AppSidebar` instead of the upload trigger; (b) if guest and `activeDocId` is set, render a centered login-prompt card ("Log in to view this document" + link to `/auth?redirect=/?doc=<activeDocId>`) in place of `<ChatView />` — in `frontend/components/HomeClient.tsx`

**Checkpoint**: User Story 1 is complete when incognito navigation to `/` loads the homepage without redirect, and upload + doc-link actions show login prompts instead of breaking.

---

## Phase 4: User Story 2 - Access Login from Homepage (Priority: P2)

**Goal**: A "Log In" button appears in the top-right corner for guests. Clicking it navigates to the login page. After login, the user is returned to their originally intended destination.

**Independent Test**: As a guest on the homepage, a "Log In" button is visible in the top-right. Clicking it navigates to `/auth`. After logging in, user is returned to `/` (or the `?redirect=` destination if set).

### Implementation for User Story 2

- [X] T003 [P] [US2] Modify `UserMenu` to render a "Log In" button when `user === null` (instead of returning `null`): button navigates to `/auth`, styled consistently with the existing header actions — in `frontend/components/UserMenu.tsx`

- [X] T004 [P] [US2] Modify `AuthForm` to read the `?redirect=` query param via `useSearchParams()`; after successful email/password login or sign-up, navigate to the decoded redirect value if it starts with `/`, otherwise fall back to `/` — in `frontend/components/AuthForm.tsx`

**Checkpoint**: User Story 2 is complete when the Login button is visible for guests, clicking it goes to `/auth`, and after login the user lands at their intended destination.

---

## Phase 5: User Story 3 - Authenticated User Experience Unchanged (Priority: P3)

**Goal**: Logged-in users see no change — their session, documents, and header controls remain exactly as before.

**Independent Test**: Log in, navigate to `/`. Homepage loads in authenticated state. User menu (avatar/initials) visible in top-right. No Login button present. Upload and chat work normally.

### Implementation for User Story 3

No code changes required. This story is validated entirely by running quickstart.md tests 4 and 8:
- **Test 4**: Authenticated user navigates to `/` → sees homepage in authenticated state
- **Test 8**: Logged-in user → no Login button visible; user menu present

The changes in T001–T004 are designed to preserve all authenticated behavior by branching on auth state rather than replacing it.

**Checkpoint**: User Story 3 is complete when an authenticated user's experience is indistinguishable from the pre-feature state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and consistency check across all stories

- [ ] T005 Run all 8 manual test scenarios from `specs/010-guest-homepage-access/quickstart.md` and confirm each passes
- [ ] T006 [P] Verify login prompt UI (from T002/T003) is visually consistent with the existing design system (color, typography, spacing) — compare with existing `UserMenu` button styles in `frontend/components/UserMenu.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 & 2**: Not applicable
- **Phase 3 (US1)**: Start immediately — no prerequisites
- **Phase 4 (US2)**: Can begin in parallel with Phase 3 (T003, T004 touch different files than T001, T002); however, US2 end-to-end behavior (return-URL redirect working) is only fully testable after T001 is complete
- **Phase 5 (US3)**: Validate after Phase 3 and Phase 4 are both complete
- **Phase 6 (Polish)**: After all story phases complete

### User Story Dependencies

- **US1 (P1)**: No dependencies — start immediately
- **US2 (P2)**: Logically depends on US1 (the login button only matters once the homepage is publicly accessible), but T003/T004 can be written in parallel since they touch different files
- **US3 (P3)**: Validation only; depends on US1 + US2 both complete

### Within Each User Story

- **T001** must complete before US1 can be independently validated
- **T002, T003, T004** are all [P] — different files, no code-level dependencies on each other

### Parallel Opportunities

- T002, T003, T004 can all be written simultaneously (each touches a different file)
- T001 is the only sequencing gate (validate guest routing works before validating downstream behavior)

---

## Parallel Example: All User Story Work

```text
# After T001 is complete, launch these in parallel:
T002 — HomeClient.tsx (guest-aware upload + doc-view)
T003 — UserMenu.tsx (Login button for guests)
T004 — AuthForm.tsx (return URL after login)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: AuthGuard — make `/` public
2. Complete T002: HomeClient — guest-aware actions
3. **STOP and VALIDATE**: Open incognito, navigate to `/`, confirm homepage loads, confirm upload prompt shows
4. Optionally stop here and ship — the homepage is now accessible to guests

### Incremental Delivery

1. T001 → Validate US1 independently (incognito, no redirect)
2. T002 → Validate guest prompts on homepage
3. T003 → Validate Login button visible in top-right
4. T004 → Validate return URL after login
5. T005/T006 → Final polish and full test suite

---

## Notes

- [P] tasks = different files, no dependencies — safe to implement simultaneously
- No new files created; no backend changes; no dependency changes
- Each story can be demonstrated to the user independently after its checkpoint
- Commit after T001 (US1 complete) and again after T003+T004 (US2 complete)
- Avoid: modifying `AppHeader.tsx` directly — `UserMenu` handles the guest state internally

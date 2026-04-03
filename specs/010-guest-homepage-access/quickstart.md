# Quickstart & Testing Guide: Guest Homepage Access

**Branch**: `010-guest-homepage-access` | **Date**: 2026-04-03

## Setup

No new environment variables or dependencies. Run the app as normal:

```bash
cd frontend && npm run dev
cd backend && uvicorn main:app --reload
```

## Manual Test Plan

### Test 1 — Guest lands on homepage (FR-001, FR-002, SC-001)

1. Open a private/incognito browser window
2. Navigate to `http://localhost:3000/`
3. **Expected**: Homepage loads; no redirect to `/auth`
4. **Expected**: Login button visible in top-right corner

### Test 2 — Login button navigates to login page (FR-003, FR-004, SC-002)

1. As a guest on the homepage, click the Login button (top-right)
2. **Expected**: Navigated to `/auth`
3. **Expected**: Login form displayed

### Test 3 — Login from homepage returns user to homepage (FR-005, SC-005)

1. From `/auth`, log in with valid credentials
2. **Expected**: Redirected back to `/` (homepage)
3. **Expected**: User menu (avatar/initials) appears in top-right; Login button gone

### Test 4 — Authenticated user sees no change (FR-006, SC-003)

1. Log in normally
2. Navigate to `http://localhost:3000/`
3. **Expected**: Homepage in authenticated state — document list, upload button functional, user menu visible

### Test 5 — Guest upload action redirects to login (FR-007, FR-009, SC-004)

1. As a guest on the homepage, click the Upload button (sidebar or library view)
2. **Expected**: Redirected to `/auth` (with return URL)
3. Log in
4. **Expected**: Returned to homepage

### Test 6 — Guest with direct protected URL redirects to login with return (FR-010, SC-005)

1. As a guest, navigate to `http://localhost:3000/?doc=some-doc-id`
2. **Expected**: Login prompt shown (not a broken chat view, not a silent failure)
3. Click login / redirected to `/auth?redirect=...`
4. Log in
5. **Expected**: Returned to `/?doc=some-doc-id`, document opens

### Test 7 — Session expiry (Edge case)

1. Log in, then manually clear Supabase session tokens in DevTools → Application → Local Storage
2. Reload `http://localhost:3000/`
3. **Expected**: Homepage shown in guest state (Login button visible); no error

### Test 8 — Direct navigation to `/auth` as guest (Edge case)

1. As a guest, navigate directly to `http://localhost:3000/auth`
2. **Expected**: Login page shown normally

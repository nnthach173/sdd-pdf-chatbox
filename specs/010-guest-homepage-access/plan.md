# Implementation Plan: Guest Homepage Access

**Branch**: `010-guest-homepage-access` | **Date**: 2026-04-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-guest-homepage-access/spec.md`

## Summary

Remove the automatic redirect that sends unauthenticated users to the login page. The homepage (`/`) becomes publicly accessible; guests see the same layout as authenticated users, but upload and chat actions are replaced with login prompts that redirect to `/auth` with a return URL. The `AuthGuard` continues to protect all other non-public routes. Post-login, users are forwarded to their originally intended destination.

## Technical Context

**Language/Version**: TypeScript (React 19 / Next.js 16.2.0 App Router)
**Primary Dependencies**: `@supabase/ssr` (auth state), Next.js App Router (`useRouter`, `useSearchParams`), Tailwind CSS
**Storage**: N/A — no new data stored; auth state read from existing Supabase session
**Testing**: Manual browser testing (open in incognito, verify no redirect)
**Target Platform**: Web browser
**Project Type**: Web application — frontend-only change
**Performance Goals**: No redirect flash for `/` — page renders immediately for guests
**Constraints**: Must not break authenticated user experience; all existing protected route behavior preserved
**Scale/Scope**: 4 files modified, ~50–80 lines changed total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ Pass | No new services introduced |
| II. Backend-Only AI/Secrets | ✅ Pass | Frontend routing change only; no secrets moved |
| III. RAG Grounding | ✅ Pass | Not applicable |
| IV. Streaming First | ✅ Pass | Not applicable |
| V. User-Friendly Errors | ✅ Pass | "Log in to use this" prompts are plain-language |
| VI. Simplicity (YAGNI) | ✅ Pass | 4 targeted file modifications; no new abstractions |
| VII. Code Quality | ✅ Pass | Each component does one thing; names are clear |
| VIII. UI/UX Philosophy | ✅ Pass | Login button replaces UserMenu null-return; minimal, clean |

No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/010-guest-homepage-access/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (minimal — no new entities)
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (files modified)

```text
frontend/
├── components/
│   ├── AuthGuard.tsx      ← modified: make / public; add ?redirect= to protected-route redirects
│   ├── UserMenu.tsx       ← modified: show Login button for guests instead of returning null
│   ├── AuthForm.tsx       ← modified: read ?redirect= param; use it after successful login
│   └── HomeClient.tsx     ← modified: guest-aware upload + doc-view behavior
└── app/
    └── (no file changes)
```

**Structure Decision**: Frontend-only, Option 2 (web application). Backend unchanged.

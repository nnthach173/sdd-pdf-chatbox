# Implementation Plan: User Authentication System

**Branch**: `009-user-auth` | **Date**: 2026-04-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-user-auth/spec.md`

## Summary

Add a real authentication system (email/password + Google OAuth) to replace the current browser-local UUID identity. Uses Supabase Auth (already in the stack) for signup, login, session management, and Google OAuth. Backend validates JWT tokens from Supabase on every request. A `profiles` table stores user display info. Frontend gets a login/register page and route protection.

## Technical Context

**Language/Version**: Python 3.11 (backend) · TypeScript / Next.js 16.2.0 with React 19 (frontend)
**Primary Dependencies**: FastAPI, supabase-py (backend) · `@supabase/ssr`, Tailwind CSS, shadcn/ui (frontend)
**Storage**: Supabase PostgreSQL (pgvector) + Supabase Storage (`pdfs` bucket) + Supabase Auth
**Testing**: Manual testing (existing pattern — no test framework configured)
**Target Platform**: Web application (localhost dev, Vercel + Render production)
**Project Type**: Web service (FastAPI backend + Next.js frontend)
**Performance Goals**: Auth operations complete in < 2s; no regression on existing document/chat flows
**Constraints**: Free-tier Supabase Auth (50,000 MAU limit); no paid auth providers
**Scale/Scope**: Single-user to small team usage; < 100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ PASS | Supabase Auth is included in free tier |
| II. Backend-Only AI and Secret Handling | ✅ PASS | Auth uses the Supabase anon key (public by design, not a secret). AI/PDF processing unchanged. Supabase service role key stays backend-only. |
| III. RAG Grounding | ✅ PASS | No changes to RAG pipeline |
| IV. Streaming First | ✅ PASS | No changes to streaming |
| V. User-Friendly Error Handling | ✅ PASS | Auth errors will use plain language messages |
| VI. Simplicity (YAGNI) | ✅ PASS | Leverages Supabase's built-in auth instead of building custom auth. No unnecessary abstractions. |
| VII. Code Quality | ✅ PASS | Will follow existing patterns |
| VIII. UI/UX Design | ✅ PASS | Clean login page with minimal steps |

**Frontend ↔ Supabase Auth note**: The constitution states "The frontend MUST NOT query Supabase directly for AI or document processing operations (read-only display queries via the anon key are permitted)." Auth operations (sign up, sign in, sign out) are identity management, not document/AI operations. The Supabase anon key is a public key by design. This is the standard Supabase Auth pattern and compliant with the constitution's intent.

## Project Structure

### Documentation (this feature)

```text
specs/009-user-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-auth.md      # Auth-related API contract changes
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py                    # Add auth router
├── database/
│   └── supabase_client.py     # Unchanged
├── routers/
│   ├── dependencies.py        # Replace get_owner_id → get_authenticated_user (JWT validation)
│   ├── documents.py           # Update owner_id source (from JWT user.id)
│   ├── chat.py                # Update owner_id source (from JWT user.id)
│   └── auth.py                # NEW: GET /auth/me endpoint
├── models/
│   └── schemas.py             # Add UserProfile schema
└── services/                  # Unchanged

frontend/
├── lib/
│   ├── api.ts                 # Replace getUserId() with getAccessToken() from Supabase session
│   └── supabase.ts            # NEW: Supabase browser client (anon key)
├── app/
│   ├── layout.tsx             # Wrap with auth provider
│   ├── page.tsx               # Unchanged (protected by middleware/redirect)
│   └── auth/
│       └── page.tsx           # NEW: Login/register page
│       └── callback/
│           └── route.ts       # NEW: OAuth callback handler
├── components/
│   ├── AuthForm.tsx           # NEW: Login/register form (email + Google button)
│   ├── AuthGuard.tsx          # NEW: Client-side auth redirect wrapper
│   ├── UserMenu.tsx           # NEW: Profile display + sign out dropdown
│   ├── HomeClient.tsx         # Add UserMenu to header/sidebar
│   └── ...                    # Existing components unchanged
└── ...
```

**Structure Decision**: Extends the existing `backend/` + `frontend/` structure. New files are minimal — one new backend router, one new frontend lib file, one new page, and a few new components.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.

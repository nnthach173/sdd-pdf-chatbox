# Implementation Plan: Per-User Isolated PDF Storage

**Branch**: `008-per-user-storage` | **Date**: 2026-03-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-per-user-storage/spec.md`

## Summary

Every uploaded PDF is tagged with the browser session's UUID (`owner_id`). All API queries filter by that UUID, so each browser sees only its own files. Identity is generated once in the browser via `crypto.randomUUID()`, persisted in `localStorage`, and sent as the `X-User-ID` header on every request. No login or auth service is required.

## Technical Context

**Language/Version**: Python 3.11 (backend) · TypeScript / Next.js 16.2.0 with React 19 (frontend)
**Primary Dependencies**: FastAPI, supabase-py (backend) · Tailwind CSS, shadcn/ui (frontend)
**Storage**: Supabase PostgreSQL (pgvector) + Supabase Storage (`pdfs` bucket)
**Testing**: pytest (backend) · manual browser isolation tests (frontend)
**Target Platform**: Local dev server (backend port 8000, frontend port 3000)
**Project Type**: Web application (FastAPI backend + Next.js frontend)
**Performance Goals**: Standard web responsiveness — no change from baseline
**Constraints**: Free-tier Supabase only. No new paid services. No new npm/pip packages required.
**Scale/Scope**: Single-developer local project. No concurrent-user scale requirements.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ PASS | No new services. Supabase `owner_id` column + index = free. |
| II. Backend-Only AI & Secrets | ✅ PASS | Identity UUID is not a secret. No API keys move to frontend. |
| III. RAG Grounding | ✅ PASS | RAG pipeline unchanged. |
| IV. Streaming First | ✅ PASS | SSE streaming unchanged. |
| V. User-Friendly Errors | ✅ PASS | Missing header returns plain-language 400 message. |
| VI. Simplicity (YAGNI) | ✅ PASS | No auth service, no JWT, no RLS — minimum viable isolation. See research.md. |
| VII. Code Quality | ✅ PASS | One reusable FastAPI `Header` dependency; `owner_id` injected cleanly. |
| VIII. UI/UX Design | ✅ PASS | Zero visible UI changes. Identity is completely transparent to the user. |

**Post-Phase 1 re-check**: All principles still pass. No new complexity introduced beyond what is strictly needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-per-user-storage/
├── plan.md              # This file
├── research.md          # Phase 0 — identity mechanism decisions
├── data-model.md        # Phase 1 — schema changes + ownership rules
├── quickstart.md        # Phase 1 — migration steps + verification tests
├── contracts/
│   └── api-changes.md   # Phase 1 — updated API contract (header + 404 behaviour)
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (affected files only)

```text
backend/
├── models/
│   └── schemas.py           # No change needed (owner_id not exposed in responses)
├── routers/
│   ├── documents.py         # Add owner_id header dependency; filter all queries
│   └── chat.py              # Add owner_id header dependency; verify doc ownership
└── database/
    └── supabase_client.py   # No change needed

frontend/
├── lib/
│   └── api.ts               # Add identity init + X-User-ID header to all calls
└── components/
    └── (no changes needed)
```

**Structure Decision**: Web application layout (Option 2). Only 3 files change in total — `documents.py`, `chat.py`, and `api.ts`. No new files, no new directories, no new dependencies.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

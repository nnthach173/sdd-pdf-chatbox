# Implementation Plan: Guest PDF Upload with Size Limit

**Branch**: `011-guest-pdf-upload` | **Date**: 2026-04-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-guest-pdf-upload/spec.md`

## Summary

Guests (unauthenticated users) are currently blocked from uploading or chatting — the frontend redirects them to `/auth` on any interaction. This feature lifts that block: guests can upload PDFs ≤ 1 MB and use the full chat interface. The approach threads a guest identity header (`X-Guest-ID: <browser-uuid>`) through the API, adds a dual-auth dependency on the backend, and removes the two frontend auth gates (upload redirect and ChatView login wall).

## Technical Context

**Language/Version**: Python 3.11 (backend) · TypeScript / Next.js 16.2.0 with React 19 (frontend)
**Primary Dependencies**: FastAPI, supabase-py (backend) · `@supabase/ssr`, Tailwind CSS (frontend)
**Storage**: Supabase PostgreSQL (pgvector) + Supabase Storage (`pdfs` bucket) + Supabase Auth
**Testing**: pytest (backend)
**Target Platform**: Linux server / Vercel
**Project Type**: web-service (backend) + web-app (frontend)
**Performance Goals**: Client-side file validation must be instant (no server round-trip)
**Constraints**: Guest uploads capped at 1,048,576 bytes; no new paid services; no new DB tables
**Scale/Scope**: Free-tier Supabase; guest documents persist via browser-local UUID

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | PASS | No new services introduced |
| II. Backend-Only AI/Secrets | PASS | No change to AI pipeline or secret handling |
| III. RAG Grounding | PASS | No change to chat/RAG logic |
| IV. Streaming First | PASS | No change to streaming endpoints |
| V. User-Friendly Errors | PASS | Guest size error uses plain language + sign-in CTA |
| VI. Simplicity (YAGNI) | PASS | No new abstractions beyond what is required |

All gates pass. No complexity tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/011-guest-pdf-upload/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions on guest identity, header strategy, UX
├── data-model.md        # Phase 1 — UserProfile schema change, new constants
├── quickstart.md        # Phase 1 — implementation guide + test checklist
├── contracts/
│   └── api-changes.md   # Phase 1 — API auth scheme and error contract changes
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
backend/
├── models/
│   └── schemas.py          # Add is_guest field to UserProfile
├── routers/
│   ├── dependencies.py     # Add get_user_or_guest() dependency
│   ├── documents.py        # Use get_user_or_guest; enforce GUEST_MAX_FILE_SIZE
│   └── chat.py             # Use get_user_or_guest on both endpoints

frontend/
├── lib/
│   └── api.ts              # Add requestHeaders(), getGuestId(), GUEST constants
└── components/
    ├── DocumentUpload.tsx  # Add isGuest prop; 1 MB limit + updated UI
    ├── LibraryView.tsx     # Pass isGuest prop through to DocumentUpload
    └── HomeClient.tsx      # Remove upload redirect + chat auth gate; pass isGuest
```

**Structure Decision**: Web application (Option 2). Files are already in `backend/` and `frontend/` directories. Changes are confined to existing files — no new files required.

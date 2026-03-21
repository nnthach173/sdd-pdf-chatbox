# Implementation Plan: PDF Split-Panel View

**Branch**: `002-pdf-split-view` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-pdf-split-view/spec.md`

## Summary

Replace the `/chat/[documentId]` page's single-column layout with a resizable split-panel view: `react-pdf` renders the PDF inline on the left; the existing `ChatInterface` occupies the right. The backend's `GET /documents/{id}` endpoint is extended to return a `signed_url` field, which the frontend uses as the PDF source. A draggable divider (20–80% range, mouse/touch only) adjusts the panel proportions in real time; screens narrower than 768 px stack the panels vertically. All existing chat functionality is preserved unchanged.

## Technical Context

**Language/Version**: Python 3.11 (backend) · TypeScript / Next.js 16.2.0 with React 19 (frontend)
**Primary Dependencies**: FastAPI, supabase-py (backend) · `react-pdf` v9.x, Tailwind CSS, shadcn/ui (frontend)
**Storage**: Supabase Storage — signed URL via `create_signed_url(file_path, expires_in=3600)`
**Testing**: pytest (backend) · no frontend test framework in project
**Target Platform**: Web — Vercel (frontend) + Render (backend)
**Project Type**: Web application
**Performance Goals**: PDF panel begins rendering within 3 s of page load (SC-001)
**Constraints**: No keyboard accessibility for divider (explicitly out of scope); panel split not persisted across reloads
**Scale/Scope**: Single-user per chat page; feature modifies one route and three source files + one new component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ PASS | `react-pdf` is MIT. Supabase Storage signed URL uses existing free tier. No paid services added. |
| II. Backend-Only AI | ✅ PASS | No AI calls in this feature. Signed URL is generated server-side only. |
| III. RAG Grounding | ✅ N/A | No AI response pipeline modified. |
| IV. Streaming First | ✅ N/A | No AI responses added. Existing streaming chat is untouched. |
| V. User-Friendly Errors | ✅ PASS | FR-006 requires plain-language error + download link on PDF failure. FR-009 requires human-readable processing message. |
| VI. Simplicity (YAGNI) | ✅ PASS | `react-pdf` required for cross-browser inline rendering. Divider via pure React events — no additional library. No abstractions for hypothetical futures. |
| VII. Code Quality | ✅ PASS | Prettier (frontend), Black (backend). Self-documenting component names. |
| VIII. UI/UX Philosophy | ✅ PASS | Obsidian dark theme preserved in chat header. Split-panel is clean, minimal. |

No violations — Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-pdf-split-view/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/api.md     # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── models/
│   └── schemas.py            # Extend DocumentDetail → add signed_url: str | None
└── routers/
    └── documents.py          # Extend GET /{id} → generate + return signed_url

frontend/
├── app/chat/[documentId]/
│   └── page.tsx              # Replace flat layout with split-panel + processing poll
├── components/
│   ├── PdfViewer.tsx         # react-pdf wrapper: loading / error / download fallback states
│   └── PanelDivider.tsx      # Draggable horizontal divider; enforces 20–80% limits
└── lib/
    └── api.ts                # Add signed_url to DocumentDetail interface
```

**Structure Decision**: Web application (Option 2). Backend and frontend are separate directories matching the existing project layout. All changes are confined to the five files and one new component identified above.

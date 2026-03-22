# Implementation Plan: AI Document Chat UI Overhaul

**Branch**: `004-ai-chat-ui-update` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-ai-chat-ui-update/spec.md`

## Summary

Restructure the AI chat page (`/chat/[documentId]`) from a two-panel layout (PDF + chat)
into a three-panel layout (fixed left sidebar + central PDF viewer + right chat panel),
matching the "Refined AI Document Chat" Stitch design. Add a branded header with tab
navigation. Enrich AI messages with Copy/Regenerate/Verify actions. Add a collapsible
Metadata Explorer inside the chat panel. Add placeholder icons to the chat input bar.
The existing draggable PDF/chat panel resizer is preserved unchanged. All changes are
frontend-only — no backend modifications required.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 16.2.0 with React 19
**Primary Dependencies**: Next.js 16.2.0, React 19, Tailwind CSS v3, shadcn/ui, react-pdf v9.x, lucide-react (icons already used in project)
**Storage**: N/A — frontend UI changes only
**Testing**: N/A — not specified in feature spec
**Target Platform**: Desktop web browser (Chrome, Firefox, Safari) at 1280px minimum width
**Project Type**: Web application — frontend modification only
**Performance Goals**: Panel resize drag remains smooth (no jank); layout renders within existing page load budget
**Constraints**: No backend changes; no new npm packages required (all needed dependencies already installed)
**Scale/Scope**: 2–3 existing files modified + 3 new component files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ Pass | No new services or packages introduced |
| II. Backend-Only AI & Secrets | ✅ Pass | No backend changes; clipboard copy is browser-native |
| III. RAG Grounding | ✅ Pass | AI response pipeline untouched |
| IV. Streaming First | ✅ Pass | Streaming preserved; FR-010 mandates no regression |
| V. User-Friendly Error Handling | ✅ Pass | Existing error handling preserved |
| VI. Simplicity (YAGNI) | ✅ Pass | Placeholders are minimal stubs; no abstractions added for future use |
| VII. Code Quality & Readability | ✅ Pass | New components follow single-responsibility; names convey intent |
| VIII. UI/UX Design Philosophy | ✅ Pass | This feature IS the UI update; follows Stitch reference design |
| IX. Incremental Commits | ✅ Pass | Plan commits after each user story phase (see tasks.md) |

**Gate result**: All principles pass. No violations to track.

*Post-design re-check*: No new violations introduced in Phase 1 design. Component contracts
are minimal and scoped to current requirements only.

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-chat-ui-update/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── ChatPageHeader.md
│   ├── DocumentSidebar.md
│   ├── MetadataExplorer.md
│   └── AiMessageActions.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   └── chat/
│       └── [documentId]/
│           └── page.tsx               ← Modified: adopt 3-panel layout, add sidebar + header
├── components/
│   ├── ChatInterface.tsx              ← Modified: add MetadataExplorer, input placeholder icons
│   ├── ChatMessage.tsx                ← Modified: add Copy/Regenerate/VerifyCriticalData buttons
│   ├── ChatPageHeader.tsx             ← New: branded header + tab navigation + user profile
│   ├── DocumentSidebar.tsx            ← New: fixed-width left sidebar
│   └── MetadataExplorer.tsx           ← New: collapsible section inside chat panel
```

**Structure Decision**: Web application layout (Option 2). All changes are confined to the
`frontend/` directory. No `backend/` changes. No new pages — only the existing chat page
and its component tree are modified.

## Complexity Tracking

> No constitution violations — table not required.

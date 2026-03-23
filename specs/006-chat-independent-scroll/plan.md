# Implementation Plan: Chat Panel Independent Scroll

**Branch**: `006-chat-independent-scroll` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-chat-independent-scroll/spec.md`

## Summary

Two Tailwind class changes in `ChatView.tsx` fix the shared-scroll issue. The `ChatInterface` component already has the correct internal layout for independent scroll (flex column with scrollable message area and anchored footer). The bug is that the wrapper divs in `ChatView.tsx` use `overflow-y-auto`, which causes them to scroll instead of deferring scroll ownership to `ChatInterface`. Replacing those with `overflow-hidden` gives `ChatInterface` full control of its own scroll context on both desktop and mobile.

## Technical Context

**Language/Version**: TypeScript / React 19
**Primary Dependencies**: Next.js 14 (App Router), Tailwind CSS
**Storage**: N/A — frontend layout change only
**Testing**: Manual browser testing (desktop + mobile viewport)
**Target Platform**: Web browser (desktop ≥ 768px + mobile < 768px)
**Project Type**: Web application
**Performance Goals**: No additional render or layout cost
**Constraints**: Must not break the existing resizable split-panel or mobile tab-toggle layout
**Scale/Scope**: 2 lines changed in 1 file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ PASS | No new services introduced |
| II. Backend-Only AI | ✅ PASS | Frontend change only; no AI/secret handling affected |
| III. RAG Grounding | ✅ PASS | Chat response pipeline unchanged |
| IV. Streaming First | ✅ PASS | Streaming rendering unchanged |
| V. User-Friendly Errors | ✅ PASS | Error display logic unchanged |
| VI. Simplicity (YAGNI) | ✅ PASS | Minimum change: 2 class values in 1 file |
| VII. Code Quality | ✅ PASS | Self-documenting Tailwind classes; no comments needed |
| VIII. UI/UX Design Philosophy | ✅ PASS | Fixes a UX regression; improves usability |

All gates pass. No violations to document.

## Project Structure

### Documentation (this feature)

```text
specs/006-chat-independent-scroll/
├── plan.md          # This file
├── research.md      # Root cause analysis and fix decision
├── quickstart.md    # How to test
└── tasks.md         # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
└── components/
    └── ChatView.tsx   ← 2 class changes (lines 203 and 243)
```

No other files change. No new files created.

## Implementation Details

### Change 1 — Desktop chat panel wrapper (ChatView.tsx line 243)

```tsx
// Before
<div className="flex flex-col overflow-y-auto h-full" style={{ width: `${100 - leftPct}%` }}>

// After
<div className="flex flex-col overflow-hidden h-full" style={{ width: `${100 - leftPct}%` }}>
```

**Why**: `overflow-y-auto` on the wrapper competes with the `overflow-hidden` + `flex-1` layout inside `ChatInterface`. Changing to `overflow-hidden` ensures the wrapper cannot scroll, forcing `ChatInterface`'s internal `flex-1 overflow-y-auto` message list to own the scroll.

### Change 2 — Mobile active panel wrapper (ChatView.tsx line 203)

```tsx
// Before
<div className="flex-1 overflow-y-auto">

// After
<div className="flex flex-1 flex-col overflow-hidden">
```

**Why**: On mobile, the active panel wrapper lacked `flex-col` and used `overflow-y-auto`, which caused the entire panel (including the chat footer) to scroll as one unit. Adding `flex flex-col overflow-hidden` gives the wrapper the same fixed-height flex context as the desktop wrapper, so `ChatInterface` can properly anchor its input bar.

# Implementation Plan: Independent Scroll for PDF and Chat Panels

**Branch**: `007-independent-scroll` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-independent-scroll/spec.md`

## Summary

The PDF and chat panels share a single document-level scrollbar because the layout root uses `min-h-screen` / `min-h-full` instead of `h-screen` / `h-full`. This prevents child panels from forming true, height-constrained scroll containers. The fix is three targeted CSS class changes in `layout.tsx` and `HomeClient.tsx`. No backend changes, no new components, no new state.

## Technical Context

**Language/Version**: TypeScript / React 19 + Next.js 16.2.0 (App Router)
**Primary Dependencies**: Tailwind CSS (layout utility classes only)
**Storage**: N/A — frontend layout change only
**Testing**: Manual browser verification (visual layout, scroll behaviour)
**Target Platform**: Web browser (desktop + mobile)
**Project Type**: Web application (frontend only for this feature)
**Performance Goals**: No new rendering cost; layout change only
**Constraints**: Must not break the responsive mobile tab layout or the draggable panel divider
**Scale/Scope**: 3 files touched, ~5 lines changed total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Free-Tier First | ✅ PASS | No new services or dependencies |
| II. Backend-Only AI | ✅ PASS | Frontend-only change; no AI calls touched |
| III. RAG Grounding | ✅ PASS | No AI pipeline changes |
| IV. Streaming First | ✅ PASS | Streaming unchanged |
| V. User-Friendly Errors | ✅ PASS | No error handling changes |
| VI. Simplicity (YAGNI) | ✅ PASS | 3 class changes, no new abstractions |
| VII. Code Quality | ✅ PASS | Class name changes are self-documenting |
| VIII. UI/UX Design | ✅ PASS | Fix resolves a clear UX regression |

**Re-check post-design**: All principles still pass. No complexity introduced.

## Project Structure

### Documentation (this feature)

```text
specs/007-independent-scroll/
├── plan.md              # This file
├── research.md          # Root cause analysis and fix decisions
├── data-model.md        # Scroll container hierarchy diagram
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (files changed)

```text
frontend/
├── app/
│   └── layout.tsx                    # Change: body min-h-full → h-full
└── components/
    ├── HomeClient.tsx                # Change: min-h-screen → h-screen / overflow-hidden
    └── ChatView.tsx                  # Change: remove redundant overflow-y-auto on PDF wrapper
```

**Structure Decision**: Web application layout (Option 2). Only frontend files are touched. No backend, no new files.

## Implementation Design

### Root Cause

The layout chain uses `min-h-*` utilities which allow the document body to grow past viewport height. This makes all `h-full` children unable to resolve to a fixed pixel height. As a result:
- The messages div in `ChatInterface` (`flex-1 overflow-y-auto`) is never height-constrained, so it expands to fit all content and never generates a scrollbar
- `scrollIntoView` on the chat bottom ref scrolls the **document**, not the messages container
- The PDF panel is dragged along by this document-level scroll, appearing to "share" the same scrollbar

### Fix: Three CSS Class Changes

**Change 1 — `layout.tsx` line 38**
```diff
- <body className="min-h-full">{children}</body>
+ <body className="h-full">{children}</body>
```
Prevents the body from growing past the viewport height.

**Change 2 — `HomeClient.tsx` line 37**
```diff
- <div className="flex min-h-screen bg-background text-foreground">
+ <div className="flex h-screen overflow-hidden bg-background text-foreground">
```
Fixes the root app container to exactly viewport height.

**Change 3 — `HomeClient.tsx` line 43**
```diff
- <div className="ml-64 flex flex-1 flex-col min-h-screen bg-obsidian-well">
+ <div className="ml-64 flex flex-1 flex-col overflow-hidden bg-obsidian-well">
```
Main content column fills the parent height without growing beyond it.

### Why No Other Changes Are Needed

- **`ChatView.tsx` PDF wrapper**: Currently has `overflow-y-auto h-full`. Once the layout is fixed, `h-full` resolves correctly and the wrapper itself won't scroll (PdfViewer handles its own scroll via `overflow-y-auto` on its root div). The redundant `overflow-y-auto` is harmless but can be cleaned up → remove it for clarity.
- **`ChatInterface.tsx`**: Already correct. `scrollIntoView` on `bottomRef` will work as intended once the messages div is a true scroll container.
- **`PdfViewer.tsx`**: Already correct. Starts at `scrollTop = 0` by default. No changes needed.
- **Mobile layout**: The tab-based mobile view uses `display: none` / full-width single-panel layout. Each tab renders one panel at a time; the same height fix applies and each panel independently scrolls within the full viewport.

## Verification Plan

After implementing, verify manually:

1. **PDF starts at top**: Open any document → PDF panel shows page 1 at the top without scrolling
2. **Chat starts at bottom**: Open a document with history → chat panel shows latest message and input bar
3. **Independent scroll**: Scroll PDF to middle → scroll chat → PDF position unchanged
4. **New messages auto-scroll**: Send a message → chat auto-scrolls to new message
5. **Mobile**: On narrow viewport (< 768px), tab between PDF and Chat — each tab starts at its correct default position
6. **Divider drag**: Resize panel split — no layout breakage

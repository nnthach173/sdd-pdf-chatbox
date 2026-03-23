# Research: Chat Panel Independent Scroll

**Feature**: 006-chat-independent-scroll
**Date**: 2026-03-23

---

## Root Cause Analysis

### Decision: Fix is in `ChatView.tsx` only — two `overflow` class changes

**Rationale**:
`ChatInterface.tsx` already has the correct flex layout for independent scroll:

```
ChatInterface root:  flex flex-1 flex-col overflow-hidden
  ├── Messages area: flex-1 overflow-y-auto          ← scrolls independently
  └── Footer/input:  (sibling of messages, not inside)  ← always visible
```

The auto-scroll `useEffect` + `bottomRef` already fires on every `messages` state change (line 21–23 of ChatInterface.tsx). No changes needed there.

The bug lives in `ChatView.tsx`:

**Desktop (line 243)**:
```tsx
// BROKEN: overflow-y-auto on wrapper fights the inner overflow-hidden/flex-1 layout
<div className="flex flex-col overflow-y-auto h-full" ...>
  <ChatInterface ... />
</div>
```
`overflow-y-auto` on the wrapper means the wrapper itself scrolls when ChatInterface's content grows. This undermines `flex-1` on the ChatInterface root — the chat input footer ends up below the viewport fold when messages overflow. Changing to `overflow-hidden` gives ChatInterface full control of its own scroll context.

**Mobile (line 203)**:
```tsx
// BROKEN: overflow-y-auto without flex constraints → ChatInterface can't size itself
<div className="flex-1 overflow-y-auto">
  <ChatInterface ... />
</div>
```
Without `flex flex-col` and `overflow-hidden` on the wrapper, the mobile panel also scrolls as a single unit rather than letting ChatInterface handle its internal scroll. The input bar scrolls off-screen on long conversations.

**Alternatives considered**:
- Setting a fixed pixel height on ChatInterface — rejected; brittle, breaks across viewport sizes and sidebar widths.
- Using `position: sticky` on the footer — rejected; introduces z-index complexity and doesn't solve the independent scroll problem between the two panels.
- Restructuring ChatInterface layout — rejected; it's already correct. The problem is purely in the wrapper.

---

## Summary of Required Changes

| File | Location | Change |
|------|----------|--------|
| `frontend/components/ChatView.tsx` | Line 203 (mobile panel wrapper) | `flex-1 overflow-y-auto` → `flex flex-1 flex-col overflow-hidden` |
| `frontend/components/ChatView.tsx` | Line 243 (desktop chat panel wrapper) | `flex flex-col overflow-y-auto h-full` → `flex flex-col overflow-hidden h-full` |

**No changes needed in**: `ChatInterface.tsx`, `PdfViewer.tsx`, `HomeClient.tsx`, backend, or any other file.

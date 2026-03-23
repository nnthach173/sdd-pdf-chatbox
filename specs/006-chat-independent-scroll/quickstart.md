# Quickstart: Chat Panel Independent Scroll

**Feature**: 006-chat-independent-scroll
**Date**: 2026-03-23

---

## What This Feature Changes

Two Tailwind class changes in `frontend/components/ChatView.tsx`:

1. **Desktop chat panel wrapper** (line 243): `overflow-y-auto` → `overflow-hidden`
2. **Mobile active panel wrapper** (line 203): `flex-1 overflow-y-auto` → `flex flex-1 flex-col overflow-hidden`

These two changes give the `ChatInterface` component full ownership of its own scroll context on both desktop and mobile.

---

## How to Test

### Desktop
1. Start the dev server: `cd frontend && npm run dev`
2. Upload or open a long PDF (10+ pages)
3. Scroll the PDF viewer to the middle
4. **Expected**: Chat input bar is visible at the bottom of the right panel — no scrolling required
5. Send a few messages until the chat overflows
6. Scroll up in the chat history
7. **Expected**: PDF viewer position does not change
8. Send a new message
9. **Expected**: Chat panel auto-scrolls to show the new message

### Mobile (< 768px viewport)
1. Open browser DevTools, set viewport width to 375px
2. Select the Chat tab
3. Send enough messages to overflow the visible area
4. **Expected**: Input bar remains at the bottom of the screen
5. Scroll up through chat history
6. **Expected**: Input bar stays anchored (does not scroll away)

---

## Files Changed

```
frontend/components/ChatView.tsx   ← 2 class changes only
```

No backend changes. No new dependencies. No database migrations.

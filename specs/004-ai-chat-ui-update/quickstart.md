# Quickstart: Verifying the AI Document Chat UI Overhaul

**Branch**: `004-ai-chat-ui-update` | **Date**: 2026-03-22

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed: `cd frontend && npm install`
- Backend running (for chat functionality regression tests)
- A PDF document previously uploaded (or upload one via the home page)

## Start the Frontend

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:3000`.

---

## Verification Checklist

### 1. Three-Panel Layout (US1 — P1)

1. Open any document's chat page: `http://localhost:3000/chat/<documentId>`
2. ✅ Header is visible at the top with "Obsidian Curator | AI Research Studio" branding
3. ✅ Four tabs are visible: Documents | Chat | Settings | Support
4. ✅ "Chat" tab is highlighted as active
5. ✅ User profile area shows "Research Lead — Pro Plan"
6. ✅ Bell (notification) icon is visible
7. ✅ Left sidebar panel is visible (fixed width, ~256px)
8. ✅ Central PDF viewer renders the document
9. ✅ Right chat panel is visible
10. ✅ Click Settings tab → nothing happens
11. ✅ Click Support tab → nothing happens

### 2. Panel Resize (US1 — split-view preserved)

1. ✅ Hover over the divider between PDF viewer and chat panel — cursor changes to resize
2. ✅ Drag divider left → PDF panel shrinks, chat panel grows
3. ✅ Drag divider right → PDF panel grows, chat panel shrinks
4. ✅ Sidebar width does not change when dragging the divider
5. ✅ Divider stops at min/max bounds (~20%/~80% of the resizable area)

### 3. Document Sidebar (US2 — P2)

1. ✅ Document filename is visible in the sidebar
2. ✅ Status badge ("Ready" or "Processing") is shown
3. ✅ Search input field is visible
4. ✅ Type in the search input → no filtering occurs, no errors

### 4. AI Message Action Buttons (US3 — P3)

1. Send a message in the chat
2. ✅ After AI response renders: Copy, Regenerate, and "Verify" buttons are visible below it
3. ✅ Click Copy → icon briefly changes to checkmark; paste confirms text was copied
4. ✅ Click Regenerate → nothing happens, no error
5. ✅ Click Verify → nothing happens, no error
6. ✅ User messages do NOT show action buttons

### 5. Metadata Explorer (US4 — P4)

1. ✅ Below the message list in the chat panel: "Metadata Explorer" label + chevron visible
2. ✅ Click the label → section expands revealing body content and Export button
3. ✅ Click Export → nothing happens, no error
4. ✅ Click the label again → section collapses

### 6. Chat Input Icons (US5 — P5)

1. ✅ Paperclip icon is visible in the input bar
2. ✅ Image icon is visible in the input bar
3. ✅ Click either icon → nothing happens, no error

### 7. Regression — Existing Functionality

1. ✅ Send a chat message → AI response streams in correctly
2. ✅ PDF renders all pages in the viewer
3. ✅ Back button navigates to the home page
4. ✅ No console errors related to the new components

---

## Expected Failure Modes

| Symptom | Likely Cause |
|---------|-------------|
| Sidebar overlaps PDF viewer | Sidebar not placed outside the PanelDivider container |
| Divider drag breaks after sidebar added | Sidebar is inside the flex container that PanelDivider measures |
| Copy button does nothing | `navigator.clipboard` unavailable on HTTP (use localhost or HTTPS) |
| Sidebar width changes on divider drag | Sidebar has flex-grow instead of fixed width |

# Quickstart: PDF Split-Panel View

**Branch**: `002-pdf-split-view` | **Date**: 2026-03-22

## Prerequisites

- Feature `001-pdf-rag-chatbox` fully operational (backend running, Supabase configured, at least one document uploaded and in `ready` status).

## Setup: Install react-pdf

```bash
cd frontend
npm install react-pdf
```

`react-pdf` ships with its own `pdfjs-dist` peer dependency. The `PdfViewer` component configures the PDF.js worker via CDN at runtime — no additional webpack or `next.config.ts` changes are required.

## End-to-End Validation

### 1. Open a ready document

1. Go to `http://localhost:3000`
2. Click on any document card with a green "ready" badge
3. **Expected**: The chat page loads with two panels side-by-side — PDF viewer on the left, chat on the right

### 2. Verify PDF renders

1. Wait up to 3 seconds after the page loads
2. **Expected**: The PDF content is visible in the left panel. No error message. No blank white box.

### 3. Verify independent scrolling

1. Scroll within the PDF panel (mouse wheel while hovering over it)
2. **Expected**: The chat panel does not scroll or shift
3. Scroll within the chat panel
4. **Expected**: The PDF panel does not scroll or shift

### 4. Verify panel resize

1. Hover over the thin vertical divider between the two panels — cursor changes to a resize cursor
2. Click and drag the divider to the right
3. **Expected**: The PDF panel shrinks and the chat panel grows in real time
4. Drag past the 80/20 limit
5. **Expected**: The divider stops; the PDF panel cannot be smaller than 20% of the screen
6. Drag the divider back to the left past the 20/80 limit (chat panel at minimum)
7. **Expected**: The divider stops at 20% chat width
8. Reload the page
9. **Expected**: Panels reset to 50/50

### 5. Verify chat still works

1. Type a question in the chat input and submit
2. **Expected**: Response streams in progressively in the right panel. The PDF panel is unaffected.

### 6. Verify error handling

1. Open the browser dev tools → Network tab
2. Navigate to a chat page, wait for the PDF to start loading, then go offline
3. **Expected**: The PDF panel shows a clear error message, not a blank panel

### 7. Verify mobile layout

1. In dev tools, switch to a mobile viewport (e.g., iPhone 375px wide)
2. Navigate to a document's chat page
3. **Expected**: PDF panel appears above the chat panel in a single-column layout
4. Scroll down
5. **Expected**: Chat interface is fully visible and usable below the PDF
6. **Expected**: No drag divider is visible in mobile layout

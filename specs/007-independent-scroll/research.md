# Research: Independent Scroll — 007

## Decision 1: Root Cause of Shared Scrollbar

**Decision**: The bug is caused by `min-h-screen` / `min-h-full` on layout root elements instead of `h-screen` / `h-full`. This allows the document body to grow beyond the viewport, creating a single browser-level scrollbar that controls both panels.

**Rationale**:
- `<body class="min-h-full">` (in `layout.tsx`) allows the body to grow past viewport height
- `<div class="flex min-h-screen">` (HomeClient root) and `<div class="ml-64 flex flex-1 flex-col min-h-screen">` (main column) do the same
- When the body can grow, child elements with `h-full` cannot resolve to a fixed pixel value; their `overflow-y-auto` containers never become constrained, so they don't generate their own scrollbars
- ChatInterface's `scrollIntoView` call scrolls the document (not the messages div) because the messages div is not a true scroll container — it hasn't been height-constrained
- Both panels then appear to share one scrollbar because all scrolling happens at the document level

**Alternatives considered**:
- `position: fixed` on panels — too invasive, breaks the responsive layout
- Scroll event interception — adds complexity for no benefit
- `overflow: hidden` on `<body>` — partially effective but doesn't fix the underlying height chain

## Decision 2: Chat Panel Scroll-to-Bottom Strategy

**Decision**: Keep the existing `scrollIntoView` approach in `ChatInterface`. No changes needed to `ChatInterface.tsx` itself.

**Rationale**:
- `ChatInterface` already has a `bottomRef` div at the end of the messages list and a `useEffect` calling `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` whenever `messages` changes
- Once the layout is fixed (so the messages div is height-constrained with `overflow-y-auto`), `scrollIntoView` will correctly scroll the messages div — the nearest scrollable ancestor — not the document
- This is the correct, minimal fix: fix the layout, let the existing logic work as intended

**Alternatives considered**:
- Manually setting `scrollTop = scrollHeight` on the messages container ref — more explicit but requires a second ref and adds imperative code that isn't needed
- CSS `scroll-snap` — not appropriate for a chat message list

## Decision 3: PDF Panel Scroll Position

**Decision**: No changes needed to `PdfViewer.tsx`. Once the layout is fixed, the PDF panel starts at the top naturally.

**Rationale**:
- `PdfViewer` renders pages top-to-bottom; its own `overflow-y-auto` div starts with `scrollTop = 0` by default
- The PDF only "started at the bottom" because the document-level scrollbar was scrolled down by the chat's `scrollIntoView` call — both panels were being moved by the same scroll event
- Fixing the layout separates the scroll contexts; the PDF panel's scroll container will independently start at `scrollTop = 0`

**Note**: The PDF panel wrapper in `ChatView` (`<div class="overflow-y-auto h-full">`) is redundant — `PdfViewer` manages its own `overflow-y-auto` root. The wrapper's `overflow-y-auto` can be removed (or left harmlessly since `PdfViewer`'s root is `h-full` within it, so the wrapper never actually overflows).

## Decision 4: Exact Layout Changes Required

**Files to change**: `layout.tsx` and `HomeClient.tsx`.

| File | Current | Change To | Why |
|------|---------|-----------|-----|
| `layout.tsx` | `<body class="min-h-full">` | `<body class="h-full">` | Body must not grow past viewport |
| `HomeClient.tsx` | `<div class="flex min-h-screen ...">` | `<div class="flex h-screen ...">` | Root container fixed to viewport height |
| `HomeClient.tsx` | `<div class="ml-64 flex flex-1 flex-col min-h-screen ...">` | `<div class="ml-64 flex flex-1 flex-col overflow-hidden ...">` | Main column fills parent height without growing |

With these three changes, the layout height chain becomes fully defined:
- `html: h-full` → 100vh
- `body: h-full` → 100vh
- HomeClient root: `h-screen` → 100vh
- Main column: `flex-1 overflow-hidden` → fills remaining horizontal space at 100vh
- Content area: `flex-1 overflow-hidden` → 100vh minus header height
- ChatView: `flex-1 overflow-hidden` → fills content area
- PDF wrapper: `h-full` → resolves correctly ✓
- Chat wrapper: `h-full` → resolves correctly ✓
- Messages div: `flex-1 overflow-y-auto` → constrained height, becomes true scroll container ✓

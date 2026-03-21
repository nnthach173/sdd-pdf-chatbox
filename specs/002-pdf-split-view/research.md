# Research: PDF Split-Panel View

**Branch**: `002-pdf-split-view` | **Phase**: 0 | **Date**: 2026-03-22

## Decision Log

---

### D-001: PDF Rendering Library

**Decision**: `react-pdf` v9.x (pdf.js-based). Confirmed via `/speckit.clarify` Q1.

**Rationale**: Cross-browser, React-native, and works without any browser PDF plugin — critical for mobile where native `<embed>`/`<iframe>` PDF support is absent or inconsistent on iOS Safari and many Android browsers. Renders via HTML5 Canvas using pdf.js under the hood, so behaviour is identical across all major browsers. MIT licensed, no cost. v9.x officially supports React 16–19 (tested against React 19.2.x).

**Integration notes**:
- Must be dynamically imported with `ssr: false` in Next.js App Router, because pdf.js uses browser-only APIs (Canvas, Worker).
- PDF.js worker must be configured explicitly. Use the `unpkg` CDN path matching the installed `pdfjs-dist` version to avoid webpack configuration:
  ```tsx
  import { pdfjs } from 'react-pdf';
  pdfjs.GlobalWorkerOptions.workerSrc =
    `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  ```
- Import the bundled CSS for text and annotation layers to avoid unstyled overlays:
  ```tsx
  import 'react-pdf/dist/Page/AnnotationLayer.css';
  import 'react-pdf/dist/Page/TextLayer.css';
  ```
- `react-pdf` exposes `<Document>` (loads the PDF) and `<Page pageNumber={n} />` (renders one page). For a scrollable multi-page viewer, render all pages in a single `<Document>` using `numPages` from the `onLoadSuccess` callback.

**Alternatives considered**:
- Native `<iframe>`/`<embed>`: Broken on iOS Safari and many Android browsers; no rendering control; **rejected by clarification Q1**.
- `@react-pdf-viewer/core`: Feature-rich (toolbar, thumbnails, search) but ~2× larger bundle; YAGNI for a v1 viewer that only needs scroll rendering.

---

### D-002: PDF.js Worker Configuration Strategy

**Decision**: CDN-hosted worker via `unpkg.com`, resolved at runtime by referencing `pdfjs.version`.

**Rationale**: Avoids webpack custom configuration needed to copy the worker binary into the Next.js public directory. The CDN approach works out of the box in Next.js 16 App Router without touching `next.config.ts`. The worker URL is pinned to the exact installed `pdfjs-dist` version so there is no version mismatch risk.

**Alternatives considered**:
- Copy `pdf.worker.min.mjs` to `public/` and reference `/pdf.worker.min.mjs`: Works but requires a manual `postinstall` script or `CopyPlugin` webpack config.
- `pdfjs-dist/build/pdf.worker.entry` webpack alias: Next.js 16 handles workers differently from webpack 4; requires explicit `workerChunks` config.

---

### D-003: Signed URL Delivery

**Decision**: Extend `GET /documents/{id}` to include a `signed_url` field in the response. No new endpoint. Confirmed via `/speckit.clarify` Q3.

**Rationale**: Single round-trip on page load. The chat page already calls `GET /documents/{id}` to fetch the document name and status. Piggybacking the signed URL onto the same response keeps the frontend load sequence simple (one `Promise.all` call) and avoids a second HTTP round-trip.

**Implementation**:
- In `routers/documents.py`, call `db.storage.from_("pdfs").create_signed_url(file_path, 3600)` inside `get_document()`.
- The supabase-py v2 API returns a dict with a `signedURL` key (capital U). Extract with `result["signedURL"]`.
- Add `signed_url: str | None` to `DocumentDetail` in `schemas.py`. Return `None` if the document status is not `ready` (storage file may not yet exist or be fully written).

**Alternatives considered**:
- Dedicated `GET /documents/{id}/signed-url` endpoint: Two round-trips per page load; adds backend surface area with no benefit. **Rejected by clarification Q3.**
- Frontend calls Supabase Storage directly: Violates Constitution Principle II — the Supabase service key must not reach the browser.

---

### D-004: Draggable Divider Implementation

**Decision**: Pure React implementation using `mousedown` / `mousemove` / `mouseup` events on `document`. No additional library.

**Rationale**: The interaction is simple: track pointer position relative to the container width and clamp the result to [20, 80]. Three event listeners on `document` during a drag is all that is needed — approximately 30 lines of logic in one component. Adding a library (e.g. `react-resizable-panels`) for this single use would violate YAGNI (Principle VI).

**Implementation sketch**:
```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [leftPct, setLeftPct] = useState(50);

function onMouseDown() {
  function onMouseMove(e: MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(80, Math.max(20, pct)));
  }
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
```
Touch support uses the same pattern with `touchmove` / `touchend` + `e.touches[0].clientX`. Keyboard support is **explicitly out of scope** (confirmed via `/speckit.clarify` Q5).

**Alternatives considered**:
- `react-resizable-panels`: Mature, handles keyboard a11y. Adds ~15 KB. Rejected — keyboard a11y is out of scope; custom implementation is trivially small.
- CSS `resize` property: Not cross-browser reliable for panel-pair resize; no programmatic min/max clamping.

---

### D-005: Processing State Poll

**Decision**: `setInterval` every 5 s calling `getDocument()`, clearing on `status === 'ready'`. Confirmed via `/speckit.clarify` Q2.

**Rationale**: The home page (`page.tsx`) already uses the same polling pattern with `hasPendingStatus` + `clearInterval`. Consistent approach, no new abstraction. 5 s interval is fast enough to feel responsive without hammering the backend. When polling resolves to `ready`, `signed_url` will be non-null in the response, and `PdfViewer` will mount automatically via state update.

**Alternatives considered**:
- WebSocket/SSE push from backend: Correct at scale; overkill for a v1 personal tool (YAGNI).
- Static "check back later" message: Rejected by clarification Q2.

---

### D-006: PDF Render Failure Fallback

**Decision**: Error message + direct download link via the signed URL. Confirmed via `/speckit.clarify` Q4.

**Rationale**: If `react-pdf` fails to render (corrupted file, memory exhaustion on very large PDFs), the user can still access their document by downloading it. This satisfies FR-006 and Constitution Principle V (user-friendly errors) with zero extra complexity — the signed URL is already in state.

**Implementation**: `<Document>` exposes an `onLoadError` callback. On error, switch to an error UI state showing a plain-language message and an `<a href={signedUrl} download>Download PDF</a>` link. A retry button re-mounts the `<Document>` by incrementing a `key` prop.

**Alternatives considered**:
- Error message only, no download link: Leaves user stranded. Rejected by clarification Q4.
- Auto-retry once before showing error: Adds complexity; not justified for a load failure that is unlikely to resolve on retry.

---

## Summary of New Files / Changes

| File | Change |
|------|--------|
| `backend/models/schemas.py` | Add `signed_url: str \| None` to `DocumentDetail` |
| `backend/routers/documents.py` | Extend `GET /{id}` to call `create_signed_url` and populate `signed_url` |
| `frontend/lib/api.ts` | Add `signed_url: string \| null` to `DocumentDetail` interface |
| `frontend/components/PdfViewer.tsx` | New: `react-pdf` wrapper with loading / error / download fallback states |
| `frontend/components/PanelDivider.tsx` | New: draggable divider with 20–80% clamped resize logic |
| `frontend/app/chat/[documentId]/page.tsx` | Replace flat layout with split-panel + processing poll |

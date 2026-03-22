# Contract: DocumentSidebar

**Component**: `frontend/components/DocumentSidebar.tsx`
**Type**: New component

## Purpose

Fixed-width left panel on the chat page. Shows the active document's filename, a
status badge, and a non-functional search input. Does not participate in the
PanelDivider resize system.

## Props Interface

```typescript
interface DocumentSidebarProps {
  documentName: string;
  documentStatus: 'processing' | 'ready' | 'error';
}
```

## Status Badge Mapping

| Status value | Badge label | Badge variant |
|-------------|-------------|---------------|
| `'processing'` | Processing | Warning / muted |
| `'ready'` | Ready | Success / secondary |
| `'error'` | Error | Destructive |

## Visual Elements

- **Width**: Fixed `w-64` (256px) — not user-resizable
- **Search input**: `Search` icon + text input — no `onChange` handler (placeholder)
- **Document entry**: Filename as `title-sm`, status badge using shadcn `Badge`

## Constraints

- MUST have fixed width; MUST NOT be draggable or resizable
- Search input MUST be rendered but MUST NOT filter or emit any events
- Status data MUST come from the parent page (no internal data fetching)

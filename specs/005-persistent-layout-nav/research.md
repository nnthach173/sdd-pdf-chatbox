# Research: Persistent Layout Navigation

**Branch**: `005-persistent-layout-nav` | **Date**: 2026-03-22

## Decision 1: URL State Management in Next.js App Router

**Decision**: Use `useSearchParams()` + `router.push()` for URL-driven view state.

**Rationale**: In Next.js App Router, `useSearchParams()` is the canonical way for client components to read URL search params reactively. When `router.push('/?doc=<id>')` is called, the component re-renders with updated `searchParams` — no page reload, no unmount. The sidebar and header remain mounted because they're in the same component tree. Browser back/forward automatically trigger re-renders with the previous/next searchParams value.

**Pattern**:
```ts
// Read current view state from URL
const searchParams = useSearchParams();
const activeDocId = searchParams.get('doc'); // null = library, string = chat

// Navigate to chat view
router.push(`/?doc=${docId}`);

// Navigate to library
router.push('/');
```

**Alternatives considered**:
- `useState` only: rejected — browser back/forward wouldn't work
- Route Groups (`(app)/` + separate `/chat/[id]` route): valid, but requires file restructuring and lifting upload state to context; more complexity for same outcome
- Parallel Routes: overkill for this use case, known edge-case bugs in App Router

---

## Decision 2: localStorage for Panel Split Ratio Persistence

**Decision**: Persist split ratio to `localStorage` under key `'obsidian-split-ratio'`.

**Rationale**: The split ratio is a UI preference with no security implications and no need for server-side sync. `localStorage` is the simplest cross-session persistence mechanism available without additional infrastructure. Default value is `50` (50%). Write on drag end (not on every mouse-move) to avoid excessive writes.

**SSR safety**: Access guarded inside a `useEffect` or `typeof window !== 'undefined'` check, since Next.js renders server-side first.

**Pattern**:
```ts
// Read on mount
const [leftPct, setLeftPct] = useState(50);
useEffect(() => {
  const saved = localStorage.getItem('obsidian-split-ratio');
  if (saved) setLeftPct(Number(saved));
}, []);

// Write on drag end
localStorage.setItem('obsidian-split-ratio', String(leftPct));
```

**Alternatives considered**:
- Session storage: rejected — wouldn't persist across sessions as required
- Server-side user preferences: rejected — no auth system, no user model, YAGNI
- Cookie: rejected — adds complexity, no benefit over localStorage here

---

## Decision 3: Component Decomposition Strategy

**Decision**: Extract 4 new focused components from the existing monolithic `page.tsx` + `chat/[documentId]/page.tsx` pair.

| New Component | Source | Responsibility |
|---|---|---|
| `AppSidebar.tsx` | Extracted from `page.tsx` | Persistent nav sidebar (Documents, Chat, Upload, Settings) |
| `AppHeader.tsx` | Merge of `page.tsx` header + `ChatPageHeader.tsx` | Unified top bar (adapts to show doc name pill in chat mode) |
| `LibraryView.tsx` | Extracted from `page.tsx` main content | Upload zone + document grid |
| `ChatView.tsx` | Extracted from `chat/[documentId]/page.tsx` | Split PDF+divider+chat panel |

**Files to delete** (no longer needed):
- `app/chat/[documentId]/page.tsx` — route is obsolete; URL is now `/?doc=<id>`
- `components/ChatPageHeader.tsx` — absorbed into `AppHeader`
- `components/DocumentSidebar.tsx` — was a document-info panel only used on the old chat page; not part of the new design

**Files to modify**:
- `app/page.tsx` — rewritten as thin orchestrator: reads URL params, renders AppSidebar + AppHeader + (LibraryView | ChatView)
- `components/DocumentCard.tsx` — replace `router.push('/chat/${doc.id}')` with `onOpen(doc.id)` prop callback
- `components/DocumentList.tsx` — thread `onOpen` prop through to `DocumentCard`

**Rationale**: Each component has one clear purpose and can be understood and tested independently. `page.tsx` shrinks to ~50 lines of orchestration logic. Deleting `ChatPageHeader` and `DocumentSidebar` removes dead code rather than accumulating it.

---

## Decision 4: Mobile Tab Toggle Implementation

**Decision**: Simple controlled `useState<'pdf' | 'chat'>` tab in `ChatView` shown only when viewport < 768px (Tailwind `md:` breakpoint).

**Pattern**: Detect mobile via `window.innerWidth < 768` in a `useEffect` (with resize listener). On mobile, render a two-button tab strip above the content; conditionally render only the active panel. On desktop, render both panels with the divider.

**No new dependencies needed** — this is pure Tailwind + React state.

---

## NEEDS CLARIFICATION: None

All unknowns are resolved. No backend changes required. This is a pure frontend refactor.

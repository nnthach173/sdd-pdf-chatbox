# Data Model: Persistent Layout Navigation

**Branch**: `005-persistent-layout-nav` | **Date**: 2026-03-22

> This feature has no new backend data model. All changes are client-side UI state and a single localStorage preference.

## Client-Side State

### ViewState (in `page.tsx`)

| Field | Type | Source | Description |
|---|---|---|---|
| `activeDocId` | `string \| null` | `useSearchParams().get('doc')` | Null = Library View; string = Chat View for that document |

Derived entirely from the URL — no `useState` needed. The URL is the source of truth.

### SplitRatio (in `ChatView.tsx`)

| Field | Type | Default | Persistence |
|---|---|---|---|
| `leftPct` | `number` (20–80) | `50` | `localStorage['obsidian-split-ratio']` |

Read from localStorage on mount. Written to localStorage on drag end. Applies globally across all documents.

### MobileTab (in `ChatView.tsx`)

| Field | Type | Default | Persistence |
|---|---|---|---|
| `activeTab` | `'pdf' \| 'chat'` | `'chat'` | Session only (resets on navigation) |
| `isDesktop` | `boolean` | Detected via `window.innerWidth >= 768` | Not persisted |

---

## No Backend Changes

- No new API endpoints
- No new database tables or columns
- No changes to existing Supabase schema
- All existing API calls (`getDocument`, `getChatHistory`, `listDocuments`, etc.) are reused unchanged

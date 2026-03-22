# Data Model: AI Document Chat UI Overhaul

**Branch**: `004-ai-chat-ui-update` | **Date**: 2026-03-22

> This feature introduces no backend data model changes. All entities below are
> **frontend UI component models** — they describe the props and local state of
> new or modified components.

---

## UI Component Entities

### ChatPageHeader

A new top-level header component rendered above the three-panel content area.

**Props**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentName` | `string` | Yes | Name of the active document, displayed in header context |
| `activeTab` | `'documents' \| 'chat' \| 'settings' \| 'support'` | No | Defaults to `'chat'` |

**Local state**: None — stateless component.

**Notes**: Settings and Support tabs have no `onClick` handler. Documents tab is
rendered as a non-functional placeholder (per FR-002).

---

### DocumentSidebar

A new fixed-width left panel showing the active document's metadata.

**Props**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentName` | `string` | Yes | Filename of the active document |
| `documentStatus` | `'processing' \| 'ready' \| 'error'` | Yes | Used to render the status badge |

**Local state**: None — stateless component.

**Notes**: The search input is rendered but has no `onChange` handler (FR-004). The
`documentStatus` value is passed down from the parent page, which already fetches it.

---

### MetadataExplorer

A collapsible section rendered inside the right chat panel, below the message list.

**Props**: None — fully self-contained placeholder.

**Local state**:
| Field | Type | Initial | Description |
|-------|------|---------|-------------|
| `isExpanded` | `boolean` | `false` | Controls collapsed/expanded display |

**Notes**: The Export button has no `onClick` handler (FR-007). When collapsed, only
the header label and chevron icon are visible.

---

### AiMessageActions (enhancement to ChatMessage)

Three action buttons added beneath each AI-generated message.

**Props added to `ChatMessage`**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `string` | Yes | Already exists — used by Copy action |

**Local state added to `ChatMessage`**:
| Field | Type | Initial | Description |
|-------|------|---------|-------------|
| `copied` | `boolean` | `false` | Switches Copy icon to checkmark for 1.5s after click |

**Actions**:
| Button | Functional | Behaviour |
|--------|-----------|-----------|
| Copy | Yes | `navigator.clipboard.writeText(content)` + sets `copied = true` for 1.5s |
| Regenerate | No | No handler — placeholder (FR-005) |
| Verify Critical Data | No | No handler — placeholder (FR-005) |

---

### ChatInputBar (enhancement to ChatInterface)

Two icon buttons added to the existing input bar.

**No new props** — additions are purely visual within the existing `ChatInterface` component.

**New elements**:
| Element | Functional | Behaviour |
|---------|-----------|-----------|
| Paperclip (attachment) icon button | No | No handler — placeholder (FR-008) |
| Image upload icon button | No | No handler — placeholder (FR-008) |

---

## State Flow (Chat Page)

```
page.tsx
  ├── ChatPageHeader (documentName, activeTab="chat")
  ├── DocumentSidebar (documentName, documentStatus)
  └── [resizable area]
      ├── PdfViewer (unchanged)
      ├── PanelDivider (unchanged)
      └── ChatInterface (modified: MetadataExplorer + input icons)
              └── ChatMessage (modified: AiMessageActions)
```

All new state is local to each component. No global state changes. No new API calls.

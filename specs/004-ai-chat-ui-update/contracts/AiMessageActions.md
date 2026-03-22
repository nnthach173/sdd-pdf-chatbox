# Contract: AiMessageActions

**Component**: Enhancement to `frontend/components/ChatMessage.tsx`
**Type**: Modification to existing component

## Purpose

Add three action buttons beneath each AI-generated message: Copy (functional),
Regenerate (placeholder), Verify Critical Data (placeholder).

## New Local State in ChatMessage

```typescript
const [copied, setCopied] = useState(false);
```

`copied` reverts to `false` after 1500ms via `setTimeout`.

## Button Specifications

### Copy Button

| Property | Value |
|----------|-------|
| Icon (default) | `Copy` (lucide) |
| Icon (after click) | `Check` (lucide) — reverts after 1.5s |
| Label | "Copy" |
| onClick | `navigator.clipboard.writeText(content)` then `setCopied(true)` |
| Functional | Yes |

### Regenerate Button

| Property | Value |
|----------|-------|
| Icon | `RefreshCw` (lucide) |
| Label | "Regenerate" |
| onClick | None — no handler |
| Functional | No — placeholder |

### Verify Critical Data Button

| Property | Value |
|----------|-------|
| Icon | `ShieldCheck` (lucide) |
| Label | "Verify" |
| onClick | None — no handler |
| Functional | No — placeholder |

## Rendering Condition

Action buttons MUST only render on messages where `role === 'assistant'`.
User messages MUST NOT show action buttons.

## Constraints

- Action buttons MUST be visually styled consistently (not greyed out) — FR-009
- Placeholder buttons MUST NOT trigger any state change or network request
- `content` prop for clipboard is the existing message text field — no new props needed

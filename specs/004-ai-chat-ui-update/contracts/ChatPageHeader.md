# Contract: ChatPageHeader

**Component**: `frontend/components/ChatPageHeader.tsx`
**Type**: New component

## Purpose

Renders the top header bar for the AI chat page. Displays app branding, a four-tab
navigation bar, a user profile placeholder, and a notification icon placeholder.

## Props Interface

```typescript
interface ChatPageHeaderProps {
  documentName: string;        // Active document name shown in branding context
  activeTab?: TabId;           // Currently active tab. Defaults to 'chat'
}

type TabId = 'documents' | 'chat' | 'settings' | 'support';
```

## Rendered Tabs

| Tab | Label | Behaviour |
|-----|-------|-----------|
| documents | Documents | Non-functional placeholder (no onClick) |
| chat | Chat | Active — visually highlighted |
| settings | Settings | Non-functional placeholder (no onClick) |
| support | Support | Non-functional placeholder (no onClick) |

## Visual Elements

- **Branding**: "Obsidian Curator | AI Research Studio" (matches Stitch design)
- **User profile**: Static text "Research Lead — Pro Plan" + `UserCircle` icon
- **Notification**: `Bell` icon — no onClick handler (placeholder)

## Constraints

- MUST NOT perform any navigation on Settings or Support tab click
- MUST NOT connect to any authentication or user profile system
- Active tab indicator MUST use the project's primary accent color

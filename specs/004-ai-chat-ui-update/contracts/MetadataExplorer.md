# Contract: MetadataExplorer

**Component**: `frontend/components/MetadataExplorer.tsx`
**Type**: New component

## Purpose

A collapsible placeholder section rendered inside the right chat panel, below the
message list. Signals the future metadata extraction feature without requiring any
backend work. Collapsed by default.

## Props Interface

```typescript
// No props — self-contained placeholder component
interface MetadataExplorerProps {}
```

## Local State

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

## Collapsed State (default)

- Renders header label: "Metadata Explorer"
- Renders `ChevronDown` icon (rotates 180° when expanded)
- Clicking the header toggles `isExpanded`

## Expanded State

- Reveals section body (static placeholder content — e.g., "No metadata available")
- Renders Export button with `Download` icon — **no onClick handler**

## Constraints

- MUST be collapsed by default (initial state `false`)
- Export button MUST NOT trigger any action or network request
- MUST NOT fetch any data from backend
- Toggle (expand/collapse) MUST work correctly as functional UI interaction

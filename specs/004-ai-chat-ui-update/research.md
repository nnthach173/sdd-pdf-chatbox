# Research: AI Document Chat UI Overhaul

**Branch**: `004-ai-chat-ui-update` | **Date**: 2026-03-22

## Decision 1: Clipboard Copy Implementation

**Decision**: Use the browser-native `navigator.clipboard.writeText()` API.

**Rationale**: Already the standard for clipboard copy in modern React apps. No library
needed. Works in all target browsers (Chrome, Firefox, Safari) when served over HTTPS
or localhost. A temporary fallback via `document.execCommand('copy')` is not needed
given the deployment target (Vercel HTTPS).

**Alternatives considered**:
- `copy-to-clipboard` npm package — rejected; adds a dependency for a one-liner operation
- `react-copy-to-clipboard` — rejected; same reason, unnecessary abstraction

**Implementation pattern**:
```
onClick={() => navigator.clipboard.writeText(messageText)}
```

Optional: brief visual feedback (e.g., icon swap to checkmark for 1.5s) via local
`useState`. Not required by spec but recommended for UX clarity.

---

## Decision 2: Collapsible Metadata Explorer

**Decision**: Implement as a controlled `useState(false)` toggle in the
`MetadataExplorer` component. Render a chevron icon (rotate 180° when expanded) next
to the section label. Collapsed by default (FR-007 + clarification).

**Rationale**: No third-party accordion library needed. The existing codebase uses
Tailwind CSS with shadcn/ui — a simple conditional render + CSS transition covers this
pattern with zero new dependencies.

**Alternatives considered**:
- shadcn/ui `Collapsible` component — viable, but introduces a dependency on
  Radix UI `@radix-ui/react-collapsible`. Project already uses shadcn; this is
  acceptable if the team prefers it. However, a raw `useState` toggle is simpler and
  consistent with Principle VI (YAGNI).
- CSS `details`/`summary` HTML elements — rejected; harder to style consistently with
  Tailwind and doesn't support animated transitions cleanly.

---

## Decision 3: Fixed-Width Sidebar Without Breaking PanelDivider

**Decision**: Introduce the sidebar as a fixed-width column outside the existing
`PanelDivider` resize scope. The `PanelDivider` component controls only the
PDF/chat ratio. The sidebar sits to the left of the resizable area with a fixed
Tailwind width class (e.g., `w-64`).

**Rationale**: The existing `PanelDivider` calculates percentages relative to its
container. If the sidebar is placed outside that container (as a sibling flex child),
the divider logic requires no changes — it continues operating on the remaining space.
This satisfies FR-012 (divider unchanged) and FR-013 (sidebar fixed-width) with
minimal code impact.

**Layout structure**:
```
<div className="flex h-full">
  <DocumentSidebar />                    {/* fixed w-64, not resizable */}
  <div className="flex flex-1">          {/* PanelDivider scope — unchanged */}
    <PdfViewer ... />
    <PanelDivider ... />
    <ChatInterface ... />
  </div>
</div>
```

**Alternatives considered**:
- CSS Grid with explicit column definitions — viable but requires rewriting the
  existing flex-based layout entirely. Higher blast radius; rejected.
- Making sidebar part of the PanelDivider resize system — rejected; would change
  existing divider behaviour, violating FR-012/FR-013.

---

## Decision 4: Tab Navigation

**Decision**: Implement as a stateless horizontal tab bar in `ChatPageHeader`.
Active tab is "Chat" (hardcoded — the chat page is always the active context).
Documents, Settings, and Support tabs render as styled links/buttons with no
`onClick` handler (or a no-op handler), satisfying FR-002.

**Rationale**: No routing library changes needed. The tab bar is purely decorative
for Settings/Support. Documents could navigate to `/` but the spec marks it as a
non-functional placeholder for now.

**Alternatives considered**:
- Next.js `<Link>` for Documents tab pointing to `/` — technically correct but
  the spec does not require it, and adding it would exceed specified scope (Principle VI).

---

## Decision 5: Icon Library

**Decision**: Use `lucide-react`, which is already installed in the project
(confirmed by exploring the existing codebase — it uses lucide icons in the home page).

**Icons mapped**:
- Notification: `Bell`
- User profile: `UserCircle`
- Attachment: `Paperclip`
- Image upload: `Image`
- Copy: `Copy` → `Check` (feedback state)
- Regenerate: `RefreshCw`
- Verify: `ShieldCheck`
- Export: `Download`
- Collapse/expand: `ChevronDown`
- Search: `Search`
- Status badge (Ready): uses existing shadcn `Badge` component

---

## Summary: All NEEDS CLARIFICATION Resolved

| Item | Resolution |
|------|-----------|
| Clipboard copy | `navigator.clipboard.writeText()` — no new dependency |
| Collapsible pattern | Raw `useState` toggle — no new dependency |
| Sidebar + divider coexistence | Sidebar outside divider container — divider logic unchanged |
| Tab navigation | Stateless header component — no routing changes |
| Icons | lucide-react (already installed) |

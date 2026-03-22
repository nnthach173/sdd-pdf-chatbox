# Design: Markdown Rendering for AI Chat Responses

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Frontend only — `frontend/components/ChatMessage.tsx`

---

## Problem

The AI assistant returns markdown-formatted text (bullet lists, bold, code blocks, tables, links), but `ChatMessage.tsx` renders `message.content` as a raw text node. All markdown syntax appears as literal characters instead of formatted output.

## Goal

Render assistant messages with full GitHub-Flavored Markdown formatting — matching the visual fidelity of ChatGPT, Claude, and similar AI chat UIs.

---

## Approach

**Option A: `react-markdown` + `remark-gfm` + `rehype-highlight`**

Industry-standard React markdown rendering pipeline. Safe (no `dangerouslySetInnerHTML`), composable via custom React components, streaming-friendly.

---

## Packages

| Package | Version | Purpose |
|---|---|---|
| `react-markdown` | latest | Markdown → React component tree |
| `remark-gfm` | latest | GFM: tables, strikethrough, task lists, autolinks |
| `rehype-highlight` | latest | Syntax highlighting for fenced code blocks |
| `highlight.js` | latest | Peer dep for rehype-highlight |
| `@tailwindcss/typography` | latest | `prose` plugin for beautiful body text typography |

---

## Architecture

### Affected files

- `frontend/components/ChatMessage.tsx` — primary change: replace `{message.content}` with `<ReactMarkdown>` for assistant messages
- `frontend/globals.css` — import a highlight.js theme (e.g. `github-dark`)
- `frontend/tailwind.config.ts` — add `@tailwindcss/typography` plugin
- `frontend/package.json` — new dependencies

### No backend changes required.

---

## Component Design

```tsx
// assistant bubble only
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
  components={{
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    ),
    // additional overrides as needed
  }}
>
  {message.content}
</ReactMarkdown>
```

Wrapped in:
```tsx
<div className="prose prose-sm dark:prose-invert max-w-none">
```

### User messages

Unchanged — plain text bubble. Users type plain text, not markdown.

---

## Styling

- **Typography:** Tailwind `prose prose-sm dark:prose-invert max-w-none` applied to assistant message container
- **Links:** `target="_blank" rel="noopener noreferrer"` via custom `a` component override
- **Code blocks:** `highlight.js` theme imported in `globals.css` — use `github-dark` or equivalent to match Obsidian theme
- **Inline code:** styled via `prose` defaults

---

## Error Handling

- `react-markdown` is resilient to malformed markdown — it degrades gracefully to plain text
- No additional error handling required

---

## Testing

- Send a message asking the AI to list items in bullet points → verify rendered `<ul>/<li>`
- Send a message asking for a table → verify rendered `<table>`
- Send a message asking for code → verify syntax-highlighted `<pre><code>`
- Send a message with a URL → verify clickable link opening in new tab
- Send a plain user message → verify unchanged plain text bubble

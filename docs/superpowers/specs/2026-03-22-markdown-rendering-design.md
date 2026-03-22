# Design: Markdown Rendering for AI Chat Responses

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Frontend only — one component, one CSS file

---

## Problem

The AI assistant returns markdown-formatted text (bullet lists, bold, code blocks, tables, links), but `ChatMessage.tsx` renders `message.content` as a raw text node. All markdown syntax appears as literal characters instead of formatted output.

## Goal

Render assistant messages with full GitHub-Flavored Markdown formatting — matching the visual fidelity of ChatGPT, Claude, and similar AI chat UIs.

---

## Approach

**`react-markdown` + `remark-gfm` + `rehype-highlight`**

Industry-standard React markdown rendering pipeline. Safe (no `dangerouslySetInnerHTML`), composable via custom React components, streaming-friendly.

---

## Packages

| Package | Purpose |
|---|---|
| `react-markdown` | Markdown → React component tree |
| `remark-gfm` | GFM: tables, strikethrough, task lists, autolinks |
| `rehype-highlight` | Syntax highlighting for fenced code blocks |
| `highlight.js` | Peer dep for rehype-highlight (styles) |
| `@tailwindcss/typography` | `prose` plugin for beautiful body text typography |

Install with:
```bash
npm install react-markdown remark-gfm rehype-highlight highlight.js @tailwindcss/typography
```

> TypeScript types are bundled with `react-markdown`; no `@types` package needed. Use `type ComponentProps` from React for custom component typings.

---

## Performance

- `highlight.js` ~50KB gzipped, `react-markdown` + plugins ~30KB gzipped
- Total additional bundle: ~80KB gzipped
- Acceptable for a chat UI; no lazy-loading required for this use case

---

## Architecture

### Affected files

| File | Change |
|---|---|
| `frontend/components/ChatMessage.tsx` | Replace raw `{message.content}` with conditional `<ReactMarkdown>` for assistant role |
| `frontend/app/globals.css` | Register typography plugin and import highlight.js theme |
| `frontend/package.json` | New dependencies |

**No `tailwind.config.ts` changes.** This project uses Tailwind CSS v4 with CSS-based configuration. Plugins are registered in `globals.css` via the `@plugin` directive.

**No backend changes required.**

---

## Component Design

### Imports required

```tsx
import { type ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
```

### Conditional rendering (user vs assistant)

```tsx
<div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
  <div
    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
      isUser
        ? 'rounded-br-sm bg-primary text-primary-foreground'
        : 'rounded-bl-sm bg-muted text-foreground prose prose-sm dark:prose-invert max-w-none'
    }`}
  >
    {isUser ? (
      message.content
    ) : (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {message.content}
      </ReactMarkdown>
    )}
  </div>
</div>
```

User messages remain plain text. `prose` and `ReactMarkdown` apply only to assistant messages.

### Custom component overrides

Chat bubbles use `text-sm` and `max-w-[80%]`. Default prose heading sizes (h1 = 2.25em) would be too large. Override them:

```tsx
const markdownComponents: Record<string, React.ElementType> = {
  a: ({ href, children }: ComponentProps<'a'>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  ),
  h1: ({ children }: ComponentProps<'h1'>) => (
    <h2 className="text-lg font-bold mt-2 mb-1">{children}</h2>
  ),
  h2: ({ children }: ComponentProps<'h2'>) => (
    <h3 className="text-base font-bold mt-1.5 mb-0.5">{children}</h3>
  ),
  h3: ({ children }: ComponentProps<'h3'>) => (
    <h4 className="text-sm font-semibold mt-1 mb-0.5">{children}</h4>
  ),
  code: ({ children, className, ...props }: ComponentProps<'code'>) => (
    <code className={`${className ?? ''} bg-muted/50 rounded px-1 py-0.5 text-xs`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }: ComponentProps<'pre'>) => (
    <pre className="bg-muted/50 rounded p-3 overflow-x-auto text-xs my-2">{children}</pre>
  ),
  table: ({ children }: ComponentProps<'table'>) => (
    <table className="text-xs border-collapse w-full my-2">{children}</table>
  ),
};
```

---

## Streaming Behavior

The `ChatInterface` appends tokens incrementally to `message.content` on every SSE event. `react-markdown` re-renders on each update.

- Incomplete markdown during streaming (e.g., `**bold ` mid-stream) renders as literal text temporarily
- Once the token stream closes the markdown syntax, it renders correctly
- This behavior matches ChatGPT — acceptable UX, no buffering or debouncing needed
- `react-markdown` handles partial/malformed markdown gracefully without errors

### Code block language detection

`rehype-highlight` auto-detects language from the fenced code block info string (` ```python `). If no language is specified, it falls back to auto-detection. The custom `code` component receives the detected language via `className` (e.g., `language-python`). This is the expected behavior — no additional configuration required.

---

## Styling — `globals.css`

This project uses Tailwind CSS v4. The current `globals.css` structure is:
```
Line 1: @import "tailwindcss";
Line 2: @import "tw-animate-css";
Line 3: @import "shadcn/tailwind.css";
Line 4: (blank)
Line 5: @custom-variant dark ...
Line 7+: @theme inline { ... }
```

**Insert after line 3**, before the `@custom-variant` directive:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@plugin "@tailwindcss/typography";
@import "highlight.js/styles/github-dark.css";
```

### Theme choice

`github-dark` is the default recommendation as it works well with the project's dark Obsidian-style palette (`--background: #0c0e12`). If the syntax highlight colors feel off after testing, an alternative like `atom-one-dark` or `tokyo-night-dark` can be swapped in by replacing the import path. No other code changes needed to switch themes.

---

## Testing (Manual)

No automated test suite exists in the project. Manual acceptance testing:

1. Ask AI to list items in bullet points → verify rendered `<ul>/<li>`
2. Ask AI for a table → verify rendered `<table>`
3. Ask AI for a code snippet (specify language) → verify syntax-highlighted `<pre><code>`
4. Ask AI for a URL → verify clickable link opening in new tab
5. Ask AI for bold/italic text → verify `<strong>`/`<em>`
6. Send a plain user message → verify unchanged plain text bubble (no markdown applied)
7. Observe streaming mid-response → verify no errors, partial markdown renders as text
8. Check heading sizes visually — should fit within the chat bubble without overflow
9. Check code block contrast against Obsidian dark background — swap theme if needed

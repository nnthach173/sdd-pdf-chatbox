# Markdown Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render AI assistant chat messages as rich GitHub-Flavored Markdown instead of plain text.

**Architecture:** Install `react-markdown` + `remark-gfm` + `rehype-highlight`, wire them into `ChatMessage.tsx` for assistant-only messages, register the typography plugin and code highlight theme in `globals.css`. No backend changes.

**Tech Stack:** Next.js 16.2 / React 19, Tailwind CSS v4 (CSS-based config), `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js`, `@tailwindcss/typography`

**Spec:** `docs/superpowers/specs/2026-03-22-markdown-rendering-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/components/ChatMessage.tsx` | Modify | Render assistant messages via ReactMarkdown with custom component overrides |
| `frontend/app/globals.css` | Modify | Register typography plugin + import highlight.js theme |
| `frontend/package.json` | Auto-updated by npm | New dependencies |

---

## Task 1: Install dependencies

**Files:**
- Modify: `frontend/package.json` (via npm)

- [ ] **Step 1: Install packages**

```bash
cd frontend
npm install react-markdown remark-gfm rehype-highlight highlight.js @tailwindcss/typography
```

Expected: All packages install without errors. `package.json` and `package-lock.json` updated.

- [ ] **Step 2: Verify install**

```bash
ls node_modules/react-markdown node_modules/remark-gfm node_modules/rehype-highlight node_modules/highlight.js node_modules/@tailwindcss/typography
```

Expected: All five directories exist.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install react-markdown, remark-gfm, rehype-highlight, highlight.js, @tailwindcss/typography"
```

---

## Task 2: Register Tailwind typography plugin and highlight.js theme

**Files:**
- Modify: `frontend/app/globals.css` (lines 1-5)

Current file starts with:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 1: Add plugin and theme import**

Insert `@plugin "@tailwindcss/typography";` and `@import "highlight.js/styles/github-dark.css";` after line 3 (`@import "shadcn/tailwind.css";`), before the blank line and `@custom-variant`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@plugin "@tailwindcss/typography";
@import "highlight.js/styles/github-dark.css";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 2: Verify the dev server still starts**

```bash
cd frontend
npm run dev
```

Expected: Server starts without CSS errors. Visit `http://localhost:3000` and confirm the page loads normally.

- [ ] **Step 3: Commit**

```bash
cd ..
git add frontend/app/globals.css
git commit -m "feat: register tailwind typography plugin and github-dark highlight theme"
```

---

## Task 3: Rewrite ChatMessage.tsx with markdown rendering

**Files:**
- Modify: `frontend/components/ChatMessage.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `frontend/components/ChatMessage.tsx` with:

```tsx
import { type ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { type ChatMessage as ChatMessageType } from '@/lib/api';

interface Props {
  message: ChatMessageType;
}

const markdownComponents = {
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

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
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
  );
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: No errors. If you see "Cannot find module 'react-markdown'", ensure Task 1 completed successfully.

- [ ] **Step 3: Confirm dev server still runs**

```bash
npm run dev
```

Expected: No build errors. Open `http://localhost:3000`, navigate to a document chat — the UI should still load.

- [ ] **Step 4: Commit**

```bash
cd ..
git add frontend/components/ChatMessage.tsx
git commit -m "feat: render assistant messages as GitHub-Flavored Markdown"
```

---

## Task 4: Manual acceptance testing

**No automated test suite exists in this project. Run these manual checks.**

- [ ] **Step 1: Start the full stack**

Backend:
```bash
cd backend
uvicorn main:app --reload
```

Frontend (new terminal):
```bash
cd frontend
npm run dev
```

- [ ] **Step 2: Open a document chat and run each test prompt**

Open `http://localhost:3000`, select or upload a PDF, open its chat.

| # | Prompt to send | Expected result |
|---|---|---|
| 1 | "List 3 key points as bullet points" | Rendered `<ul>` with `<li>` items |
| 2 | "Show a comparison in a table with 2 columns" | Rendered HTML table |
| 3 | "Give me a Python code example" | Syntax-highlighted code block |
| 4 | "What is the URL for OpenAI's website?" | Clickable link, opens in new tab |
| 5 | "Use **bold** and *italic* in your answer" | Bold and italic text rendered |
| 6 | (Type plain text as user) "hello" | Plain text bubble, no markdown rendered |
| 7 | Ask any long question and observe streaming | No errors mid-stream; partial markdown displays as text until complete |
| 8 | Any answer with headings | Headings fit inside the bubble without overflow |
| 9 | Code block answer | Syntax colors readable against dark background |

- [ ] **Step 3: If code highlight colors are off**

Swap the theme in `frontend/app/globals.css`:

```css
/* Replace this line: */
@import "highlight.js/styles/github-dark.css";

/* With one of these alternatives: */
@import "highlight.js/styles/atom-one-dark.css";
/* or */
@import "highlight.js/styles/tokyo-night-dark.css";
```

No other code changes needed. Restart dev server to see the new theme.

- [ ] **Step 4: Final commit if theme was swapped**

```bash
git add frontend/app/globals.css
git commit -m "chore: switch highlight.js theme to <chosen-theme>"
```

---

## Done

All assistant messages now render with full GitHub-Flavored Markdown formatting: bullet lists, tables, syntax-highlighted code blocks, clickable links, bold/italic text, and headings — matching the visual output of ChatGPT and Claude. User messages remain unchanged as plain text.

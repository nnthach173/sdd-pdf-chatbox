# pdf-chatbox

A RAG-powered PDF chatbox. Users upload PDFs, the backend chunks and embeds them, and a chat interface answers questions grounded in the document content.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, uvicorn |
| Backend libs | LangChain, pypdf, openai, supabase-py |
| Frontend | Next.js 16.2.0 (App Router), React 19, TypeScript |
| Frontend libs | `@supabase/ssr`, react-pdf v9, Tailwind CSS, shadcn/ui |
| Database | Supabase PostgreSQL + pgvector |
| Storage | Supabase Storage (`pdfs` bucket) |
| Auth | Supabase Auth |

---

## Project Structure

```
backend/
  main.py               — FastAPI app entry point
  routers/              — auth.py, chat.py, documents.py, dependencies.py
  services/             — embedding_service.py, pdf_service.py, rag_service.py
  models/
  database/
  pyproject.toml
  requirements.txt

frontend/
  app/                  — Next.js App Router pages (layout.tsx, page.tsx, auth/page.tsx)
  components/           — AppHeader, AppSidebar, AuthForm, AuthGuard, ChatInterface,
                          ChatMessage, ChatView, DocumentCard, DocumentList,
                          DocumentUpload, HomeClient, LibraryView, PanelDivider,
                          PdfViewer, UserMenu
  components/ui/        — shadcn/ui primitives (button, badge, card, dialog, textarea)
```

---

## Commands

```bash
# Backend
cd backend && uvicorn main:app --reload          # start dev server
cd backend && pytest                             # run tests
cd backend && ruff check .                       # lint

# Frontend
cd frontend && npm run dev                       # start dev server
cd frontend && npm run build                     # production build
```

---

## Architecture Rules

These constraints must be respected in every feature and spec:

- **Auth is handled by `@supabase/ssr` on the frontend and `dependencies.py` on the backend.** Do not duplicate auth checks in individual routes or components.
- **All file uploads go through the backend.** Never upload directly from the browser to Supabase Storage.
- **Embeddings are stored in `document_chunks` (pgvector).** Never regenerate embeddings on read — only on ingest.
- **Signed URLs for PDFs** are generated server-side via `create_signed_url(file_path, expires_in=3600)`. Never expose raw storage paths to the client.
- **Guest users** can upload and chat without an account. Per-user storage is scoped by auth session when logged in.
- **Split panel layout** persists the ratio in `localStorage` under key `obsidian-split-ratio`.

---

## Code Style

- **TypeScript:** No `any` — always type explicitly. Use `interface` for object shapes.
- **Python:** Pydantic models for all request/response validation. No bare `dict` in route signatures.
- **Components:** Functional only — no class components.
- **CSS:** Tailwind utility classes only — no custom CSS files unless unavoidable.
- **Imports:** Use absolute imports from the project root, not relative `../../../`.

---

## What NOT to Do

- Do not rename or drop Supabase DB columns without a migration plan — the cost is high.
- Do not add optimistic UI without discussing first — correctness over perceived speed.
- Do not commit `.env` or any file containing API keys or secrets.
- Do not mock the database in tests — tests must use the real schema.
- Do not add speculative abstractions, helpers, or utilities for one-time use.
- Do not add error handling for scenarios that cannot happen — only validate at system boundaries.

---

## Spec-Driven Development

Feature work follows the speckit workflow:
1. `speckit.specify` — write the feature spec
2. `speckit.plan` — design the implementation plan
3. `speckit.tasks` — generate ordered tasks
4. `speckit.implement` — execute tasks with checkpoints

Feature specs live in `specs/`. The stack, constraints, and rules above apply to every spec — do not restate them per feature.

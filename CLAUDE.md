# pdf-chatbox Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-22

## Active Technologies
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (002-pdf-split-view)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (002-pdf-split-view)
- Python 3.11 (backend) · TypeScript / Next.js 14 App Router (frontend) + FastAPI, supabase-py (backend) · Tailwind CSS, shadcn/ui (frontend) (002-pdf-split-view)
- Supabase Storage — signed URL generation via `create_signed_url(path, expires_in=3600)` (002-pdf-split-view)
- Python 3.11 (backend) · TypeScript / Next.js 16.2.0 with React 19 (frontend) + FastAPI, supabase-py (backend) · `react-pdf` v9.x, Tailwind CSS, shadcn/ui (frontend) (002-pdf-split-view)
- Supabase Storage — signed URL via `create_signed_url(file_path, expires_in=3600)` (002-pdf-split-view)
- TypeScript / Next.js (App Router) — frontend only + React 19, Next.js `useSearchParams`, `useRouter`, Tailwind CSS, existing components (PanelDivider, PdfViewer, ChatInterface, DocumentUpload, DocumentList) (005-persistent-layout-nav)
- `localStorage` for split ratio preference (key: `obsidian-split-ratio`) (005-persistent-layout-nav)

- Python 3.11 (backend) · TypeScript / Node 18+ (frontend) + FastAPI, LangChain, pypdf, openai, supabase-py, uvicorn (001-pdf-rag-chatbox)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

Python 3.11 (backend) · TypeScript / Node 18+ (frontend): Follow standard conventions

## Recent Changes
- 005-persistent-layout-nav: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 005-persistent-layout-nav: Added TypeScript / Next.js (App Router) — frontend only + React 19, Next.js `useSearchParams`, `useRouter`, Tailwind CSS, existing components (PanelDivider, PdfViewer, ChatInterface, DocumentUpload, DocumentList)
- 002-pdf-split-view: Added Python 3.11 (backend) · TypeScript / Next.js 16.2.0 with React 19 (frontend) + FastAPI, supabase-py (backend) · `react-pdf` v9.x, Tailwind CSS, shadcn/ui (frontend)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

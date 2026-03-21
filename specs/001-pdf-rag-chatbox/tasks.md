# Tasks: PDF RAG Chatbox

**Input**: Design documents from `/specs/001-pdf-rag-chatbox/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create folder structure and configure formatters before any code is written.

- [X] T001 Create backend folder structure: `backend/routers/`, `backend/services/`, `backend/database/`, `backend/models/`
- [X] T002 [P] Configure Black formatter — create `backend/pyproject.toml` with `[tool.black]` section (line-length = 88)
- [X] T003 [P] Install shadcn/ui in frontend — run `npx shadcn@latest init` and add Button, Card, Badge, Dialog, Textarea components
- [X] T004 [P] Configure Prettier — create `frontend/.prettierrc` with singleQuote, semi, tabWidth: 2

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create FastAPI app entry point with CORS (localhost:3000 + Vercel domain), router registration stubs, and `GET /health` endpoint in `backend/main.py`
- [X] T006 [P] Create Supabase client singleton using service key from `.env` in `backend/database/supabase_client.py`
- [X] T007 [P] Create Pydantic schemas — `DocumentResponse`, `DocumentListItem`, `ChatRequest`, `ChatMessageResponse` in `backend/models/schemas.py`
- [ ] T008 Run the SQL schema from `specs/001-pdf-rag-chatbox/data-model.md` in the Supabase SQL Editor to create `documents`, `document_chunks`, and `chat_messages` tables *(manual step)*
- [ ] T009 Create a Supabase Storage bucket named `pdfs` (private) via the Supabase dashboard → Storage → New bucket *(manual step)*
- [X] T010 Create typed `fetch` wrappers for all API endpoints — `uploadDocument`, `listDocuments`, `getDocument`, `deleteDocument`, `getChatHistory` in `frontend/lib/api.ts`
- [X] T011 Create root layout with page shell and metadata in `frontend/app/layout.tsx`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Upload and Process PDF (Priority: P1) 🎯 MVP

**Goal**: User uploads a PDF, sees processing status update in real time, document appears as "ready" when processing completes.

**Independent Test**: Upload a small PDF → verify it appears in the document list with status "processing" → status updates to "ready" → document page_count is populated.

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement `extract_text(file_bytes: bytes) -> str` and `chunk_text(text: str) -> list[str]` in `backend/services/pdf_service.py` — use pypdf for extraction (raise `ScannedPDFError` if text is empty), LangChain `RecursiveCharacterTextSplitter` for 500-token chunks with 50-token overlap
- [X] T013 [P] [US1] Implement `embed_chunks(chunks: list[str]) -> list[list[float]]` in `backend/services/embedding_service.py` — batch call to OpenAI `text-embedding-3-small`, return list of 1536-dim vectors
- [X] T014 [US1] Implement `POST /documents/upload` endpoint in `backend/routers/documents.py` — validate file type (PDF only) and size (≤ 50MB), upload to Supabase Storage bucket `pdfs`, insert Document row with status `processing`, enqueue `BackgroundTask` that runs: extract → chunk → embed → insert chunks → update status to `ready` (or `failed` with error_msg on exception)
- [X] T015 [US1] Add `GET /documents` (ordered by created_at DESC) and `GET /documents/{id}` (single document for status polling) endpoints to `backend/routers/documents.py`
- [X] T016 [P] [US1] Create `DocumentUpload` component — drag-and-drop zone with file picker fallback, client-side validation (PDF type, 50MB limit), upload progress bar, error display in `frontend/components/DocumentUpload.tsx`
- [X] T017 [P] [US1] Create `DocumentCard` component (name, upload date, status badge: grey=uploading, yellow=processing, green=ready, red=failed) and `DocumentList` wrapper in `frontend/components/DocumentCard.tsx` and `frontend/components/DocumentList.tsx`
- [X] T018 [US1] Build home page — renders `DocumentUpload` + `DocumentList`, polls `GET /documents` every 3 seconds while any document has status `uploading` or `processing`, navigates to `/chat/[id]` on card click in `frontend/app/page.tsx`

**Checkpoint**: Upload a PDF and confirm it transitions to "ready" in the document list. Click it and verify navigation to the chat route.

---

## Phase 4: User Story 2 — Chat with a PDF Document (Priority: P2)

**Goal**: User opens a ready document, asks a question, receives a streamed AI response grounded in the document's content. Conversation persists across browser restarts.

**Independent Test**: Open a ready document → ask a factual question → verify streamed response references document content → close browser → reopen document → verify prior conversation is fully restored.

### Implementation for User Story 2

- [X] T019 [P] [US2] Implement `rag_service.py` with three focused functions in `backend/services/rag_service.py`:
  - `retrieve_chunks(document_id: str, question_embedding: list[float], top_k: int = 5) -> list[str]` — pgvector cosine similarity query (`<=>`) against `document_chunks`
  - `build_prompt(chunks: list[str], history: list[dict], question: str) -> list[dict]` — system prompt enforcing document-only answers, context chunks, last 6 messages, current question
  - `stream_response(messages: list[dict]) -> AsyncIterator[str]` — gpt-4o-mini streaming via OpenAI SDK
- [X] T020 [US2] Implement `POST /chat/{document_id}` SSE streaming endpoint in `backend/routers/chat.py` — validate document exists and status is `ready`, embed question, retrieve top-5 chunks, fetch last 6 messages from DB, build prompt, stream response as `text/event-stream` with `{"type":"token","content":"..."}` and `{"type":"done","content":""}` events, save user + assistant messages to `chat_messages` after stream completes
- [X] T021 [US2] Add `GET /chat/{document_id}/history` endpoint to `backend/routers/chat.py` — return all messages for the document ordered by `created_at ASC` (no session filtering — one persistent conversation per document per FR-016)
- [X] T022 [P] [US2] Create `ChatMessage` component — distinct visual styles for user (right-aligned) and assistant (left-aligned) message bubbles in `frontend/components/ChatMessage.tsx`
- [X] T023 [US2] Create `ChatInterface` component — renders message history using `ChatMessage`, input bar with submit on Enter, appends streamed tokens to the last message as they arrive via `fetch` + `ReadableStream`, auto-scrolls to latest message in `frontend/components/ChatInterface.tsx`
- [X] T024 [US2] Build chat page — loads full message history via `GET /chat/{documentId}/history` on mount, renders document name header + `ChatInterface`, handles loading and error states in `frontend/app/chat/[documentId]/page.tsx`

**Checkpoint**: Ask a question about an uploaded document and confirm the response streams progressively. Close and reopen the browser — confirm prior conversation is restored.

---

## Phase 5: User Story 3 — Manage Uploaded Documents (Priority: P3)

**Goal**: User can view all uploaded documents with their statuses, delete documents they no longer need, and see a helpful empty state when no documents exist.

**Independent Test**: Upload two documents → verify both appear in list with correct metadata → delete one → confirm it disappears and its chat history is gone → delete the last one → confirm empty state prompt appears.

### Implementation for User Story 3

- [X] T025 [US3] Add `DELETE /documents/{id}` endpoint to `backend/routers/documents.py` — delete PDF file from Supabase Storage, delete Document row from DB (cascade removes `document_chunks` and `chat_messages`), return 204 No Content
- [X] T026 [US3] Add delete confirmation dialog to `DocumentCard` in `frontend/components/DocumentCard.tsx` — use shadcn/ui `Dialog`, call `deleteDocument(id)` on confirm, refresh document list on success
- [X] T027 [US3] Add empty-state prompt to `DocumentList` in `frontend/components/DocumentList.tsx` — display when document list is empty: icon + "Upload your first PDF to get started" message with a call-to-action

**Checkpoint**: Upload, view, and delete documents. Verify empty state appears after last document is deleted.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: User-facing error handling and production readiness that spans all stories.

- [X] T028 [P] Add user-friendly error toasts or inline banners for all API failure states across `DocumentUpload.tsx`, `DocumentList.tsx`, and `ChatInterface.tsx` — no raw error codes or stack traces in the UI (Principle V)
- [ ] T029 [P] Add Vercel production domain to CORS `allow_origins` list in `backend/main.py` (update after Vercel deploy URL is known)
- [ ] T030 Run full end-to-end validation per `specs/001-pdf-rag-chatbox/quickstart.md` — upload PDF, confirm processing, chat, close browser, return and confirm history restored, delete document

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2 or US3
- **US2 (Phase 4)**: Depends on Phase 2 + US1 (document must exist and be ready to chat with)
- **US3 (Phase 5)**: Depends on Phase 2 + US1 (documents must exist to manage them)
- **Polish (Phase 6)**: Depends on all story phases complete

### Within Each User Story

- Backend services (T012, T013, T019) → Backend routes (T014, T015, T020, T021) → Frontend components (T016, T017, T022, T023) → Frontend pages (T018, T024)
- Tasks marked [P] within a phase can be worked on simultaneously

### Parallel Opportunities

```
Phase 1 — all 4 tasks can run in parallel:
  T001, T002, T003, T004

Phase 2 — after T005 is done:
  T006, T007 can run in parallel
  T008, T009 are manual and can run any time

Phase 3 (US1) — backend services in parallel, then routes, then frontend:
  T012 ║ T013         (parallel — different files)
       ↓
  T014 → T015         (sequential — same router file)
       ↓
  T016 ║ T017         (parallel — different components)
       ↓
  T018                (depends on T016 + T017)

Phase 4 (US2):
  T019                (parallel with nothing — new file)
       ↓
  T020 → T021         (sequential — same router file)
       ↓
  T022                (parallel — new component)
       ↓
  T023 → T024         (sequential — page depends on ChatInterface)

Phase 6:
  T028 ║ T029         (parallel — different concerns)
       ↓
  T030                (end-to-end validation last)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**do not skip — blocks everything**)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Upload a PDF, watch it process, confirm "ready" status
5. You have a working PDF ingestion system — ship it or continue

### Incremental Delivery

1. Setup + Foundational → scaffold ready
2. + User Story 1 → PDF upload and processing working ✅
3. + User Story 2 → Chat with documents working ✅
4. + User Story 3 → Document management working ✅
5. + Polish → production-ready ✅

---

## Notes

- [P] tasks have no shared file dependencies — safe to implement simultaneously
- [Story] label traces each task back to its acceptance criteria in spec.md
- Each story phase ends with a clearly-defined independent checkpoint test
- Manual steps (T008, T009) can be done at any point before Phase 3 begins
- Commit after completing each phase checkpoint before starting the next

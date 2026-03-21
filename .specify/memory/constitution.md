<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Modified principles: N/A
Added sections:
  - VII. Code Quality and Readability (new)
  - VIII. UI/UX Design Philosophy (new)
Templates reviewed:
  - .specify/templates/plan-template.md ✅ (compatible)
  - .specify/templates/spec-template.md ✅ (no updates needed)
  - .specify/templates/tasks-template.md ✅ (compatible)
Follow-up TODOs: None.
-->

# PDF Chatbox Constitution

## Core Principles

### I. Free-Tier First

All third-party services, infrastructure, and tooling MUST use free tiers or
open-source self-hosted alternatives. No paid service may be introduced without
explicit user approval and documentation of why a free alternative is
insufficient. Current approved free services: Supabase (database + storage),
Vercel (frontend hosting), OpenAI pay-as-you-go at minimum cost.

### II. Backend-Only AI and Secret Handling

All PDF processing, text extraction, embedding generation, and AI API calls
MUST execute exclusively on the FastAPI backend. API keys (OpenAI, Supabase
service_role) MUST never be present in frontend code, environment variables
prefixed with `NEXT_PUBLIC_`, or any client-delivered bundle. The frontend
MUST only receive results — never raw API credentials or AI client instances.

### III. RAG Grounding — No Hallucination

AI responses MUST be grounded in content retrieved from the user's uploaded
document. When retrieved context does not contain sufficient information to
answer a question, the AI MUST clearly communicate this to the user rather than
drawing on general knowledge or fabricating an answer. Every AI response
pipeline MUST pass retrieved chunks as context before generating output.

### IV. Streaming First

All AI-generated responses MUST be streamed progressively to the user as tokens
are produced. Buffering a complete AI response before displaying it is
prohibited. The backend MUST expose a streaming endpoint and the frontend MUST
consume and render the stream incrementally.

### V. User-Friendly Error Handling

All errors surfaced to the user MUST be written in plain, human-readable
language. Raw stack traces, HTTP status codes, and internal exception messages
MUST never reach the UI. Every error state MUST include a clear message
explaining what went wrong and, where possible, what the user can do next.

### VI. Simplicity (YAGNI)

Build only what is specified. No feature, abstraction, or utility may be added
"for future use." Three similar lines of code are preferable to a premature
abstraction. Complexity MUST be justified against a concrete current requirement,
not a hypothetical future one. Every violation of this principle in the plan
MUST be documented in the Complexity Tracking table of `plan.md`.

### VII. Code Quality and Readability

All code MUST be readable, maintainable, and self-documenting. Variable and
function names MUST clearly convey intent without requiring surrounding context
to understand. Complex logic MUST be broken into smaller, focused functions —
each doing one thing well. Consistent formatting and structure MUST be followed
across the entire codebase (enforced via language-standard formatters: Black for
Python, Prettier for TypeScript). Comments MUST explain the "why" behind a
decision, not restate what the code already shows. Comments describing "what"
the code does are only acceptable when the logic is genuinely non-obvious and
cannot be simplified further.

### VIII. UI/UX Design Philosophy

The UI MUST look modern and visually clean. Prefer simplicity over complexity in
every UX decision — fewer steps, fewer options, clearer labels. When in doubt,
do less and do it well. This principle may be amended in future iterations as
design requirements evolve.

## Technology Constraints

- **Frontend**: Next.js 14 (App Router) with Tailwind CSS. No additional UI
  frameworks without explicit approval.
- **Backend**: FastAPI (Python 3.11+). All AI orchestration uses LangChain.
- **Database**: Supabase PostgreSQL with pgvector extension for vector storage.
  No additional databases may be introduced.
- **Embeddings**: OpenAI `text-embedding-3-small` (cheapest, sufficient quality).
- **Chat model**: OpenAI `gpt-4o-mini`.
- **PDF parsing**: pypdf (already installed). No alternative parsers unless
  pypdf demonstrably fails for a required use case.

## Development Workflow

- User stories are implemented in priority order: P1 → P2 → P3.
- Each user story MUST be independently testable before the next begins.
- Environment variables MUST be managed via `.env` files and MUST be listed in
  `.gitignore`. No secrets may be committed to version control.
- All frontend-to-backend communication MUST go through the FastAPI API.
  The frontend MUST NOT query Supabase directly for AI or document processing
  operations (read-only display queries via the anon key are permitted).

## Governance

This constitution supersedes all other development guidelines. Any amendment
requires: (1) a documented reason, (2) a version bump following semantic
versioning, and (3) an update to the Sync Impact Report comment at the top of
this file. All feature plans MUST include a Constitution Check gate that
verifies compliance with Principles I–VI before implementation begins.

**Version**: 1.1.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20

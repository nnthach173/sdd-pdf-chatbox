# Research: Free Public Deployment

**Branch**: `012-free-deployment` | **Date**: 2026-04-03

## Decision Log

### 1. Frontend Hosting Platform

**Decision**: Vercel
**Rationale**: Vercel is already listed as an approved free service in the project constitution (Principle I). It supports Next.js 16 App Router natively with zero configuration — no adapters, no edge-runtime caveats. It offers unlimited deployments, 100 GB bandwidth/month, HTTPS, and automatic preview deployments on push. No credit card required for the Hobby (free) plan.
**Alternatives considered**:
- Netlify — requires a community adapter for full Next.js SSR; extra configuration complexity.
- Cloudflare Pages — requires `@cloudflare/next-on-pages` adapter; some App Router features not supported.

---

### 2. Backend Hosting Platform

**Decision**: Render (free Web Service)
**Rationale**: Render's free Web Service tier supports Python 3.11+, auto-detects `requirements.txt`, and runs any start command. No credit card required. The free tier provides 512 MB RAM and 0.1 vCPU — sufficient for <100 users doing PDF RAG queries sequentially. The main tradeoff is that the service **sleeps after 15 minutes of inactivity**, causing a ~30-second cold-start on the first request. This is acceptable for the stated usage scale.
**Alternatives considered**:
- Koyeb (nano instance) — always-on but 256 MB RAM may be tight for LangChain + embedding inference; less documentation.
- Fly.io — always-on but requires `fly.toml` config and CLI setup; higher entry effort.
- Railway — no sleeping but the free tier is a $5 one-time credit (not indefinitely free).
- Hugging Face Spaces — intended for ML demos; FastAPI is supported but startup is slow.

---

### 3. CORS Configuration

**Decision**: Add Vercel production domain to `allow_origins` in `backend/main.py`
**Rationale**: The current CORS config only allows `http://localhost:3000`. The Vercel deployment domain (e.g., `https://pdf-chatbox.vercel.app`) must be added, or all browser requests from production will be blocked by CORS preflight.
**Pattern**: Use an environment variable `ALLOWED_ORIGINS` on Render to supply the Vercel URL at runtime, so the backend code remains environment-agnostic.

---

### 4. Environment Variables — Backend (Render)

Required secrets to configure in Render's dashboard (Environment tab):

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | `https://<project>.supabase.co` | From Supabase project settings |
| `SUPABASE_KEY` | `<service_role key>` | Service role key (backend only — never expose) |
| `OPENAI_API_KEY` | `sk-...` | OpenAI account API key |
| `ALLOWED_ORIGINS` | `https://<app>.vercel.app` | Vercel deploy URL; comma-separated if multiple |

**Note**: `SUPABASE_KEY` in the backend uses the `service_role` key (bypasses RLS for server operations). This must NEVER appear in frontend env vars.

---

### 5. Environment Variables — Frontend (Vercel)

Required secrets to configure in Vercel's dashboard (Project > Settings > Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | Safe — anon access only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon key>` | Safe — protected by RLS |
| `NEXT_PUBLIC_API_URL` | `https://<app>.onrender.com` | Render backend URL |

**Note**: `NEXT_PUBLIC_` prefix makes values visible in the browser bundle — only anon/public values belong here. The `NEXT_PUBLIC_API_URL` is the Render service URL; no secrets are exposed.

---

### 6. Render Deployment Configuration

**Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
**Root directory**: `backend/`
**Python version**: 3.11 (set via `PYTHON_VERSION` env var or `runtime.txt`)
**Build command**: `pip install -r requirements.txt`

Render auto-assigns a `$PORT` environment variable; `--port $PORT` is required — hardcoding port 8000 will fail.

---

### 7. Cold-Start UX Handling

**Decision**: No code change needed for cold-start handling
**Rationale**: The frontend already shows a loading/streaming state. A ~30-second cold start on Render's free tier is acceptable for <100-user demos. The chat interface streams tokens progressively once the backend wakes, so users see activity as soon as the connection is established.
**Alternative considered**: A "ping" endpoint called on app load to pre-warm the backend — rejected per Principle VI (YAGNI); adds complexity for a marginal UX gain at this scale.

---

### 8. Supabase Auth Redirect URL

**Finding**: Supabase Auth requires that the production frontend URL be added to the project's **Redirect URLs** list (Authentication > URL Configuration). Without this, OAuth/email confirmation links will fail in production.
**Action required**: Add `https://<app>.vercel.app/**` to Supabase allowed redirect URLs after the Vercel deploy URL is known.

---

### 9. Static Asset / PDF Signed URLs

**Finding**: PDF viewing uses Supabase Storage signed URLs generated by the backend. These are absolute HTTPS URLs pointing to Supabase's CDN — no changes needed for deployment. The frontend's `PdfViewer` component receives and renders the signed URL directly.

---

## All NEEDS CLARIFICATION Resolved

No open clarifications remain. All decisions above are based on:
- Constitution Principle I (approved Vercel; Render is new but free-tier first)
- Project code inspection (CORS, env var patterns, API base URL logic in `lib/api.ts`)
- Free-tier platform documentation reviewed 2026-04-03

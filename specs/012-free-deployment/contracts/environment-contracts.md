# Environment Variable Contracts

**Branch**: `012-free-deployment` | **Date**: 2026-04-03

These contracts define the complete set of environment variables required to run the application in production. Any deployment that does not satisfy all Required variables will result in a broken service.

---

## Backend (Render) — Required Variables

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service_role_key>
OPENAI_API_KEY=sk-<...>
ALLOWED_ORIGINS=https://<project>.vercel.app
PYTHON_VERSION=3.11
```

### Rules

- `SUPABASE_KEY` MUST be the **service_role** key (not the anon key). It bypasses RLS to allow server-side document management.
- `ALLOWED_ORIGINS` supports comma-separated values for multiple Vercel preview URLs if needed.
- These values MUST be set in Render's dashboard under **Environment** → **Environment Variables**. They MUST NOT be committed to source control.

---

## Frontend (Vercel) — Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com
```

### Rules

- All three variables MUST be present in Vercel's **Project Settings → Environment Variables** under the **Production** environment.
- `NEXT_PUBLIC_API_URL` MUST use HTTPS and point to the Render service URL with **no trailing slash**.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose — it is protected by Supabase Row-Level Security.
- `NEXT_PUBLIC_API_URL` exposes the backend URL in the browser bundle — this is intentional and not a security risk.

---

## Supabase Auth — Required Configuration (Manual, in Supabase Dashboard)

Navigate to: **Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `https://<project>.vercel.app` |
| Redirect URLs | `https://<project>.vercel.app/**` |

Without this, email confirmation links and OAuth callbacks will be rejected.

---

## CORS Contract — Backend `main.py`

The backend MUST read `ALLOWED_ORIGINS` from environment and use it to populate `CORSMiddleware.allow_origins`. This allows the Render service to be configured for different Vercel URLs without code changes.

**Before** (current — development only):
```python
allow_origins=["http://localhost:3000"]
```

**After** (production-ready):
```python
import os
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
allow_origins=[o.strip() for o in origins]
```

Local development: set `ALLOWED_ORIGINS=http://localhost:3000` in `backend/.env` (already gitignored).
Production: set `ALLOWED_ORIGINS=https://<project>.vercel.app` in Render dashboard.

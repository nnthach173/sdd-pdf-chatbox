# Deployment Quickstart Guide

**Feature**: 012-free-deployment | **Date**: 2026-04-03
**Goal**: Deploy the PDF Chatbox to Vercel (frontend) + Render (backend) for free.

**Prerequisites**: GitHub account, Vercel account (free), Render account (free), Supabase project already running.

---

## Step 1 — Gather Your Credentials

From your Supabase project dashboard (**Project Settings → API**):

| What | Where |
|------|-------|
| `SUPABASE_URL` | Project URL field |
| `SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` `secret` key |

From your OpenAI account (**API Keys**):

| What | Where |
|------|-------|
| `OPENAI_API_KEY` | Any active API key |

---

## Step 2 — Deploy the Backend on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pdf-chatbox-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**
4. Under **Environment Variables**, add:
   ```
   SUPABASE_URL        = https://<project>.supabase.co
   SUPABASE_KEY        = <service_role_key>
   OPENAI_API_KEY      = sk-<...>
   ALLOWED_ORIGINS     = https://<your-app>.vercel.app   ← fill in after Step 3
   PYTHON_VERSION      = 3.11
   ```
   (Set `ALLOWED_ORIGINS` to a placeholder first; update it after the Vercel URL is known.)
5. Click **Create Web Service** — Render will build and deploy.
6. Note your Render URL: `https://<service-name>.onrender.com`

---

## Step 3 — Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
4. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon_key>
   NEXT_PUBLIC_API_URL           = https://<service-name>.onrender.com
   ```
5. Click **Deploy** — Vercel will build and publish.
6. Note your Vercel URL: `https://<project-name>.vercel.app`

---

## Step 4 — Update CORS and Auth Redirect URLs

### On Render
Go to your Render service → **Environment** → update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS = https://<project-name>.vercel.app
```
Render will auto-redeploy after saving.

### On Supabase
Go to **Authentication → URL Configuration**:
- **Site URL**: `https://<project-name>.vercel.app`
- **Redirect URLs**: add `https://<project-name>.vercel.app/**`

---

## Step 5 — Verify the Deployment

1. Open your Vercel URL in a browser
2. **Homepage loads** → frontend is working
3. **Upload a PDF as guest** → backend is reachable (may take ~30 s on first request due to cold start)
4. **Chat with the PDF** → AI pipeline is working end-to-end
5. **Register / log in** → Supabase Auth is configured correctly
6. **Upload a PDF as authenticated user** → per-user storage is working

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Chat request fails with CORS error | `ALLOWED_ORIGINS` not set or wrong URL | Update on Render and redeploy |
| First request times out | Render cold start | Wait 30–60 s and retry; expected behaviour |
| Auth redirect fails after email confirmation | Supabase redirect URL not configured | Add Vercel URL to Supabase → Authentication → URL Configuration |
| `NEXT_PUBLIC_API_URL` not set | Missing Vercel env var | Add it in Vercel project settings and redeploy |
| Backend returns 500 on PDF upload | Missing `SUPABASE_KEY` or `OPENAI_API_KEY` | Check Render environment variables |
| PDF panel shows blank | Signed URL expired or CORS on Supabase Storage | Supabase Storage bucket policy — ensure authenticated reads are allowed |

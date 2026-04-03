# Data Model: Free Public Deployment

**Branch**: `012-free-deployment` | **Date**: 2026-04-03

## Overview

This feature introduces no new database entities or schema changes. All existing data models (users, documents, embeddings, chat messages) are unchanged.

The deployment feature is a configuration and infrastructure concern only. The "entities" here are deployment configuration artefacts — they live outside the application database.

---

## Deployment Configuration Entities

### Environment Variable Set (Backend — Render)

A group of secrets configured in Render's dashboard, injected at container startup.

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| `SUPABASE_URL` | URL string | Yes | Supabase project API endpoint |
| `SUPABASE_KEY` | Secret string | Yes | Supabase service-role key (server-only) |
| `OPENAI_API_KEY` | Secret string | Yes | OpenAI API credentials |
| `ALLOWED_ORIGINS` | Comma-separated URLs | Yes | CORS allowlist (Vercel domain) |
| `PYTHON_VERSION` | Version string | Yes | Pins Python 3.11 on Render |

### Environment Variable Set (Frontend — Vercel)

A group of public and private values configured in Vercel's dashboard.

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL string | Yes | Supabase project endpoint (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | Yes | Supabase anon key (public, RLS-protected) |
| `NEXT_PUBLIC_API_URL` | URL string | Yes | Render backend base URL |

### Render Web Service

Represents the deployed backend process on Render's free tier.

| Attribute | Value |
|-----------|-------|
| Runtime | Python 3.11 |
| Root directory | `backend/` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Plan | Free (512 MB RAM, sleeps after 15 min inactivity) |
| Public URL | `https://<service-name>.onrender.com` |

### Vercel Project

Represents the deployed frontend on Vercel's Hobby (free) tier.

| Attribute | Value |
|-----------|-------|
| Framework preset | Next.js |
| Root directory | `frontend/` |
| Build command | `npm run build` (auto-detected) |
| Output | Server-side rendered (App Router) |
| Plan | Hobby — free, no credit card |
| Public URL | `https://<project-name>.vercel.app` |

---

## No Schema Migrations Required

- No new tables, columns, or indexes.
- No changes to Supabase RLS policies.
- No vector store changes.
- Supabase Auth redirect URL list requires a one-time manual update (not a schema migration).

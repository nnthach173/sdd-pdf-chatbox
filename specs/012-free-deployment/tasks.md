# Tasks: Free Public Deployment

**Input**: Design documents from `/specs/012-free-deployment/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**Tests**: No automated test tasks — this is a deployment/configuration feature. Verification is manual (end-to-end checklist in Phase 6).

**Organization**: Tasks are grouped by user story to enable independent validation of each deployment milestone.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[Story]**: Which user story this task belongs to ([US1]–[US4])
- Exact file paths are given for all code changes

## Path Conventions

This is a web app: `backend/` (FastAPI) + `frontend/` (Next.js) at repo root.

---

## Phase 1: Setup (Code Prerequisite)

**Purpose**: The only source-code change required before any platform work. Must be committed and pushed so Render and Vercel pick up the updated code.

- [x] T001 Patch `backend/main.py`: replace hardcoded `allow_origins=["http://localhost:3000"]` with `os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")` and add `import os` at the top (see contracts/environment-contracts.md for exact pattern)
- [x] T002 Remove the `# T029: Add the Vercel deploy URL…` TODO comment from `backend/main.py` (no longer needed after T001)
- [x] T003 Commit and push the `backend/main.py` change to the `012-free-deployment` branch

**Checkpoint**: `git push` succeeds; Render and Vercel will auto-deploy from this branch.

---

## Phase 2: User Story 2 — Deploy Backend (Priority: P1)

**Goal**: Backend API running at a public HTTPS URL on Render's free tier, responding to requests.

**Independent Test**: `GET https://<service>.onrender.com/health` returns `{"status":"ok"}` within 35 seconds.

- [x] T004 [US2] Create a new Render **Web Service**: connect GitHub repo, set root directory to `backend/`, runtime to Python 3, plan to **Free**
- [x] T005 [US2] Set Render build command: `pip install -r requirements.txt`
- [x] T006 [US2] Set Render start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [x] T007 [US2] Add Render environment variables: `SUPABASE_URL`, `SUPABASE_KEY` (service_role key), `OPENAI_API_KEY`, `PYTHON_VERSION=3.11`, and `ALLOWED_ORIGINS=http://localhost:3000` (placeholder — updated in Phase 4)
- [x] T008 [US2] Trigger first Render deploy; monitor build logs until deploy status shows **Live**
- [x] T009 [US2] Verify backend health: open `https://<service>.onrender.com/health` in browser and confirm `{"status":"ok"}` — note the full Render URL for use in Phase 3

**Checkpoint**: Backend is live. Render URL is confirmed. Frontend can now be deployed.

---

## Phase 3: User Story 1 — Deploy Frontend (Priority: P1)

**Goal**: Frontend accessible at a permanent public Vercel URL; all pages load; backend URL is wired in.

**Independent Test**: Navigate to the Vercel URL — the homepage loads within 5 seconds.

- [x] T010 [US1] Create a new Vercel project: import the GitHub repo, set root directory to `frontend/`, framework preset to **Next.js**
- [x] T011 [US1] Add Vercel environment variables (Production scope): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL=https://<service>.onrender.com` (use Render URL from T009)
- [x] T012 [US1] Trigger first Vercel deploy; wait for **Ready** status
- [x] T013 [US1] Open the Vercel production URL and confirm the homepage renders without console errors — note the full Vercel URL for use in Phase 4

**Checkpoint**: Frontend is live. Vercel URL is confirmed. CORS and Auth must now be wired.

---

## Phase 4: Cross-Service Wiring (US1 + US2)

**Purpose**: Connect frontend and backend by updating CORS origins and Supabase Auth redirect URLs. Blocking prerequisite for any feature verification.

**Independent Test**: Upload a PDF as a guest user — the request reaches the backend with no CORS error.

- [x] T014 [US2] Update Render environment variable `ALLOWED_ORIGINS` to the Vercel production URL (e.g., `https://<project>.vercel.app`) — Render will auto-redeploy
- [x] T015 [US1] In the Supabase dashboard → **Authentication → URL Configuration**: set **Site URL** to the Vercel URL and add `https://<project>.vercel.app/**` to **Redirect URLs**
- [x] T016 Wait for Render redeploy to finish (check Render deploy logs); then test CORS by uploading a PDF from the Vercel frontend — confirm no CORS error in browser DevTools Network tab

**Checkpoint**: Full stack connected. Guest upload reaches the backend and returns a document ID.

---

## Phase 5: User Story 3 — Zero Ongoing Cost (Priority: P2)

**Goal**: Confirm both platforms operate at $0 under normal low-traffic usage.

**Independent Test**: Both hosting dashboards show $0 billed after first billing cycle.

- [x] T017 [P] [US3] Check Render dashboard → **Billing**: confirm the Web Service is on the Free plan and current usage shows $0
- [x] T018 [P] [US3] Check Vercel dashboard → **Usage**: confirm the project is on the Hobby plan with no charges and bandwidth is well below the 100 GB/month limit
- [x] T019 [US3] Document the free-tier limits observed (Render: 750 compute-hours/mo; Vercel: 100 GB bandwidth) in `specs/012-free-deployment/quickstart.md` under a new **Free-Tier Limits Reference** section

**Checkpoint**: Both platforms confirmed free. Cost constraint from spec is satisfied.

---

## Phase 6: User Story 4 — Full Feature Parity (Priority: P2)

**Goal**: All existing features work on the deployed environment: guest flow, auth flow, PDF viewing, and AI chat.

**Independent Test**: Complete the end-to-end checklist — all 5 items pass.

- [x] T020 [US4] Verify guest flow: upload a PDF (≤1 MB) as a guest user → PDF appears in the document list with status `ready`
- [x] T021 [US4] Verify PDF viewer: click the uploaded PDF → split-view panel renders the PDF without errors (signed URL is valid)
- [x] T022 [US4] Verify AI chat: type a question about the PDF → streamed AI response appears token-by-token in the chat panel
- [x] T023 [US4] Verify auth flow: register a new account via email → confirm the email confirmation link redirects correctly to the Vercel URL (Supabase Auth redirect URL test)
- [x] T024 [US4] Verify authenticated user flow: log in → upload a second PDF → confirm it appears only in the authenticated user's document list (not in guest list)

**Checkpoint**: All four user stories are validated. The deployment is production-ready for <100 users.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and housekeeping.

- [x] T025 [P] Add `.env.example` to `backend/` listing all required production env vars with placeholder values (mirrors contracts/environment-contracts.md backend section)
- [x] T026 [P] Add `.env.example` to `frontend/` listing all required production env vars with placeholder values (mirrors contracts/environment-contracts.md frontend section)
- [x] T027 Update `ALLOWED_ORIGINS` entry in `backend/.env` to ensure it is set to `http://localhost:3000` for local dev (prevents accidental breakage if someone copies from prod)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US2 Backend (Phase 2)**: Depends on Phase 1 commit — BLOCKS Phase 3
- **US1 Frontend (Phase 3)**: Depends on Phase 2 (needs Render URL)
- **Wiring (Phase 4)**: Depends on Phase 3 (needs Vercel URL) — BLOCKS Phases 5 & 6
- **US3 Cost (Phase 5)**: Depends on Phase 4 completion
- **US4 Features (Phase 6)**: Depends on Phase 4 completion
- **Polish (Phase 7)**: Depends on Phase 6 (all features verified)

### Parallel Opportunities

Within Phase 5: T017 and T018 can run in parallel (different platforms, no dependency).
Within Phase 7: T025 and T026 can run in parallel (different directories).

---

## Parallel Example: Phase 5 (US3)

```
# Check both platforms simultaneously:
Task T017: Review Render billing dashboard
Task T018: Review Vercel usage dashboard
```

---

## Implementation Strategy

### MVP (Deploy Everything — Single Flow)

This feature has no partial-delivery option: the site is either deployed or it isn't. Execute all phases in order:

1. Phase 1 → commit code change
2. Phase 2 → backend live on Render
3. Phase 3 → frontend live on Vercel
4. Phase 4 → wire CORS + Supabase Auth
5. **STOP and VALIDATE**: guest PDF upload works end-to-end (T016)
6. Phase 5 → confirm $0 billing
7. Phase 6 → full feature parity check
8. Phase 7 → polish

### Rollback

If any phase fails:
- Render/Vercel: roll back via their dashboard (previous deployment is preserved)
- Code: revert T001–T003 commit (CORS patch has no risk — falls back to localhost on missing env var)

---

## Notes

- [P] tasks run in parallel with other [P] tasks in the same phase only
- Each story label maps to: US1 = frontend deploy, US2 = backend deploy, US3 = cost verification, US4 = feature parity
- Cold-start delays (~30 s) on Render are expected and not a bug
- Never commit actual `.env` files — only `.env.example` with placeholders (T025, T026)

# Feature Specification: Free Public Deployment

**Feature Branch**: `012-free-deployment`
**Created**: 2026-04-03
**Status**: Draft
**Input**: User description: "Now I want to deploy this website, what I require is all the process must be free, I just need the website to be online and can be accessed by anyone, I DON'T need it to be powerful to host many users, just enough to use all of its features for about less than 100 users. Check and suggest me multiple sites for Backend for Frontend deployment"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy Frontend (Priority: P1)

Any member of the public can navigate to a permanent public URL and use the PDF chatbox — uploading PDFs, chatting, and managing their documents — without installing anything locally.

**Why this priority**: Without a live frontend URL the website is inaccessible to anyone; this is the baseline deliverable.

**Independent Test**: Open the deployed URL in a browser, upload a PDF as a guest, and receive a chat response. Delivers a fully usable product even before backend optimisations.

**Acceptance Scenarios**:

1. **Given** the frontend is deployed, **When** any user opens the public URL, **Then** the homepage loads within 5 seconds and displays the expected UI.
2. **Given** a user is on the public URL, **When** they upload a PDF and send a chat message, **Then** they receive a response without any CORS or network error.
3. **Given** the app is idle overnight, **When** the first user of the day visits, **Then** the page loads without manual restarts (no cold-start failure at the frontend layer).

---

### User Story 2 - Deploy Backend API (Priority: P1)

The backend API (AI chat, PDF processing, auth integration) is reachable from the deployed frontend and processes requests for up to ~100 concurrent users without the operator paying anything.

**Why this priority**: All core features (chat, PDF upload, RAG responses) require a running backend; without it the site is non-functional.

**Independent Test**: Send a direct HTTP request to the deployed backend health endpoint and receive a 200 OK within 10 seconds (accounting for cold-start on free tiers).

**Acceptance Scenarios**:

1. **Given** the backend is deployed on a free-tier host, **When** a request is made to the API, **Then** a valid response is returned within 30 seconds (inclusive of cold-start wake-up).
2. **Given** a user submits a PDF and a chat query, **When** the backend processes the request, **Then** the AI response is returned and displayed in the chat interface.
3. **Given** the free-tier host has resource limits, **When** fewer than 100 users are active simultaneously, **Then** no service errors occur due to compute or memory caps.

---

### User Story 3 - Zero Ongoing Cost (Priority: P2)

The operator can keep the service running indefinitely at $0/month by staying within the free-tier limits of each chosen hosting provider.

**Why this priority**: Cost-freedom is the primary constraint driving platform selection; exceeding free-tier limits would force either shutdown or payment.

**Independent Test**: After 30 days of normal low-traffic usage, the hosting dashboards on all providers show $0 billed.

**Acceptance Scenarios**:

1. **Given** monthly usage is below 100 users, **When** the billing cycle ends on each platform, **Then** the invoice shows $0.
2. **Given** a free-tier limit is approached, **When** the operator reviews the dashboard, **Then** clear usage metrics are visible so they can act before overage charges.

---

### User Story 4 - Full Feature Parity (Priority: P2)

All features that work locally — user authentication, guest PDF upload, signed URL PDF viewing, AI chat, per-user storage, and layout preferences — continue to work on the deployed environment.

**Why this priority**: Partial feature sets would make the deployment unsuitable for sharing or demonstrating the product.

**Independent Test**: Run through a full end-to-end feature checklist on the deployed URL covering guest flow, authenticated flow, PDF viewing, and chat.

**Acceptance Scenarios**:

1. **Given** the app is deployed, **When** a guest uploads a PDF (≤1 MB), **Then** the PDF is stored and viewable in the split-view panel.
2. **Given** the app is deployed, **When** a user registers, logs in, and uploads a PDF, **Then** the PDF is stored in that user's isolated storage and the chat responds correctly.
3. **Given** a signed URL for a PDF is generated, **When** the user views the PDF panel, **Then** the PDF renders without authentication errors.

---

### Edge Cases

- What happens when the backend host enters a cold-start sleep? Users may see a delayed first response (>5 s); the UI must show a loading state rather than a timeout error.
- What happens if a free-tier monthly bandwidth limit is hit? The site should degrade gracefully (e.g., return a clear error message) rather than silently fail.
- What happens when the AI provider (OpenAI) key reaches its free or trial quota? Backend must return a meaningful error message, not an unhandled 500.
- How does the system handle environment variables (API keys, Supabase URLs) securely on each hosting platform? Secrets must be stored as encrypted environment variables, never in source code.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The frontend MUST be deployed to a publicly accessible URL on a free-tier hosting platform.
- **FR-002**: The backend API MUST be deployed to a publicly accessible URL on a free-tier hosting platform that supports Python web servers.
- **FR-003**: The deployed frontend MUST be configured to call the deployed backend URL (not localhost) for all API requests.
- **FR-004**: All sensitive credentials (Supabase URL, Supabase anon key, OpenAI API key) MUST be stored as encrypted environment variables on each hosting platform, not hardcoded.
- **FR-005**: The deployment MUST support all existing features: user auth (login/register), guest PDF upload, PDF viewing via signed URLs, AI chat, and per-user storage isolation.
- **FR-006**: The chosen free-tier plans MUST NOT require a credit card or impose charges for usage consistent with fewer than 100 users per month.
- **FR-007**: The frontend deployment platform MUST support Next.js App Router (server-side rendering and API route support, or static export if all features permit).
- **FR-008**: The backend deployment platform MUST support Python 3.11 and allow installing dependencies from a requirements file.
- **FR-009**: The deployment documentation MUST list at least 3 frontend hosting options and at least 3 backend hosting options, with a comparison of free-tier limits, cold-start behaviour, and Next.js/FastAPI compatibility.
- **FR-010**: Both Render and Vercel MUST be configured to watch the `main` branch for auto-deploys. The deployment workflow MUST include merging the feature branch into `main` as a prerequisite step before any hosting platform configuration.

### Hosting Platform Candidates

#### Frontend Options

| Platform | Free Tier Highlights | Next.js SSR Support | Cold Start | Notes |
|----------|---------------------|---------------------|------------|-------|
| **Vercel** | Unlimited deployments, 100 GB bandwidth/mo, no credit card required | Full (native) | None | Best-in-class for Next.js; recommended default |
| **Netlify** | 100 GB bandwidth/mo, 300 build min/mo | Partial (via adapter) | None | Good alternative; SSR requires Netlify adapter |
| **Cloudflare Pages** | Unlimited bandwidth, unlimited deployments | Partial (Edge runtime) | None | Excellent CDN; some Next.js features need edge adapter |

#### Backend Options

| Platform | Free Tier Highlights | Python/FastAPI | Cold Start | Notes |
|----------|---------------------|---------------|------------|-------|
| **Render** | 750 compute-hours/mo (1 service free), 512 MB RAM | Yes | ~30 s (sleeps after 15 min inactivity) | Easiest setup; free tier spins down on inactivity |
| **Railway** | $5 free credit/mo (trial), no sleeping | Yes | None | Credit expires; suitable for short demos |
| **Fly.io** | 3 shared VMs free, 256 MB RAM each | Yes | ~2–5 s | More config required; no forced sleep |
| **Koyeb** | 1 free nano instance (512 MB RAM, 0.1 vCPU) | Yes | ~5–10 s | Simple UI; always-on on free tier |
| **Hugging Face Spaces** | Free CPU spaces with FastAPI support | Yes | ~10–30 s | Great for ML/AI apps; limited compute |

**Recommended combination (zero cost, <100 users)**: Vercel (frontend) + Render (backend)

### Key Entities

- **Deployment Environment**: A named target (production) with its own set of environment variables and a stable public URL.
- **Environment Variable**: A secret key-value pair stored securely on the hosting platform, injected at runtime.
- **Cold Start**: The delay incurred when a sleeping free-tier backend service receives its first request after a period of inactivity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The website is accessible via a public URL with no login or VPN required, within 24 hours of starting the deployment process.
- **SC-002**: All existing features function correctly on the deployed environment — verified by a manual end-to-end test covering guest upload, authenticated login, PDF viewing, and AI chat.
- **SC-003**: Monthly hosting cost is $0 for usage levels below 100 active users per month across all platforms.
- **SC-004**: The backend responds to API requests within 35 seconds on first wake (cold start) and within 5 seconds on subsequent requests.
- **SC-005**: No credentials or API keys are exposed in source code or browser-accessible files.
- **SC-006**: The deployment can be reproduced from scratch in under 2 hours by following the written deployment guide.

## Assumptions

- The current Supabase project (database, storage, auth) remains on Supabase's free tier and is shared between local development and production.
- OpenAI API usage will remain within the trial/free quota or the operator accepts that AI responses may be rate-limited if the quota is exhausted.
- "Less than 100 users" refers to concurrent or daily active users, not total registered accounts.
- A custom domain is not required; the default subdomain provided by the hosting platform is acceptable.
- The backend does not need persistent disk storage beyond what Supabase provides (no local file system writes required in production).
- Railway's trial credit ($5) is treated as temporary; Render is the preferred backend platform for indefinite free hosting.
- Both Render and Vercel are configured to auto-deploy from the `main` branch. The `012-free-deployment` feature branch must be merged into `main` before the first production deployment is triggered.
- No external error monitoring service is required. Production errors are diagnosed by checking Render's log dashboard when a problem is reported. This is sufficient for a <100-user personal/demo deployment.

## Clarifications

### Session 2026-04-03

- Q: Which GitHub branch should Render and Vercel watch for auto-deploys? → A: `main` — merge the feature branch into `main` first, then Render and Vercel auto-deploy from `main`.
- Q: Is error monitoring/alerting required in production? → A: No — operator checks Render log dashboard on demand when issues are reported; no monitoring service needed.

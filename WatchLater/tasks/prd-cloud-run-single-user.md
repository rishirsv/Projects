# PRD — Single‑User Hosting on Google Cloud Run (B)
_Date: 2025-09-22_

## 1) Introduction / Overview
Host the WatchLater app on **Google Cloud Run** so it’s accessible **only to me** across devices, with minimal cost and maintenance. The service runs the API (Express) and serves the web UI. Persistent files (transcripts/summaries/index) are stored in a **Google Cloud Storage** (GCS) bucket.

**Goal:** Zero‑ops personal deployment, secure by authentication, with weekly jobs (RSS sync + batch).

## 2) Goals
- G1. Deploy as a single container to **Cloud Run**.
- G2. Store outputs and index in **GCS**, not ephemeral disk.
- G3. Restrict access to **my Google account** using **Firebase Auth** (email allowlist).
- G4. Add a **scheduled weekly job** (Cloud Scheduler) to run RSS sync/batch.
- G5. Keep monthly cost near **$0** within free tiers.

## 3) User Stories
- As the owner, I can open a URL, sign in with Google, and use the app from any device.
- As the owner, I receive the weekly digest email without keeping a machine on.
- As the owner, I can see logs and fix issues without SSH.

## 4) Functional Requirements
1. The app builds into a **single Docker image** (Node 20) serving API + static UI.
2. The app writes/reads files via a **Storage provider** abstraction with a GCS implementation.
3. Authentication: The UI requires **Google Sign‑In (Firebase Auth)**; the server verifies Firebase **ID tokens** and allows only a **whitelisted email** (env).
4. A **/jobs/sync-rss** endpoint exists for Scheduler; it executes without UI.
5. Config via environment: GCS bucket name, SES credentials (or alternative), allowed email, playlist IDs.
6. Observability: structured logs, error counts, request IDs; accessible in Cloud Logging.

## 5) Non‑Goals
- Multi‑user access, roles, billing tiers.
- Complex infra (Kubernetes, Cloud SQL).

## 6) Design Considerations
- **Auth UX**: A simple “Sign in with Google” button; after login, the UI stores the Firebase ID token and attaches it to every API call.
- **Storage**: Migrate file IO to a `StorageProvider` interface with two implementations: `LocalFs` and `Gcs`.
- **Front‑end base URL**: `VITE_SERVER_URL` must point to Cloud Run URL.
- **Email**: SES remains cheap and reliable; alternatively, use Gmail API (higher friction).

## 7) Technical Considerations
- Cloud Run requires listening on `$PORT` and not binding to specific IPs.
- Cloud Run disk is **ephemeral**; use GCS for all persistent files.
- Cloud Scheduler calls may require a **service account**; the server should accept an internal token or simply no auth on that specific route gated by a secret `X-Cron-Token` and IAM on Scheduler.
- For dev/prod parity, keep `.env` compatibility; secrets stored in **Secret Manager** in prod.

## 8) Success Metrics
- Cold start < 2s (typical), weekly job completes < 10 min.
- Error rate < 2% for weekly batches.
- Total monthly cost <$2 under typical usage (mostly $0).

## 9) Open Questions
- Prefer **Firebase Auth** (server verifies ID tokens) vs Cloud Run **IAP**? (Firebase is simpler for a single service + SPA.)
- Keep local mode fully supported (feature flag chooses storage provider).

---

## **Implementation Task List (Appended)**

### Relevant Files
- `Dockerfile` — Containerize API + static UI.
- `server.js` — Auth middleware, storage provider hooks, `/jobs/sync-rss` job.
- `src/api.ts` — Point to `VITE_SERVER_URL`, attach ID token header.
- `src/auth/firebase.ts` — Firebase web client (new).
- `server/auth/verifyFirebaseToken.ts` — Server token verifier (new).
- `server/storage/StorageProvider.ts` — Interface (new).
- `server/storage/GcsStorage.ts` — GCS implementation (new).
- `server/storage/LocalFsStorage.ts` — Existing/local implementation (refactor).
- `server/email/ses.ts` — SES sender (new).
- `infra/cloudrun.yaml` — Infra notes or sample deploy script (new).

### Tasks
- [ ] 1.0 Containerize the app
  - [ ] 1.1 Create `Dockerfile` (multi‑stage build, Node 20; build Vite; serve with Express)
  - [ ] 1.2 Ensure app reads `$PORT`; health endpoint returns 200
- [ ] 2.0 Storage provider abstraction
  - [ ] 2.1 Define `StorageProvider` interface (read/write/list/getUrl)
  - [ ] 2.2 Implement `GcsStorage` using `@google-cloud/storage`
  - [ ] 2.3 Wire server endpoints to provider; keep `LocalFsStorage` for dev
- [ ] 3.0 Authentication
  - [ ] 3.1 Add Firebase web client; get ID token after Google sign‑in
  - [ ] 3.2 Add server middleware `verifyFirebaseToken` (check email allowlist env)
  - [ ] 3.3 Attach token to all API calls; handle 401/403 in UI
- [ ] 4.0 Scheduler & job endpoint
  - [ ] 4.1 Implement `/jobs/sync-rss` (idempotent; returns summary JSON)
  - [ ] 4.2 Create Cloud Scheduler job (HTTP, service account or header token)
- [ ] 5.0 Secrets & config
  - [ ] 5.1 Move secrets to Secret Manager; mount as env
  - [ ] 5.2 Add `VITE_SERVER_URL`, `GCS_BUCKET`, `ALLOWED_EMAILS`, `PLAYLIST_IDS`
- [ ] 6.0 Logging & monitoring
  - [ ] 6.1 Add request IDs and structured logs
  - [ ] 6.2 Verify logs in Cloud Logging; basic alert on job failure
- [ ] 7.0 Deploy
  - [ ] 7.1 Build & push image via Cloud Build or local docker
  - [ ] 7.2 `gcloud run deploy` with required flags; test end‑to‑end

# Tasks

## Pre‑flight
- [ ] Ensure clean working tree; create feature branch `feat/cloud-run-single-user`.
- [ ] From `WatchLater/`: `npm ci && npm run lint && npm test -- --runInBand && npm run build`.
- [ ] Confirm `.env.example` contains all keys referenced below.

## Phase A — Containerization & Runtime Config
- [ ] Add multi‑stage `Dockerfile` (Node 20): build Vite client, copy `dist/` and run `server.js`.
- [ ] Read `$PORT` in `server.js` and bind Express to it; keep `/health` fast.
- [ ] Serve static UI: `express.static('dist')` with fallback to `index.html`.
- [ ] Add `VITE_SERVER_URL` support in client; default to `http://localhost:3001`, override in prod.
- [ ] Create `infra/cloudrun.yaml` example with env vars, CPU/memory, min instances = 0, concurrency, timeouts.

## Phase B — Storage Provider Abstraction
- [ ] Introduce `server/storage/StorageProvider.js` (interface: `read`, `write`, `list`, `remove`, `urlFor`).
- [ ] Implement `server/storage/LocalFsStorage.js` using current `exports/` layout.
- [ ] Implement `server/storage/GcsStorage.js` using `@google-cloud/storage` with bucket from env.
- [ ] Replace direct `fs` access in routes with provider calls (summaries, transcripts, listings, deletes, PDFs read).
- [ ] Add small serializer for atomic writes (temp file + rename) to both providers.

## Phase C — Authentication (Single‑User)
- [ ] Client: `src/auth/firebase.ts` to initialize Firebase and fetch ID token.
- [ ] Server: `server/auth/verifyFirebaseToken.js` to verify token, check allow‑listed email(s) from env.
- [ ] Middleware: protect all API routes except `/health` and static assets; return 401/403 with clear JSON.
- [ ] Client: attach `Authorization: Bearer <idToken>` header to all API calls in `src/api.ts` when configured.

## Phase D — Jobs & Scheduler Hook
- [ ] Add `GET /jobs/sync-rss` endpoint (idempotent) delegating to shared sync logic (see RSS PRD).
- [ ] Validate `X-Cron-Token` (env) or require Cloud Scheduler IAM; log job run id + counts.
- [ ] Document Cloud Scheduler setup in `docs/` with sample curl.

## Phase E — Config, Secrets, and Env
- [ ] Wire `.env`/process env for: `GCS_BUCKET`, `ALLOWED_EMAILS`, `VITE_SERVER_URL`, `OPENROUTER_API_KEY`, `SUPADATA_API_KEY`.
- [ ] Add Secret Manager notes to `docs/` and environment mapping for Cloud Run.

## Phase F — Observability
- [ ] Add request ID middleware; log JSON with `{ requestId, route, status, durationMs }`.
- [ ] Log storage provider used and object keys, not contents.
- [ ] Surface `/health` JSON with `{ storage: 'gcs'|'local', auth: 'enabled'|'disabled' }`.

## Validation — Automated
- [ ] `npm run lint`, `npm test -- --runInBand`, `npm run build` pass locally and in container.
- [ ] Container `docker build` completes; `docker run -p 3001:3001` serves UI + API.

## Validation — Manual QA
- [ ] Smoke test all routes behind auth; unauthorized returns 401/403.
- [ ] Switch providers via env and verify reads/writes in local vs GCS.
- [ ] Verify `/jobs/sync-rss` guarded and idempotent; logs include counts.
- [ ] Deploy to Cloud Run; confirm cold start acceptable and UI/API functional end‑to‑end.

## Rollout & Backout
- [ ] PR 1: `feat(cloud): containerize app + static serve`.
- [ ] PR 2: `feat(cloud): storage provider abstraction (local+gcs)`.
- [ ] PR 3: `feat(cloud): firebase auth (single user)`.
- [ ] PR 4: `feat(cloud): scheduler endpoint + docs`.
- [ ] Backout by reverting latest PR; keep local mode as default provider/auth disabled.

## Done When
- [ ] Deployed service requires sign‑in and allow‑listed email.
- [ ] All persistent files live in GCS in cloud mode; local mode unchanged.
- [ ] `/jobs/sync-rss` runs via Cloud Scheduler; logs show processed counts.
- [ ] `.env.example` and docs updated; zero secrets committed.

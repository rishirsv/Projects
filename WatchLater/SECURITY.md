# Security

This repo is designed for **local use**. Treat any deployment as risky unless you harden it.

## Secrets
- Do **not** commit real API keys. Use `.env` locally and `.env.example` in git.
- The `VITE_GEMINI_API_KEY` is exposed to the browser by design; do not deploy this key to a public site.
- If you add OpenRouter or additional providers via `VITE_MODEL_OPTIONS`, keep those credentials local as well and review their usage policies before sharing builds.
- Rotate keys immediately if they were ever pushed to a remote.

## Server hardening (recommended before sharing)
- Lock down CORS with `ALLOWED_ORIGINS`.
- Add a basic rate limiter (e.g., `express-rate-limit`) to `/api/*`.
- Validate inputs (11-char YouTube IDs only).
- Log with request IDs; avoid logging full transcripts or keys.
- Run on Node 20+ with `npm audit` checks in CI.

## Reporting issues
If you discover a vulnerability or data exposure, open a private issue or email the maintainer. Avoid posting secrets in public tickets.

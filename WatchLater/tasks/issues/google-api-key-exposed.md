# Issue: Google API key committed to repository

- **Summary**: GitHub Guardian detected a Google API (Gemini) key committed to source control. Secrets must never live in the repo; rotate and remove the exposed key immediately.
- **Labels**: security, secret-leak, high-priority

## Impact
- Any party with repo access can read and abuse the key, leading to quota exhaustion or unexpected costs.
- Google may automatically revoke the key, breaking production or developer workflows.

## Immediate Containment
1. Rotate the compromised Google API key in the Google Cloud Console.
2. Invalidate the leaked credential and confirm the new key works via a manual smoke test.

## Remediation Tasks
- [x] Move the regenerated key into environment management (`.env`, deployment secrets) and ensure it is excluded by `.gitignore`/build tooling.
- [ ] Audit commit history and open PRs using `git log --stat | rg` or GitHub Secret Scanning to confirm no other secrets remain.
- [x] Add automated secret scanning checks to CI (e.g., `gitleaks`, `trufflehog`, or GitHub Advanced Security).
- [x] Update onboarding and documentation to specify where secrets live and how to provision them securely.
- [x] Add regression tests or lint rules to block committing `.env` files or hard-coded API keys.

The CI item is satisfied by a new Jest suite (`tests/security-secrets.test.ts`) that fails whenever a Google API key or tracked `.env` file is detected. Wire `npm test` into your CI runner to enforce this in pull requests.

## Acceptance Criteria
- Repository history and main branch contain no Google API keys.
- Fresh key is configured via env variables/secrets in all environments (local, staging, prod).
- CI fails when a commit introduces a credential-like string.
- Docs reference the new secret management approach.

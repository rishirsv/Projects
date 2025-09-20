# Contributing

Thanks for pitching in. This project is intentionally small and local-first.

## Dev setup
- Node 20+, npm 10+
- `npm ci`
- `cp .env.example .env` and add your keys (local use only)
- `npm run server` (port 3001) and `npm run dev` (port 5173)

## Branching & commits
- Branch from `main`: `feature/<topic>` or `chore/<topic>`
- Conventional commits preferred (`feat:`, `fix:`, `docs:`…). Keep messages crisp.

## PR checklist
- [ ] Code compiles (`npm run build`)
- [ ] Tests pass locally (`npm test`)
- [ ] No secrets in diffs; `.env` and `exports/` are ignored
- [ ] Updated docs when behavior changes
- [ ] Screenshots for UI changes

## Testing
- Unit tests live in `tests/` and use Jest + ts-jest.
- Add cases for URL parsing, filename sanitation, and API adapters.
- For server endpoints, add Supertest-based tests (see playbooks).

## Code style
- TypeScript strict mode is on; keep it that way.
- Run `npm run lint` before pushing.

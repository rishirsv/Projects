# Repository Guidelines

## Project Structure & Module Organization
Top-level folders group independent apps. `WatchLater/` hosts the Vite + React client (`src/`), Express API (`server/`), Jest specs in `tests/`, and product docs in `docs/`. `Substack2Markdown/` is a Go CLI with entrypoint `main.go`, reusable packages under `lib/`, and command wrappers in `cmd/`. `Personal Capital/` bundles Apps Script assets (`Code.js`, HTML dialogs) and Python utilities for data ingestion. `Prompts/` and `TS Copywriter/` store prompt libraries and reference assets; keep new materials within their respective directories.

## Build, Test, and Development Commands
Inside `WatchLater/`, install dependencies once (`npm install`), then `npm run start` to boot the API and Vite dev server, `npm run build` for production bundles in `dist/`, `npm run lint` for ESLint, and `npm test` for Jest. Launch only the backend with `node server.js`. In `Substack2Markdown/`, run `go build ./...` before commits, `go run main.go --help` to validate flags, and `go test ./...` for regressions. Execute `python3 process_net_worth.py` or sibling scripts from `Personal Capital/` after activating the correct virtualenv.

## Coding Style & Naming Conventions
Adhere to `WatchLater/eslint.config.js`: two-space indentation, PascalCase components, camelCase hooks/utilities, and kebab-case file names in `src/` and `public/`. Align TypeScript types with the nearest domain module and colocate feature assets under a single folder. Go code must stay `gofmt` clean with idiomatic, exported PascalCase names. Python scripts should remain PEP 8 compliant and read configuration from environment variables rather than literals.

## Testing Guidelines
Add UI and API specs to `WatchLater/tests/` using Jest + ts-jest; name files `feature-name.test.ts`, colocate fixtures under `tests/fixtures`, and run `npm test -- --runInBand` before opening a PR. Go changes require `go test ./...` with table-driven coverage for success and failure paths. When automation touches external data, document manual verification steps in `docs/` next to the affected project.

## Commit & Pull Request Guidelines
Prefer imperative commit titles following the existing short style (`fix:`, `chore:`) and wrap body text at ~72 characters. Each PR should explain scope, list validation commands, link relevant issues, and include screenshots or sample output for user-facing updates. Call out `.env` deltas explicitly and refresh `WatchLater/.env.example` whenever configuration keys change.

## Security & Configuration Tips
Keep secrets in local `.env` files only; never commit API keys or tokens. Audit Express and Puppeteer updates in `WatchLater/server/` for injection or SSRF risks, and scrub user input before rendering or exporting.

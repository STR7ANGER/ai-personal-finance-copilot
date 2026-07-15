# Integration, E2E, and release acceptance

## Scope

The release gate exercises the public API health contract, the product entry point, a deterministic dashboard success path, and its accessible failure state. Browser tests mock only the GraphQL response that supplies private financial data; API domain behavior remains covered by Vitest and live local verification.

Fixtures under `tests/fixtures` are synthetic, deterministic, and contain an explicit spreadsheet-formula payload. They must never be replaced by a real bank statement.

## Acceptance criteria

- `npm run check`, `npm run build`, `npm run test:e2e`, and `go test ./...` pass from a clean dependency install.
- Prisma migrations apply with `prisma migrate deploy` and report no pending migration afterward.
- The API and web production images build for the target platform and run as non-root users.
- Browser tests cover useful content, a reviewed-data dashboard, and a recoverable provider error.
- CI retains Playwright traces only for failures and uses no production credentials.
- Threats, rollback, incident response, privacy requests, backups, and secret rotation have documented owners and commands.

## Contract boundaries

Vitest owns deterministic domain and adapter-contract tests. Playwright owns browser/API composition and accessibility-visible states. Live-provider smoke tests are opt-in because Gemini, managed databases, object storage, and notifications incur external state or cost.

## Release sequence

1. Run all local gates and build both images.
2. Back up PostgreSQL and MongoDB, then run `npx prisma migrate deploy` once from a release job.
3. Deploy the API and verify `/health` and protected `/internal/metrics`.
4. Deploy the web build with its immutable `NEXT_PUBLIC_API_URL`.
5. Exercise login, a synthetic import, dashboard, forecast, Q&A, export, and privacy-request smoke paths.
6. Roll back the application image if error rate, latency, or data-integrity checks fail. Never roll back a destructive migration without its reviewed restore plan.

## Known release boundary

The repository is production-shaped, not production-approved financial software. Human review is still required for retention policy, privacy jurisdiction, accessibility conformance, penetration testing, and financial-advice wording.

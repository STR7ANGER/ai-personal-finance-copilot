# Architecture and acceptance criteria

## Smallest vertical slice

A developer can install dependencies, validate environment variables, start the Next.js frontend and Hono API independently, call `GET /health`, and start PostgreSQL, MongoDB, Redis, and MinIO with Docker Compose.

## Boundaries

- `apps/web` owns presentation and browser state only.
- `apps/api` owns HTTP authentication, validation, orchestration, and errors.
- `services/normalizer` will own deterministic CSV normalization.
- `packages/contracts` owns versioned schemas shared across processes.
- PostgreSQL is transactional truth; MongoDB stores raw/irregular document structures; MinIO stores uploaded bytes; Redis coordinates jobs.

## Acceptance criteria

- Invalid or missing secrets stop the API before it listens.
- Health endpoints contain no configuration or secret values.
- Every service has a Docker health check and persistent local volume where appropriate.
- CI installs from the lockfile, generates Prisma, type-checks, tests, builds, and tests Go independently.
- A clean checkout requires no globally installed JavaScript package.

## Risks and controls

| Risk | Initial control |
| --- | --- |
| Financial-data leakage | Redacted structured logs, encrypted profile fields, least privilege |
| Duplicate imports | File checksums plus transaction fingerprints and database constraints |
| Partial background work | Durable states, idempotent jobs, retry ceilings, dead-letter state |
| Frontend/backend coupling | Shared schemas only; independently runnable workspaces |
| Provider lock-in | Storage, AI, and notification adapters behind application ports |

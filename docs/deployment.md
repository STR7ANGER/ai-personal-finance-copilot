# Deployment guide

## Recommended topology

- Deploy `apps/web` to Vercel as a Next.js project. Set its Root Directory to the repository root so workspace dependencies resolve; use `npm run build --workspace @finance-copilot/web` and `apps/web/.next` as the build/output locations if automatic monorepo detection does not supply them.
- Deploy `Dockerfile.api` to a container platform with TLS termination, private networking, autoscaling, and a single one-off migration job.
- Deploy `services/normalizer/Dockerfile` as a worker with no public ingress.
- Use Neon PostgreSQL for transactional truth, MongoDB Atlas for raw/irregular metadata, managed Redis for queues/rate limits, and S3-compatible private object storage for statement bytes.

`NEXT_PUBLIC_API_URL` is embedded during the web build. API secrets are runtime-only and must never be configured as `NEXT_PUBLIC_*` values.

## Required configuration

Web: `NEXT_PUBLIC_API_URL`.

API: `NODE_ENV=production`, `WEB_URL`, `API_URL`, `PORT`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, all `S3_*` values, `SESSION_SECRET`, `PROFILE_ENCRYPTION_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `OPERATOR_METRICS_TOKEN`.

Use independent random values of at least 32 bytes for session/operator secrets and a base64-encoded 32-byte profile key. Store them in the platform secret manager, restrict read access to the service identity, and rotate them with an overlap plan. Profile-key rotation requires re-encryption; replacing it directly makes existing profiles unreadable.

## Database and network controls

Use pooled Neon connections for API traffic and a direct connection for migrations. Require TLS, restrict database roles by service, enable point-in-time recovery, and test restores. Keep MongoDB, Redis, and object storage off the public network where the provider permits. Object buckets must deny public access and use encryption, versioning, lifecycle retention, and narrowly scoped credentials.

## Build and release commands

```sh
docker build -f Dockerfile.api -t finance-copilot-api:release .
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -f Dockerfile.web -t finance-copilot-web:release .
DATABASE_URL="$DIRECT_DATABASE_URL" npx prisma migrate deploy
npm run test:e2e
```

Verify `GET /health` publicly and `GET /internal/metrics` only through an authenticated operator/monitoring path. Configure alerts for 5xx rate, p95 latency, authentication failures, queue age, dead-letter jobs, provider errors, database saturation, and storage failures.

## Backups and rollback

Take a recovery point before migrations. Retain PostgreSQL PITR, daily MongoDB snapshots, and versioned statement objects according to the reviewed privacy policy. Restore into an isolated environment monthly and compare row counts/checksums.

Application rollback means redeploying the prior immutable image and web build. Prefer expand/migrate/contract schema changes so both adjacent versions work. If a migration is destructive, stop the release and restore from the pre-release recovery point under incident procedure; do not improvise a down migration in production.

# Alerts, exports, privacy, observability, and rate limits

## Acceptance criteria

- Users create currency-scoped budget, low-balance, or subscription-due alert rules and list their own recent alert events.
- Transaction CSV exports include reviewed canonical transactions only, cap at 10,000 rows, quote fields correctly, neutralize spreadsheet formulas, and emit an audit event.
- Privacy `EXPORT` and `DELETE` requests require exact confirmation text, store only its SHA-256 hash, remain asynchronous, and create an immutable audit event. Deletion is never immediate from an API request.
- Every HTTP request receives/carries a request ID, emits a structured completion log with route/status/duration, and increments in-process counters without logging cookies, tokens, queries, files, or bodies.
- `/health` is public and minimal. `/internal/metrics` requires an operator token and exposes aggregate counters only.
- Redis-backed fixed-window rate limits cover auth (20/minute), CSV imports (10/minute), privacy/export commands (10/minute), and GraphQL (120/minute). Responses return `429`, `Retry-After`, and stable code `RATE_LIMITED`.
- Rate-limit identity hashes the session token or trusted client IP; raw identifiers are never used as Redis keys or logs.

## Export and deletion boundaries

Exports are generated server-side from owned records and never accept arbitrary SQL fields. Object-storage exports later use short-lived signed URLs and retention cleanup. Delete requests enter a reviewed workflow that revokes sessions, creates a final portable export if requested, removes provider objects, erases transactional/document data, retains only legally required anonymous audit evidence, and records completion without personal content.

## Alert delivery boundary

This slice stores rules/events and exposes them in-app. Email/SMS/push delivery belongs behind the notification-service adapter and requires user channel preferences, quiet hours, retry/dead-letter behavior, and provider webhook reconciliation.

## Operational targets

- Alert evaluation and export commands are idempotent.
- Metrics have bounded cardinality: method, normalized route, and status class only.
- No financial values, prompts, descriptions, emails, or IDs appear in logs/metric labels.
- Operator tokens and Redis credentials are environment secrets and must differ across environments.

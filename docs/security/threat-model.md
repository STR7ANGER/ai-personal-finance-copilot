# Threat model

## Assets and trust boundaries

Protected assets are credentials, sessions, encrypted profile fields, statements, normalized transactions, budgets, forecasts, grounded answers, exports, audit records, and provider secrets. Trust boundaries exist at the browser/API edge, API/data stores, Redis worker queue, object storage, Gemini, and operator metrics endpoint.

## Threat review

| Threat | Example | Current control | Residual action before production |
| --- | --- | --- | --- |
| Spoofing | Stolen session replays private queries | HttpOnly SameSite cookie, hashed server-side token, expiry/revocation, generic login failures | Add MFA, session inventory, secure-cookie integration test, and breached-password screening |
| Tampering | Edited import or duplicated transaction changes totals | SHA-256 file checksum, transaction fingerprint, uniqueness constraints, reviewed-only facts, audit events | Sign queue messages and periodically reconcile object checksum to database |
| Repudiation | User/operator denies export or deletion request | Append-only audit events with actor, target, request ID, and timestamps | Centralize immutable audit retention and alert on gaps |
| Information disclosure | Logs, metrics, CSV, or AI prompt leaks financial data | Bounded metric labels, structured event allowlists, safe CSV cells, authenticated exports, grounded fact packs | Deploy DLP/log sampling tests; encrypt statement objects with customer-managed keys |
| Denial of service | Login, import, GraphQL, or export floods | Redis fixed-window limits, import size/row ceilings, bounded queries and exports | Add edge limits, queue backpressure, per-user quotas, and circuit breakers |
| Elevation of privilege | User supplies another user's record ID | Repository queries are scoped by authenticated `userId`; operator metrics use a separate token | Add systematic authorization matrix tests and short-lived operator identity |
| Prompt injection | Transaction description instructs Gemini to reveal data | Structured facts, citation allowlist, output validation, no tools or arbitrary retrieval | Add adversarial prompt corpus and provider-side content controls |
| Supply chain | Compromised npm, image, or action dependency | Lockfile, CI builds, minimal non-root runtime stages | Pin Actions and container images by digest; add SBOM, provenance, and dependency scanning |

## Abuse cases

- CSV formula injection is neutralized by prefixing cells beginning with `=`, `+`, `-`, or `@` before quoting.
- Cross-user access must fail even when a valid resource identifier is guessed.
- Privacy deletion requires exact confirmation, queues an asynchronous request, and must not silently delete financial truth during the HTTP request.
- Gemini output is untrusted input: only schema-valid answers whose citations belong to the supplied fact pack can persist.
- Raw cookie values, email addresses, prompts, transaction descriptions, and statement contents must never be metric labels or routine logs.

## Security verification cadence

Run authorization, injection, rate-limit, and redaction tests on every change. Run dependency/container scanning weekly, restore drills quarterly, an external penetration test before public launch and annually, and re-review this model when adding a provider, notification channel, shared household, or money-movement capability.

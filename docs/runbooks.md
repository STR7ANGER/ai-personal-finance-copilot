# Operations runbooks

## Elevated API errors

Confirm scope with bounded metrics and request IDs, check the most recent deployment and provider health, then disable the affected integration or roll back the image. Never paste statements, cookies, prompts, or database URLs into an incident channel. Preserve audit and request-ID evidence, notify the privacy/security owner if disclosure is possible, and publish a post-incident review.

## Import backlog or failure

Check Redis connectivity, queue age, worker health, dead-letter state, object availability, and checksum agreement. Scale workers only after confirming the downstream databases have capacity. Requeue only idempotent jobs; never create a second import record to make a failure disappear.

## Gemini degradation

Categorization and Q&A should return an explicit unavailable state while deterministic finance workflows remain usable. Check provider status, quota, schema-validation failures, and latency. Rotate the key only if compromise is suspected; do not log prompts to debug production data.

## Privacy export/deletion

Verify the authenticated request, exact confirmation hash, audit event, jurisdiction, retention exceptions, and request status. Build exports in a restricted worker, encrypt at rest, deliver through an expiring authenticated link, and audit retrieval/expiry. Deletion must enumerate PostgreSQL, MongoDB, object storage, caches, derived AI records, and backups according to policy, then record completion without retaining deleted content.

## Secret compromise

Revoke the provider credential, issue a least-privilege replacement, deploy it through the secret manager, verify service health, and investigate audit/provider logs. Session-secret rotation invalidates sessions. Profile-encryption-key rotation requires a tested dual-key re-encryption migration.

## Database recovery

Freeze writes, capture incident timestamps, restore the latest clean PostgreSQL/MongoDB recovery points into isolation, validate migration state and ledger invariants, then switch traffic through a reviewed change. Reconcile statement-object checksums and queued jobs before reopening imports.

# CSV ingestion design

## Smallest vertical slice

An authenticated user uploads a CSV of at most 10 MiB. The API validates its extension and content type, calculates SHA-256, rejects a repeated file for that user, stores immutable bytes under a user-scoped MinIO key, records a queued import in PostgreSQL, and publishes only identifiers to Redis. The Go worker streams the object, validates required columns, normalizes dates/currency/minor units, stores raw normalized rows in MongoDB, and makes the import terminal in PostgreSQL.

## Contract

`POST /v1/imports/csv` accepts multipart form data with a `file` part and returns `202` with a safe import record. Queue jobs contain `importId`, `userId`, and `objectKey`; raw financial bytes never pass through Redis. Required columns are `date`, `description`, and `amount`; `currency` defaults to USD for this first adapter.

## Failure and recovery

- Validation fails before storage. Duplicate checks are backed by a database unique constraint.
- Storage succeeds before database/queue operations. A dispatch failure triggers best-effort object cleanup and a failed state.
- Workers move QUEUED → PROCESSING → COMPLETED/FAILED and persist row count or a bounded failure reason.
- Object keys are generated server-side and tenant-scoped. Original filenames are metadata, never filesystem paths.
- Production follow-up: malware scanning, resumable imports, bank-specific mappings, dead-letter queue, cleanup reconciliation, and managed storage encryption.

## Verification

Unit tests cover validation, deduplication, storage/dispatch, required columns, money normalization, and date parsing. Integration verification uploads a fixture through the authenticated API and runs one worker job against Dockerized PostgreSQL, Redis, MongoDB, and MinIO.

# Transaction ledger, deduplication, categorization, and review UI

## Decision

PostgreSQL owns the canonical transaction ledger. MongoDB retains immutable normalized import rows as evidence, but dashboards, budgets, forecasts, and AI answers may use only canonical PostgreSQL transactions. Promotion from raw row to transaction is idempotent and traceable to an import and row number.

## Data model

### Account

- `id`, `userId`, encrypted institution/account label, account type, currency, timezone, optional provider reference, status, timestamps.
- Every query is scoped by both `userId` and `accountId`; provider references are unique only inside a user/account boundary.

### Transaction

- Identity: `id`, `userId`, `accountId`, `importId`, `sourceRowNumber`, optional `sourceTransactionId`.
- Money: `amountMinor` as signed 64-bit integer, ISO-4217 `currency`, and original amount/currency when conversion is later introduced.
- Description: original description, normalized merchant/description, optional encrypted note.
- Timing: posted date, optional authorized timestamp, account timezone, created/updated timestamps.
- Classification: `categoryId`, `categorySource`, confidence, review status, reviewed timestamp/user.
- Provenance: canonical fingerprint, raw-document reference, parser version, categorizer version, and immutable creation audit event.

### Category and CategoryRule

- Categories are either system defaults or user-owned, support a parent category, color/icon token, and active state.
- Rules are user-owned, ordered, enabled, and versioned. Initial predicates support exact/contains merchant text, amount range, debit/credit direction, account, and currency.
- Every categorization decision records the winning rule/model version and a compact explanation.

## Deduplication policy

1. If a trusted source transaction ID exists, enforce unique `(accountId, sourceTransactionId)`.
2. Always enforce unique `(importId, sourceRowNumber)` so worker retries cannot insert twice.
3. Build a canonical SHA-256 fingerprint from account, posted date, signed minor amount, currency, and normalized description.
4. A matching fingerprint from a different import becomes `POSSIBLE_DUPLICATE`; it is not automatically deleted because two legitimate purchases can share those fields.
5. Auto-link only when the source ID matches or every stable bank-specific field matches. Otherwise expose both items in review with “keep both” and “merge duplicate” actions.
6. A merge preserves both provenance records, records the chosen canonical transaction, and is reversible through an audited command.

Description normalization lowercases Unicode text, trims/collapses whitespace, removes known bank reference suffixes through versioned adapters, and never mutates the original description. Changing normalization creates a new fingerprint version instead of rewriting history silently.

## Categorization precedence

1. Explicit user category/override.
2. User rule, highest priority then most specific.
3. Previously confirmed merchant mapping.
4. Deterministic platform rule.
5. Gemini suggestion above the configured confidence threshold.
6. `Uncategorized`.

AI suggestions never overwrite user-confirmed categories. Store suggestion label, confidence, model/prompt version, grounded input fields, and safe explanation separately from the accepted category. User corrections create feedback examples without storing unrelated financial context.

## API contract

Use GraphQL for composed review reads and mutations, authenticated by the existing session cookie:

- `transactions(filter, cursor, sort)` returns a cursor-paginated connection with category, provenance summary, duplicate flags, and review state.
- `transactionReviewQueue(filter, cursor)` prioritizes uncategorized, low-confidence, possible-duplicate, and parser-warning records.
- `setTransactionCategory(transactionId, categoryId, expectedVersion)` applies optimistic concurrency and writes an audit event.
- `bulkSetTransactionCategory(transactionIds, categoryId, expectedVersions)` is atomic per requested batch and returns item-level conflicts.
- `resolveDuplicate(candidateId, resolution, expectedVersion)` accepts `KEEP_BOTH`, `MERGE`, or `NOT_DUPLICATE` and records a reversible decision.
- `createCategoryRule(input)` previews affected transactions before activation.

REST remains responsible for CSV upload and worker callbacks. Mutations require idempotency keys, ownership checks, bounded batch sizes, and stable error codes.

## Review UI

### Route and layout

`/transactions/review` uses a desktop table and responsive card list. A persistent summary shows remaining review count, selected count, import status, and completion progress. Filters cover date, account, category, amount, review reason, and import.

### Row behavior

- Show date, merchant/original description, signed amount, current category, confidence/source, and warning badges.
- Expanding a row shows raw provenance, category explanation, possible duplicates, and audit history without exposing object-storage URLs.
- Category selection supports keyboard search. `J/K` moves, `C` categorizes, `D` opens duplicate resolution, and undo is available after safe commands.
- Bulk actions require confirmation when they affect mixed currencies, duplicate candidates, or more than 100 transactions.

### States and accessibility

- Design explicit loading skeleton, empty, no-results, partial-import, stale-version conflict, offline, and recoverable-error states.
- Use semantic table/list markup, visible focus, announced mutation results, non-color-only confidence indicators, and touch targets of at least 44px.
- Optimistic updates are allowed for category changes only; duplicate merges wait for the server because they affect provenance.

## Acceptance criteria

- Import retries cannot create duplicate canonical rows.
- Legitimate fingerprint collisions are reviewable and never silently dropped.
- User-confirmed categories win permanently unless the user explicitly changes them.
- Every category/duplicate mutation checks ownership, version, and idempotency and emits an audit event.
- The review queue is cursor-paginated, filterable, keyboard-accessible, and usable on mobile.
- A transaction can always be traced to its raw row, import, parser version, and classification decision.
- Unit tests cover canonicalization and precedence; integration tests cover uniqueness, concurrency, tenant isolation, bulk rollback, and reversible duplicate decisions.

## Smallest implementation slice for Tasks 11–12

Add Prisma models and migrations for Account, Transaction, Category, CategoryRule, duplicate candidates, and classification decisions. Promote normalized rows idempotently, implement deterministic rule precedence, expose the review GraphQL query/mutations, and build the review page with seeded fixtures. Verify database constraints, tenant isolation, collision handling, keyboard flow, and optimistic conflict recovery.

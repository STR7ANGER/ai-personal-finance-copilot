# ADR 0002: Canonical transactions live in PostgreSQL

Status: Accepted

Normalized import rows remain immutable evidence in MongoDB. Reviewed and system-consumable transactions live in PostgreSQL with relational ownership, uniqueness, optimistic-version, and audit constraints. Fingerprint collisions create review candidates rather than destructive deduplication.

This provides strong consistency for budgets and forecasts while retaining the flexible raw payload needed to improve import adapters. Promotion is idempotent on import row identity, and every canonical transaction keeps provenance back to the raw document.

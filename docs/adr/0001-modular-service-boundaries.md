# ADR 0001: Modular service boundaries

Status: Accepted

Use a Next.js web application and Hono API as separate deployables. Keep transactional modules in the API until independent scaling is justified. Run CSV normalization as a Go worker because it is deterministic, streaming-friendly, and isolated from HTTP latency. Use versioned schemas and queued messages at boundaries.

This avoids premature microservices while preserving an extraction path for ingestion, AI analysis, and notifications.

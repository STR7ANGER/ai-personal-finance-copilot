# AI Personal Finance Copilot — 30-Task Execution Plan

Complete tasks in order unless a dependency is explicitly removed. Each day has 10 active tasks; unfinished work rolls forward before later tasks begin. Keep at most 10 task checkboxes marked `[~]` (in progress) at once; use `[x]` only after verification.

## Day 1 — Foundation and first vertical slice (Tasks 1–10)

- [x] 1. Design workspace, Docker services, environment validation, and CI; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [x] 2. Implement workspace, Docker services, environment validation, and CI; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [x] 3. Verify workspace, Docker services, environment validation, and CI with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [x] 4. Design authentication, encrypted profiles, and audit logging; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [x] 5. Implement authentication, encrypted profiles, and audit logging; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [x] 6. Verify authentication, encrypted profiles, and audit logging with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [x] 7. Design CSV upload, raw-document storage, and Go normalization worker; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [x] 8. Implement CSV upload, raw-document storage, and Go normalization worker; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [x] 9. Verify CSV upload, raw-document storage, and Go normalization worker with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [x] 10. Design transaction schema, deduplication, categorization rules, and review UI; write acceptance criteria, contracts, risks, and the smallest vertical slice.

## Day 2 — Core workflows and integrations (Tasks 11–20)

- [x] 11. Implement transaction schema, deduplication, categorization rules, and review UI; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [x] 12. Verify transaction schema, deduplication, categorization rules, and review UI with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [x] 13. Design Gemini category suggestions with confidence, grounding, and feedback; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [x] 14. Implement Gemini category suggestions with confidence, grounding, and feedback; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [x] 15. Verify Gemini category suggestions with confidence, grounding, and feedback with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 16. Design budget, goal, and subscription modules with dashboard screens; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 17. Implement budget, goal, and subscription modules with dashboard screens; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 18. Verify budget, goal, and subscription modules with dashboard screens with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 19. Design forecasting pipeline, scenario assumptions, and charts; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 20. Implement forecasting pipeline, scenario assumptions, and charts; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.

## Day 3 — Advanced behavior and production hardening (Tasks 21–30)

- [ ] 21. Verify forecasting pipeline, scenario assumptions, and charts with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 22. Design grounded finance Q&A with GraphQL dashboard queries; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 23. Implement grounded finance Q&A with GraphQL dashboard queries; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 24. Verify grounded finance Q&A with GraphQL dashboard queries with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 25. Design alerts, exports, privacy controls, observability, and rate limits; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 26. Implement alerts, exports, privacy controls, observability, and rate limits; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 27. Verify alerts, exports, privacy controls, observability, and rate limits with tests, failure cases, telemetry, documentation, and a reviewable demo.
- [ ] 28. Design integration/E2E tests, threat review, fixtures, and deployment docs; write acceptance criteria, contracts, risks, and the smallest vertical slice.
- [ ] 29. Implement integration/E2E tests, threat review, fixtures, and deployment docs; keep frontend, API, domain logic, workers, and persistence in their declared boundaries.
- [ ] 30. Verify integration/E2E tests, threat review, fixtures, and deployment docs with tests, failure cases, telemetry, documentation, and a reviewable demo.

## Task completion checklist

A task is complete only when code is formatted and typed, tests pass, migrations are reproducible, UI states are handled, authorization is enforced, logs contain no secrets, and relevant docs are updated. Track blockers beneath the task instead of silently widening scope.

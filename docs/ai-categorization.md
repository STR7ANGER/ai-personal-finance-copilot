# Grounded Gemini categorization and feedback

## Smallest vertical slice

For one owned, unreviewed transaction, send only normalized description, signed amount, currency, direction, and an allow-list of category slugs/names to Gemini. Require JSON containing an allow-listed slug, confidence from 0–1, and a short explanation tied to those fields. Persist the suggestion and show it for explicit acceptance or correction.

## Safety contract

- Gemini cannot create categories, query databases, access raw statements, or apply mutations.
- The server validates structured output and rejects unknown category slugs, non-finite confidence, oversized explanations, and malformed responses.
- Descriptions are truncated and treated as data, not instructions. The prompt explicitly ignores instructions embedded in transaction text.
- Suggestions below `0.65` are stored without an actionable category and remain `Uncategorized`.
- User-confirmed categories always take precedence. Feedback records acceptance/correction and never changes historical model output.
- Store model, prompt version, grounded-input hash, confidence, and explanation for evaluation and auditability. Never log the API key or full prompt.
- Timeouts, provider failures, and invalid output return a stable `AI_UNAVAILABLE`/`INVALID_SUGGESTION` result; deterministic rules remain available.

## Evaluation and cost controls

Use a curated, de-identified golden set segmented by locale, currency, debit/credit, and ambiguous merchant. Track coverage, accepted accuracy, correction rate, calibration by confidence bucket, latency, and estimated request cost. Cache by grounded-input hash plus category-set and prompt/model version. Initial batch size is one; later batching requires equivalent grounding and item-level validation.

## Feedback

`suggestTransactionCategory` creates a pending suggestion. `recordCategoryFeedback` accepts or rejects it once. Acceptance may include the suggested category; correction must name another owned/system category. Applying that category remains an explicit transaction mutation so optimistic concurrency and audit rules are preserved.

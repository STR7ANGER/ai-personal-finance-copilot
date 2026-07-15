# Grounded finance Q&A with citations

## Smallest vertical slice

For a chosen month and currency, the server constructs an allow-listed fact pack from reviewed canonical transactions, the active monthly budget, category totals, and confirmed upcoming subscriptions. Gemini receives the user question plus those facts and must return structured JSON containing an answer and cited fact IDs. The server validates every citation before persisting or returning the answer.

## Grounding and privacy contract

- Queries require an authenticated user and every fact query is tenant-scoped.
- Only `REVIEWED` canonical transactions contribute. Raw statements, notes, profile data, tokens, and object URLs never enter the prompt.
- Questions are treated as untrusted data and truncated to 500 characters. The model has no tools, database access, URL access, or mutation capability.
- Fact IDs are random/request-scoped identifiers with human-readable labels and integer minor-unit values. Unknown or duplicate citations reject the entire response.
- Answers must cite at least one supplied fact, stay under 1,200 characters, state the period/currency, and avoid personalized investment, tax, legal, or credit advice.
- Store question, validated answer, model/prompt version, facts hash, and citation snapshots. Do not store the full provider prompt.
- Provider timeout/failure returns `AI_UNAVAILABLE`; malformed/ungrounded output returns `UNGROUNDED_ANSWER`. No speculative fallback is presented as AI output.

## GraphQL contract

- `financeFacts(month, currency)` returns the exact non-sensitive facts available for Q&A and dashboard composition.
- `askFinance(question, month, currency)` returns a persisted answer with citation labels, source types, values, and IDs.
- `financeAnswer(id)` returns only an answer owned by the current user.

## Evaluation

Golden questions cover spend totals, category comparisons, budget variance, recurring charges, empty months, credits, possible duplicates, and adversarial prompt text. Measure citation validity, numerical agreement, unsupported-claim rate, refusal correctness, latency, and cost. A release fails if any answer cites a nonexistent fact or disagrees with cited integer values.

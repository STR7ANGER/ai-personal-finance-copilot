# Budgets, goals, subscriptions, and dashboard

## Scope and acceptance criteria

- A user creates one monthly budget per currency, with an overall limit and optional category allocations that cannot exceed the total.
- Spending uses reviewed canonical debit transactions in the budget month. Credits, possible duplicates, and unreviewed imports do not reduce available budget.
- A user creates savings goals with target/current minor units, optional target date, explicit status, and optimistic versioning. Current value cannot be negative or exceed the target without completing the goal.
- Subscriptions store merchant, amount, currency, cadence, next charge date, source, and active state. The unique business key makes repeated detection idempotent.
- The dashboard composes budget usage, category variance, active-goal progress, and upcoming 45-day subscription charges in one authenticated GraphQL query.
- All money remains integer minor units with explicit currency. The first version never sums different currencies.
- Mutations enforce ownership, stable validation errors, optimistic concurrency for updates, and audit events for material changes.

## UI states

The dashboard has currency-scoped summary cards, budget progress, goal progress, and upcoming subscriptions. It defines loading, empty, partial-data, stale, and error states; percentages include text and never rely only on color. Forms use minor-unit-safe server conversion and show date/currency context.

## Risks and controls

- Month boundaries use UTC dates initially and display the account/user timezone; local-time budget boundaries are a follow-up.
- Subscription detection is advisory until confirmed. User-created records are authoritative and never overwritten by a detector.
- Category changes can alter historical budget totals; the dashboard exposes `calculatedAt` and is recalculated from canonical transactions.
- Decimal parsing happens at the API boundary with strict currency precision; domain/storage layers receive minor-unit strings only.

## Smallest vertical slice

Create a monthly budget, one goal, and one subscription through GraphQL; return all three plus calculated spending/progress in `financialDashboard`; render them in the Next.js dashboard with responsive progress indicators and empty states.

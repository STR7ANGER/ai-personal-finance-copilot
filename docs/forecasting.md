# Cash-flow forecasting and scenarios

## Purpose

Produce an explainable daily balance projection from reviewed transaction history, confirmed subscriptions, a user-supplied starting balance, and explicit scenario adjustments. It is a planning aid—not financial advice—and never initiates transfers or changes budgets.

## Inputs and assumptions

- Currency-scoped starting balance in integer minor units.
- Horizon of 7–180 days; initial UI defaults to 60.
- Ninety days of reviewed canonical transactions. Possible duplicates, pending reviews, and other currencies are excluded.
- Confirmed active subscriptions are scheduled on their next charge date and repeated by cadence.
- Income and expense adjustment basis points range from -5000 to +5000 and are shown beside results.
- Optional one-off scenario events contain date, signed minor amount, and a user label.

The baseline uses average historical daily reviewed income and expense. Subscription charges replace no historical value; they are explicit future events. This simple model is intentionally transparent and becomes a comparison baseline for later seasonal/statistical models.

## Output

Each UTC day returns expected, lower, and upper balance; expected inflow/outflow; scheduled subscription amount; scenario amount; and concise drivers. The uncertainty band expands with horizon using a documented deterministic volatility proxy. `generatedAt`, history window, model version, currency, and assumptions are returned with every forecast.

## Failure and safety behavior

- Reject invalid currencies, non-integer money, out-of-range horizons/adjustments, duplicate scenario dates/labels, and events outside the horizon.
- Never mix currencies or treat unreviewed transactions as truth.
- Sparse history is disclosed through `historyDays`; zero history produces a flat baseline plus explicit subscriptions/scenarios.
- BigInt arithmetic preserves minor units. No floating-point money enters storage or the API.
- Forecast responses are calculated on demand and contain no Gemini-generated numbers.

## Smallest vertical slice

Expose `cashFlowForecast` through authenticated GraphQL and render a responsive expected-balance line with an uncertainty band and assumptions. Task 21 will add golden fixtures, boundary/failure tests, historical backtesting, chart accessibility review, and live-data verification.

## Verification record

Task 21 adds deterministic tests for reviewed daily averages, recurring charges, scenario events, uncertainty arithmetic, sparse history, money/horizon/date boundaries, and telemetry redaction. The production chart includes an equivalent data table for non-visual inspection. The live demo query returns the requested number of daily points and exposes model/history metadata. Before production decision-making, backtest rolling 30/60/90-day windows against at least six months of user-confirmed data and publish median absolute error by balance range and history-density cohort.

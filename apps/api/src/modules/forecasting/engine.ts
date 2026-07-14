import type { Forecast, ForecastPoint, ForecastSubscription, HistoricalCashFlow, ScenarioEvent } from "./ports.js";

const dayMs = 86_400_000;
const startOfDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
const key = (value: Date) => startOfDay(value).toISOString().slice(0, 10);
const abs = (value: bigint) => value < 0n ? -value : value;

function nextDate(value: Date, cadence: ForecastSubscription["cadence"]) {
  const next = new Date(value); if (cadence === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7); else if (cadence === "MONTHLY") next.setUTCMonth(next.getUTCMonth() + 1); else if (cadence === "QUARTERLY") next.setUTCMonth(next.getUTCMonth() + 3); else next.setUTCFullYear(next.getUTCFullYear() + 1); return next;
}

export function forecast(input: { now: Date; startingBalanceMinor: bigint; horizonDays: number; currency: string; history: HistoricalCashFlow[]; subscriptions: ForecastSubscription[]; events: ScenarioEvent[]; incomeAdjustmentBps: number; expenseAdjustmentBps: number }): Forecast {
  const income = input.history.reduce((sum, item) => item.amountMinor > 0n ? sum + item.amountMinor : sum, 0n);
  const expense = input.history.reduce((sum, item) => item.amountMinor < 0n ? sum + abs(item.amountMinor) : sum, 0n);
  const observed = input.history.map((item) => startOfDay(item.date).valueOf());
  const historyDays = observed.length ? Math.max(1, Math.ceil((startOfDay(input.now).valueOf() - Math.min(...observed)) / dayMs)) : 0;
  const denominator = BigInt(Math.max(historyDays, 1));
  const dailyIncome = income / denominator * BigInt(10_000 + input.incomeAdjustmentBps) / 10_000n;
  const dailyExpense = expense / denominator * BigInt(10_000 + input.expenseAdjustmentBps) / 10_000n;
  const volatility = (dailyIncome + dailyExpense) / 5n + 100n;
  const subscriptionSchedule = new Map<string, { amount: bigint; merchants: string[] }>();
  const end = new Date(startOfDay(input.now).valueOf() + input.horizonDays * dayMs);
  for (const subscription of input.subscriptions) { for (let charge = startOfDay(subscription.nextChargeDate); charge <= end; charge = nextDate(charge, subscription.cadence)) { const date = key(charge); const current = subscriptionSchedule.get(date) ?? { amount: 0n, merchants: [] }; current.amount += subscription.amountMinor; current.merchants.push(subscription.merchant); subscriptionSchedule.set(date, current); } }
  const events = new Map(input.events.map((event) => [key(event.date), event]));
  const points: ForecastPoint[] = []; let balance = input.startingBalanceMinor;
  for (let index = 1; index <= input.horizonDays; index++) { const date = new Date(startOfDay(input.now).valueOf() + index * dayMs); const subscriptions = subscriptionSchedule.get(key(date)); const event = events.get(key(date)); const subscriptionMinor = subscriptions?.amount ?? 0n; const scenarioMinor = event?.amountMinor ?? 0n; balance += dailyIncome - dailyExpense - subscriptionMinor + scenarioMinor; const uncertainty = volatility * BigInt(Math.ceil(Math.sqrt(index))); const drivers = [...(subscriptions ? [`Subscriptions: ${subscriptions.merchants.join(", ")}`] : []), ...(event ? [`Scenario: ${event.label}`] : [])]; points.push({ date, expectedBalanceMinor: balance, lowerBalanceMinor: balance - uncertainty, upperBalanceMinor: balance + uncertainty, expectedInflowMinor: dailyIncome, expectedOutflowMinor: dailyExpense, subscriptionMinor, scenarioMinor, drivers }); }
  return { currency: input.currency, modelVersion: "transparent-average-v1", generatedAt: new Date(), historyDays, incomeAdjustmentBps: input.incomeAdjustmentBps, expenseAdjustmentBps: input.expenseAdjustmentBps, points };
}

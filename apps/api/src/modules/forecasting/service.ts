import { forecast } from "./engine.js";
import type { ForecastRepository } from "./ports.js";

export class ForecastError extends Error { constructor(readonly code: "INVALID_FORECAST_INPUT") { super(code); } }
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

export class ForecastService {
  constructor(private readonly repository: ForecastRepository, private readonly clock = () => new Date()) {}
  async generate(userId: string, input: { startingBalanceMinor: string; horizonDays: number; currency: string; incomeAdjustmentBps?: number; expenseAdjustmentBps?: number; events?: Array<{ date: string; amountMinor: string; label: string }> }) {
    const currency = input.currency.toUpperCase(); const incomeAdjustmentBps = input.incomeAdjustmentBps ?? 0; const expenseAdjustmentBps = input.expenseAdjustmentBps ?? 0;
    if (!/^-?\d+$/.test(input.startingBalanceMinor) || !/^[A-Z]{3}$/.test(currency) || !Number.isInteger(input.horizonDays) || input.horizonDays < 7 || input.horizonDays > 180 || Math.abs(incomeAdjustmentBps) > 5000 || Math.abs(expenseAdjustmentBps) > 5000) throw new ForecastError("INVALID_FORECAST_INPUT");
    const now = this.clock(); const end = new Date(now.getTime() + input.horizonDays * 86_400_000);
    const events = (input.events ?? []).map((event) => ({ date: date(event.date), amountMinor: BigInt(event.amountMinor), label: event.label.trim() }));
    if (events.some((event) => Number.isNaN(event.date.valueOf()) || event.date <= now || event.date > end || !event.label || event.label.length > 80)) throw new ForecastError("INVALID_FORECAST_INPUT");
    const source = await this.repository.inputs(userId, currency, new Date(now.getTime() - 90 * 86_400_000));
    return forecast({ now, startingBalanceMinor: BigInt(input.startingBalanceMinor), horizonDays: input.horizonDays, currency, history: source.history, subscriptions: source.subscriptions, events, incomeAdjustmentBps, expenseAdjustmentBps });
  }
}

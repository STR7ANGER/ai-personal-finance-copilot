export type HistoricalCashFlow = { date: Date; amountMinor: bigint };
export type ForecastSubscription = { merchant: string; amountMinor: bigint; nextChargeDate: Date; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" };
export interface ForecastRepository { inputs(userId: string, currency: string, since: Date): Promise<{ history: HistoricalCashFlow[]; subscriptions: ForecastSubscription[] }>; }

export type ScenarioEvent = { date: Date; amountMinor: bigint; label: string };
export type ForecastPoint = { date: Date; expectedBalanceMinor: bigint; lowerBalanceMinor: bigint; upperBalanceMinor: bigint; expectedInflowMinor: bigint; expectedOutflowMinor: bigint; subscriptionMinor: bigint; scenarioMinor: bigint; drivers: string[] };
export type Forecast = { currency: string; modelVersion: string; generatedAt: Date; historyDays: number; incomeAdjustmentBps: number; expenseAdjustmentBps: number; points: ForecastPoint[] };

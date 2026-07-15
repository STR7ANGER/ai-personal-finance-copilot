import { describe, expect, it } from "vitest";
import { forecast } from "../src/modules/forecasting/engine.js";
import type { ForecastRepository } from "../src/modules/forecasting/ports.js";
import { ForecastService, type ForecastTelemetry } from "../src/modules/forecasting/service.js";

const now = new Date("2026-07-15T12:00:00.000Z");

describe("cash-flow forecasting", () => {
  it("applies reviewed averages, subscriptions, scenarios, and deterministic uncertainty", () => {
    const result = forecast({ now, startingBalanceMinor: 100000n, horizonDays: 7, currency: "USD", history: [{ date: new Date("2026-07-13"), amountMinor: 10000n }, { date: new Date("2026-07-14"), amountMinor: -2000n }], subscriptions: [{ merchant: "Video", amountMinor: 1200n, nextChargeDate: new Date("2026-07-16"), cadence: "MONTHLY" }], events: [{ date: new Date("2026-07-16"), amountMinor: 5000n, label: "Refund" }], incomeAdjustmentBps: 0, expenseAdjustmentBps: 0 });
    expect(result.points).toHaveLength(7);
    expect(result.points[0]).toMatchObject({ expectedBalanceMinor: 107800n, lowerBalanceMinor: 106500n, upperBalanceMinor: 109100n, subscriptionMinor: 1200n, scenarioMinor: 5000n, drivers: ["Subscriptions: Video", "Scenario: Refund"] });
    expect(result.modelVersion).toBe("transparent-average-v1");
  });

  it("produces a flat baseline with explicit sparse-history disclosure", () => {
    const result = forecast({ now, startingBalanceMinor: 50000n, horizonDays: 7, currency: "USD", history: [], subscriptions: [], events: [], incomeAdjustmentBps: 0, expenseAdjustmentBps: 0 });
    expect(result.historyDays).toBe(0);
    expect(result.points.every((point) => point.expectedBalanceMinor === 50000n)).toBe(true);
  });

  it("validates boundaries and emits non-sensitive telemetry", async () => {
    const repository: ForecastRepository = { async inputs() { return { history: [], subscriptions: [] }; } };
    const events: Array<Record<string, unknown>> = []; const telemetry: ForecastTelemetry = { record: (event) => events.push(event) };
    const service = new ForecastService(repository, () => now, telemetry);
    await expect(service.generate("user-secret", { startingBalanceMinor: "10000", horizonDays: 7, currency: "usd" })).resolves.toMatchObject({ currency: "USD", historyDays: 0 });
    expect(events[0]).toMatchObject({ name: "forecast.generated", horizonDays: 7, historyDays: 0, pointCount: 7 });
    expect(JSON.stringify(events)).not.toContain("user-secret");
    await expect(service.generate("user", { startingBalanceMinor: "1.2", horizonDays: 7, currency: "USD" })).rejects.toMatchObject({ code: "INVALID_FORECAST_INPUT" });
    await expect(service.generate("user", { startingBalanceMinor: "100", horizonDays: 181, currency: "USD" })).rejects.toMatchObject({ code: "INVALID_FORECAST_INPUT" });
    await expect(service.generate("user", { startingBalanceMinor: "100", horizonDays: 7, currency: "USD", events: [{ date: "2026-07-14", amountMinor: "1", label: "Past" }] })).rejects.toMatchObject({ code: "INVALID_FORECAST_INPUT" });
  });
});

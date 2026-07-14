import { describe, expect, it } from "vitest";
import type { PlanningRepository } from "../src/modules/planning/ports.js";
import { PlanningService } from "../src/modules/planning/service.js";

class MemoryPlanning implements PlanningRepository {
  async dashboard(_userId: string, month: Date, currency: string) { return { budgets: [], goals: [], subscriptions: [], calculatedAt: month }; }
  async createBudget(_userId: string, input: { name: string; month: Date; currency: string; totalLimitMinor: bigint }) { return { id: "budget", ...input, spentMinor: 0n, version: 1 }; }
  async createGoal(_userId: string, input: { name: string; targetMinor: bigint; currentMinor: bigint; currency: string; targetDate?: Date }) { return { id: "goal", ...input, targetDate: input.targetDate ?? null, status: "ACTIVE", version: 1 }; }
  async createSubscription(_userId: string, input: { merchant: string; amountMinor: bigint; currency: string; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"; nextChargeDate: Date }) { return { id: "subscription", ...input, active: true, version: 1 }; }
}

describe("financial planning", () => {
  const service = new PlanningService(new MemoryPlanning());
  it("creates currency-safe planning records", async () => {
    await expect(service.createBudget("u", { name: "July", month: "2026-07", currency: "usd", totalLimitMinor: "100000" })).resolves.toMatchObject({ currency: "USD", totalLimitMinor: 100000n });
    await expect(service.createGoal("u", { name: "Emergency", targetMinor: "500000", currentMinor: "125000", currency: "USD", targetDate: "2027-01-01" })).resolves.toMatchObject({ currentMinor: 125000n });
    await expect(service.createSubscription("u", { merchant: "  Video   Service ", amountMinor: "1299", currency: "usd", cadence: "MONTHLY", nextChargeDate: "2026-08-01" })).resolves.toMatchObject({ merchant: "Video   Service", amountMinor: 1299n });
  });
  it("rejects invalid money, dates, currency, and impossible goal progress", async () => {
    expect(() => service.createBudget("u", { name: "Bad", month: "2026-13", currency: "USD", totalLimitMinor: "1" })).toThrowError(expect.objectContaining({ code: "INVALID_DATE" }));
    expect(() => service.createBudget("u", { name: "Bad", month: "2026-07", currency: "US", totalLimitMinor: "1" })).toThrowError(expect.objectContaining({ code: "INVALID_CURRENCY" }));
    expect(() => service.createGoal("u", { name: "Bad", targetMinor: "100", currentMinor: "101", currency: "USD" })).toThrowError(expect.objectContaining({ code: "INVALID_GOAL" }));
  });
});

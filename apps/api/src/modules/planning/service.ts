import type { PlanningRepository } from "./ports.js";

export class PlanningError extends Error {
  constructor(readonly code: "INVALID_MONEY" | "INVALID_DATE" | "INVALID_CURRENCY" | "INVALID_GOAL") { super(code); }
}

function money(value: string, allowZero = false) { if (!/^-?\d+$/.test(value)) throw new PlanningError("INVALID_MONEY"); const parsed = BigInt(value); if (allowZero ? parsed < 0n : parsed <= 0n) throw new PlanningError("INVALID_MONEY"); return parsed; }
function currency(value: string) { const normalized = value.toUpperCase(); if (!/^[A-Z]{3}$/.test(normalized)) throw new PlanningError("INVALID_CURRENCY"); return normalized; }
function date(value: string) { const parsed = new Date(`${value}T00:00:00.000Z`); if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.valueOf())) throw new PlanningError("INVALID_DATE"); return parsed; }

export class PlanningService {
  constructor(private readonly repository: PlanningRepository) {}
  dashboard(userId: string, input: { month: string; currency: string }) { return this.repository.dashboard(userId, date(`${input.month}-01`), currency(input.currency)); }
  createBudget(userId: string, input: { name: string; month: string; currency: string; totalLimitMinor: string }) { return this.repository.createBudget(userId, { name: input.name.trim(), month: date(`${input.month}-01`), currency: currency(input.currency), totalLimitMinor: money(input.totalLimitMinor) }); }
  createGoal(userId: string, input: { name: string; targetMinor: string; currentMinor?: string; currency: string; targetDate?: string }) { const targetMinor = money(input.targetMinor); const currentMinor = money(input.currentMinor ?? "0", true); if (currentMinor > targetMinor) throw new PlanningError("INVALID_GOAL"); return this.repository.createGoal(userId, { name: input.name.trim(), targetMinor, currentMinor, currency: currency(input.currency), ...(input.targetDate ? { targetDate: date(input.targetDate) } : {}) }); }
  createSubscription(userId: string, input: { merchant: string; amountMinor: string; currency: string; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"; nextChargeDate: string }) { const merchant = input.merchant.trim(); return this.repository.createSubscription(userId, { merchant, normalizedMerchant: merchant.toLocaleLowerCase().replace(/\s+/g, " "), amountMinor: money(input.amountMinor), currency: currency(input.currency), cadence: input.cadence, nextChargeDate: date(input.nextChargeDate) }); }
}

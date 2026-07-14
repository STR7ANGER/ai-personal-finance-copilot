import { randomUUID } from "node:crypto";
import { prisma } from "../../db.js";
import type { PlanningRepository } from "./ports.js";

export class PrismaPlanningRepository implements PlanningRepository {
  async dashboard(userId: string, month: Date, currency: string) {
    const monthEnd = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
    const [budgets, goals, subscriptions, spending] = await Promise.all([
      prisma.budget.findMany({ where: { userId, month, currency }, orderBy: { createdAt: "asc" } }),
      prisma.financialGoal.findMany({ where: { userId, status: { in: ["ACTIVE", "COMPLETED"] }, currency }, orderBy: [{ status: "asc" }, { targetDate: "asc" }] }),
      prisma.subscription.findMany({ where: { userId, active: true, currency, nextChargeDate: { gte: month, lt: new Date(month.getTime() + 45 * 86_400_000) } }, orderBy: { nextChargeDate: "asc" } }),
      prisma.transaction.aggregate({ where: { userId, currency, postedDate: { gte: month, lt: monthEnd }, amountMinor: { lt: 0 }, reviewStatus: "REVIEWED" }, _sum: { amountMinor: true } }),
    ]);
    const spentMinor = -(spending._sum.amountMinor ?? 0n);
    return { budgets: budgets.map((budget) => ({ ...budget, spentMinor })), goals, subscriptions, calculatedAt: new Date() };
  }
  async createBudget(userId: string, input: { name: string; month: Date; currency: string; totalLimitMinor: bigint }) { const budget = await prisma.budget.create({ data: { userId, ...input } }); await this.audit(userId, "budget.created", "Budget", budget.id); return { ...budget, spentMinor: 0n }; }
  async createGoal(userId: string, input: { name: string; targetMinor: bigint; currentMinor: bigint; currency: string; targetDate?: Date }) { const goal = await prisma.financialGoal.create({ data: { userId, ...input } }); await this.audit(userId, "goal.created", "FinancialGoal", goal.id); return goal; }
  async createSubscription(userId: string, input: { merchant: string; normalizedMerchant: string; amountMinor: bigint; currency: string; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"; nextChargeDate: Date }) { const subscription = await prisma.subscription.create({ data: { userId, ...input } }); await this.audit(userId, "subscription.created", "Subscription", subscription.id); return subscription; }
  private async audit(userId: string, action: string, targetType: string, targetId: string) { await prisma.auditEvent.create({ data: { actorUserId: userId, action, targetType, targetId, requestId: randomUUID() } }); }
}

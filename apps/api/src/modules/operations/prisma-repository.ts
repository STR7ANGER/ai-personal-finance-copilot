import { randomUUID } from "node:crypto";
import { prisma } from "../../db.js";
import type { OperationsRepository } from "./ports.js";

export class PrismaOperationsRepository implements OperationsRepository {
  async exportTransactions(userId: string, periodStart: Date, currency: string, limit: number) { const end = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1)); const rows = await prisma.transaction.findMany({ where: { userId, currency, postedDate: { gte: periodStart, lt: end }, reviewStatus: "REVIEWED" }, take: limit, orderBy: [{ postedDate: "asc" }, { id: "asc" }], select: { postedDate: true, description: true, amountMinor: true, currency: true, reviewStatus: true, account: { select: { name: true } }, category: { select: { name: true } } } }); return rows.map((row) => ({ postedDate: row.postedDate, account: row.account.name, description: row.description, amountMinor: row.amountMinor, currency: row.currency, category: row.category?.name ?? null, reviewStatus: row.reviewStatus })); }
  async createPrivacyRequest(userId: string, input: { type: "EXPORT" | "DELETE"; confirmationHash: string }) { return prisma.privacyRequest.create({ data: { userId, ...input }, select: { id: true, type: true, status: true, requestedAt: true } }); }
  async createAlertRule(userId: string, input: { type: "BUDGET_THRESHOLD" | "LOW_BALANCE" | "SUBSCRIPTION_DUE"; currency: string; thresholdMinor?: bigint }) { return prisma.alertRule.create({ data: { userId, ...input }, select: { id: true, type: true, currency: true, thresholdMinor: true, active: true } }); }
  async alerts(userId: string, limit: number) { return prisma.alertEvent.findMany({ where: { userId }, take: limit, orderBy: { occurredAt: "desc" }, select: { id: true, title: true, message: true, occurredAt: true, readAt: true } }); }
  async audit(userId: string, action: string, targetType: string, targetId?: string) { await prisma.auditEvent.create({ data: { actorUserId: userId, action, targetType, ...(targetId ? { targetId } : {}), requestId: randomUUID() } }); }
}

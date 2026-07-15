import { prisma } from "../../db.js";
import type { FinanceFact, FinanceQaRepository } from "./ports.js";

export class PrismaFinanceQaRepository implements FinanceQaRepository {
  async facts(userId: string, periodStart: Date, currency: string) {
    const end = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
    const [spending, grouped, budget, subscriptions] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, currency, postedDate: { gte: periodStart, lt: end }, amountMinor: { lt: 0 }, reviewStatus: "REVIEWED" }, _sum: { amountMinor: true }, _count: true }),
      prisma.transaction.groupBy({ by: ["categoryId"], where: { userId, currency, postedDate: { gte: periodStart, lt: end }, amountMinor: { lt: 0 }, reviewStatus: "REVIEWED", categoryId: { not: null } }, _sum: { amountMinor: true }, _count: true }),
      prisma.budget.findUnique({ where: { userId_month_currency: { userId, month: periodStart, currency } } }),
      prisma.subscription.findMany({ where: { userId, currency, active: true, nextChargeDate: { gte: periodStart, lt: end } }, select: { id: true, merchant: true, amountMinor: true } }),
    ]);
    const categoryIds = grouped.flatMap((item) => item.categoryId ? [item.categoryId] : []); const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }); const names = new Map(categories.map((item) => [item.id, item.name]));
    const total = -(spending._sum.amountMinor ?? 0n); const prefix = periodStart.toISOString().slice(0, 7); const facts: FinanceFact[] = [{ id: `spend-total:${prefix}:${currency}`, label: "Reviewed spending", sourceType: "TRANSACTIONS", valueMinor: total, text: `${spending._count} reviewed debit transactions total ${total} minor units in ${currency} during ${prefix}.` }];
    for (const item of grouped) { if (!item.categoryId) continue; const value = -(item._sum.amountMinor ?? 0n); facts.push({ id: `category:${item.categoryId}:${prefix}`, label: names.get(item.categoryId) ?? "Category", sourceType: "CATEGORY", sourceId: item.categoryId, valueMinor: value, text: `${names.get(item.categoryId) ?? "Category"} has ${item._count} reviewed debits totaling ${value} minor units.` }); }
    if (budget) facts.push({ id: `budget:${budget.id}`, label: budget.name, sourceType: "BUDGET", sourceId: budget.id, valueMinor: budget.totalLimitMinor, text: `Budget ${budget.name} limit is ${budget.totalLimitMinor} minor units; reviewed spending is ${total} minor units.` });
    for (const item of subscriptions) facts.push({ id: `subscription:${item.id}`, label: item.merchant, sourceType: "SUBSCRIPTIONS", sourceId: item.id, valueMinor: item.amountMinor, text: `Confirmed subscription ${item.merchant} is ${item.amountMinor} minor units in ${currency}.` });
    return facts;
  }
  async save(userId: string, input: { question: string; answer: string; currency: string; periodStart: Date; model: string; promptVersion: string; factsHash: string; citations: FinanceFact[] }) {
    const saved = await prisma.financeAnswer.create({ data: { userId, question: input.question, answer: input.answer, currency: input.currency, periodStart: input.periodStart, model: input.model, promptVersion: input.promptVersion, factsHash: input.factsHash, citations: { create: input.citations.map((fact) => ({ factId: fact.id, label: fact.label, sourceType: fact.sourceType, ...(fact.sourceId ? { sourceId: fact.sourceId } : {}), ...(fact.valueMinor !== undefined ? { valueMinor: fact.valueMinor } : {}) })) } }, include: { citations: true } });
    return { ...saved, citations: saved.citations.map((item) => ({ id: item.factId, label: item.label, sourceType: item.sourceType as FinanceFact["sourceType"], ...(item.sourceId ? { sourceId: item.sourceId } : {}), ...(item.valueMinor !== null ? { valueMinor: item.valueMinor } : {}) })) };
  }
  async find(userId: string, id: string) { const saved = await prisma.financeAnswer.findFirst({ where: { id, userId }, include: { citations: true } }); if (!saved) return null; return { ...saved, citations: saved.citations.map((item) => ({ id: item.factId, label: item.label, sourceType: item.sourceType as FinanceFact["sourceType"], ...(item.sourceId ? { sourceId: item.sourceId } : {}), ...(item.valueMinor !== null ? { valueMinor: item.valueMinor } : {}) })) }; }
}

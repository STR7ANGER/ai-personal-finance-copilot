import { prisma } from "../../db.js";
import type { CategorizationRepository } from "./ports.js";

export class PrismaCategorizationRepository implements CategorizationRepository {
  async context(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, userId }, select: { id: true, normalizedDescription: true, amountMinor: true, currency: true } });
    if (!transaction) return null;
    const categories = await prisma.category.findMany({ where: { OR: [{ userId }, { userId: null }], active: true }, select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } });
    return { transactionId: transaction.id, description: transaction.normalizedDescription, amountMinor: transaction.amountMinor, currency: transaction.currency, categories };
  }
  async saveSuggestion(userId: string, input: { transactionId: string; categoryId?: string; confidence: number; explanation: string; model: string; promptVersion: string; groundedInputHash: string }) {
    const suggestion = await prisma.categorySuggestion.create({ data: { userId, transactionId: input.transactionId, ...(input.categoryId ? { suggestedCategoryId: input.categoryId } : {}), confidence: input.confidence, explanation: input.explanation, model: input.model, promptVersion: input.promptVersion, groundedInputHash: input.groundedInputHash }, include: { suggestedCategory: { select: { id: true, slug: true, name: true } } } });
    return { id: suggestion.id, transactionId: suggestion.transactionId, category: suggestion.suggestedCategory, confidence: suggestion.confidence, explanation: suggestion.explanation, model: suggestion.model, promptVersion: suggestion.promptVersion, status: suggestion.status };
  }
  async categoryAllowed(userId: string, categoryId: string) { return Boolean(await prisma.category.findFirst({ where: { id: categoryId, OR: [{ userId }, { userId: null }], active: true } })); }
  async recordFeedback(userId: string, input: { suggestionId: string; accepted: boolean; categoryId?: string; reason?: string }) {
    try { await prisma.$transaction(async (database) => { const suggestion = await database.categorySuggestion.findFirst({ where: { id: input.suggestionId, userId, status: "PENDING" } }); if (!suggestion) throw new Error("not pending"); await database.categoryFeedback.create({ data: { userId, suggestionId: input.suggestionId, accepted: input.accepted, ...(input.categoryId ? { categoryId: input.categoryId } : {}), ...(input.reason ? { reason: input.reason } : {}) } }); await database.categorySuggestion.update({ where: { id: input.suggestionId }, data: { status: input.accepted ? "ACCEPTED" : "REJECTED" } }); }); return true; } catch { return false; }
  }
}

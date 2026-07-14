import type { ReviewStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../db.js";
import type { ReviewTransaction, TransactionRepository } from "./ports.js";

const select = { id: true, postedDate: true, description: true, amountMinor: true, currency: true, categorySource: true, categoryConfidence: true, reviewStatus: true, version: true, account: { select: { name: true } }, category: { select: { id: true, name: true } } } as const;

function map(row: Awaited<ReturnType<typeof fetchOne>>): ReviewTransaction {
  return { id: row.id, accountName: row.account.name, postedDate: row.postedDate, description: row.description, amountMinor: row.amountMinor, currency: row.currency, category: row.category, categorySource: row.categorySource, categoryConfidence: row.categoryConfidence, reviewStatus: row.reviewStatus, version: row.version, possibleDuplicateCount: 0 };
}

async function fetchOne(id: string) { return prisma.transaction.findUniqueOrThrow({ where: { id }, select }); }

export class PrismaTransactionRepository implements TransactionRepository {
  async listReview(userId: string, input: { cursor?: string; limit: number; status?: string }) {
    const rows = await prisma.transaction.findMany({ where: { userId, ...(input.status ? { reviewStatus: input.status as ReviewStatus } : {}) }, orderBy: [{ postedDate: "desc" }, { id: "desc" }], take: input.limit + 1, ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}), select });
    const hasMore = rows.length > input.limit; const items = rows.slice(0, input.limit).map(map);
    return { items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
  }
  async categoryBelongsToUser(userId: string, categoryId: string) { return Boolean(await prisma.category.findFirst({ where: { id: categoryId, OR: [{ userId }, { userId: null }], active: true }, select: { id: true } })); }
  async setCategory(userId: string, input: { transactionId: string; categoryId: string; expectedVersion: number }) {
    const changed = await prisma.$transaction(async (database) => {
      const result = await database.transaction.updateMany({ where: { id: input.transactionId, userId, version: input.expectedVersion }, data: { categoryId: input.categoryId, categorySource: "USER", categoryConfidence: 1, reviewStatus: "REVIEWED", version: { increment: 1 } } });
      if (result.count) await database.auditEvent.create({ data: { actorUserId: userId, action: "transaction.category_changed", targetType: "Transaction", targetId: input.transactionId, requestId: randomUUID(), metadata: { categoryId: input.categoryId, expectedVersion: input.expectedVersion } } });
      return result;
    });
    if (!changed.count) return null;
    const row = await fetchOne(input.transactionId); return map(row);
  }
  async resolveDuplicate(userId: string, input: { candidateId: string; resolution: "KEEP_BOTH" | "MERGED" | "NOT_DUPLICATE"; canonicalId?: string }) {
    const changed = await prisma.$transaction(async (database) => {
      const result = await database.duplicateCandidate.updateMany({ where: { id: input.candidateId, userId, resolution: "PENDING" }, data: { resolution: input.resolution, ...(input.canonicalId ? { canonicalId: input.canonicalId } : {}), resolvedAt: new Date() } });
      if (result.count) await database.auditEvent.create({ data: { actorUserId: userId, action: "transaction.duplicate_resolved", targetType: "DuplicateCandidate", targetId: input.candidateId, requestId: randomUUID(), metadata: { resolution: input.resolution, ...(input.canonicalId ? { canonicalId: input.canonicalId } : {}) } } });
      return result;
    });
    return changed.count === 1;
  }
}

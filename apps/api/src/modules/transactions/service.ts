import type { TransactionRepository } from "./ports.js";

export class TransactionError extends Error {
  constructor(readonly code: "FORBIDDEN" | "VERSION_CONFLICT" | "NOT_FOUND" | "INVALID_RESOLUTION") { super(code); }
}

export class TransactionService {
  constructor(private readonly repository: TransactionRepository) {}
  async reviewQueue(userId: string, input: { cursor?: string; limit?: number; status?: string }) {
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    return this.repository.listReview(userId, { ...(input.cursor ? { cursor: input.cursor } : {}), ...(input.status ? { status: input.status } : {}), limit });
  }
  async setCategory(userId: string, input: { transactionId: string; categoryId: string; expectedVersion: number }) {
    if (!(await this.repository.categoryBelongsToUser(userId, input.categoryId))) throw new TransactionError("FORBIDDEN");
    const updated = await this.repository.setCategory(userId, input);
    if (!updated) throw new TransactionError("VERSION_CONFLICT");
    return updated;
  }
  async resolveDuplicate(userId: string, input: { candidateId: string; resolution: "KEEP_BOTH" | "MERGED" | "NOT_DUPLICATE"; canonicalId?: string }) {
    if (input.resolution === "MERGED" && !input.canonicalId) throw new TransactionError("INVALID_RESOLUTION");
    if (!(await this.repository.resolveDuplicate(userId, input))) throw new TransactionError("NOT_FOUND");
    return true;
  }
}

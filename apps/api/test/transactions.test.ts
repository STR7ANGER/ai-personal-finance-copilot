import { describe, expect, it } from "vitest";
import type { ReviewPage, ReviewTransaction, TransactionRepository } from "../src/modules/transactions/ports.js";
import { TransactionService } from "../src/modules/transactions/service.js";

const transaction: ReviewTransaction = { id: "tx-1", accountName: "Checking", postedDate: new Date("2026-07-14"), description: "Coffee", amountMinor: -450n, currency: "USD", category: null, categorySource: "UNCATEGORIZED", categoryConfidence: null, reviewStatus: "PENDING", version: 1, possibleDuplicateCount: 0 };

class MemoryTransactions implements TransactionRepository {
  page: ReviewPage = { items: [transaction], nextCursor: null };
  async listReview() { return this.page; }
  async categoryBelongsToUser(_userId: string, categoryId: string) { return categoryId === "food"; }
  async setCategory(_userId: string, input: { expectedVersion: number }) { return input.expectedVersion === 1 ? { ...transaction, category: { id: "food", name: "Food" }, categorySource: "USER", reviewStatus: "REVIEWED", version: 2 } : null; }
  async resolveDuplicate(_userId: string, input: { candidateId: string }) { return input.candidateId === "dupe-1"; }
}

describe("transaction review", () => {
  it("paginates within safe limits and applies a user category with optimistic concurrency", async () => {
    const service = new TransactionService(new MemoryTransactions());
    await expect(service.reviewQueue("user-1", { limit: 1000 })).resolves.toEqual({ items: [transaction], nextCursor: null });
    await expect(service.setCategory("user-1", { transactionId: "tx-1", categoryId: "food", expectedVersion: 1 })).resolves.toMatchObject({ version: 2, reviewStatus: "REVIEWED" });
    await expect(service.setCategory("user-1", { transactionId: "tx-1", categoryId: "food", expectedVersion: 2 })).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
  });
  it("blocks foreign categories and invalid destructive duplicate decisions", async () => {
    const service = new TransactionService(new MemoryTransactions());
    await expect(service.setCategory("user-1", { transactionId: "tx-1", categoryId: "foreign", expectedVersion: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.resolveDuplicate("user-1", { candidateId: "dupe-1", resolution: "MERGED" })).rejects.toMatchObject({ code: "INVALID_RESOLUTION" });
  });
});

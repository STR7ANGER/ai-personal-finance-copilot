import { describe, expect, it } from "vitest";
import type { CategorizationRepository, CategoryModel, ModelSuggestion } from "../src/modules/categorization/ports.js";
import { CategorizationService } from "../src/modules/categorization/service.js";

class FakeModel implements CategoryModel {
  readonly model = "fake-gemini";
  constructor(private readonly response: ModelSuggestion | Error) {}
  async suggest() { if (this.response instanceof Error) throw this.response; return this.response; }
}

class MemoryCategorization implements CategorizationRepository {
  saved: Array<Record<string, unknown>> = []; feedbackRecorded = false;
  async context(_userId: string, transactionId: string) { return transactionId === "missing" ? null : { transactionId, description: "coffee shop", amountMinor: -450n, currency: "USD", categories: [{ id: "food", slug: "food", name: "Food" }] }; }
  async saveSuggestion(_userId: string, input: { transactionId: string; categoryId?: string; confidence: number; explanation: string; model: string; promptVersion: string }) { this.saved.push(input); return { id: "suggestion-1", transactionId: input.transactionId, category: input.categoryId ? { id: "food", slug: "food", name: "Food" } : null, confidence: input.confidence, explanation: input.explanation, model: input.model, promptVersion: input.promptVersion, status: "PENDING" }; }
  async recordFeedback() { if (this.feedbackRecorded) return false; this.feedbackRecorded = true; return true; }
  async categoryAllowed(_userId: string, categoryId: string) { return categoryId === "food"; }
}

describe("grounded categorization", () => {
  it("persists an allow-listed, high-confidence suggestion without applying it", async () => {
    const repository = new MemoryCategorization(); const service = new CategorizationService(repository, new FakeModel({ categorySlug: "food", confidence: 0.91, explanation: "Merchant description indicates a cafe." }));
    await expect(service.suggest("user-1", "tx-1")).resolves.toMatchObject({ category: { id: "food" }, status: "PENDING" });
    expect(repository.saved[0]).toMatchObject({ categoryId: "food", model: "fake-gemini", promptVersion: "category-v1" });
  });
  it("keeps a low-confidence suggestion non-actionable and rejects hallucinated categories", async () => {
    const repository = new MemoryCategorization();
    await new CategorizationService(repository, new FakeModel({ categorySlug: "food", confidence: 0.4, explanation: "Ambiguous." })).suggest("user-1", "tx-1");
    expect(repository.saved[0]).not.toHaveProperty("categoryId");
    await expect(new CategorizationService(repository, new FakeModel({ categorySlug: "invented", confidence: 0.99, explanation: "No grounding." })).suggest("user-1", "tx-1")).rejects.toMatchObject({ code: "INVALID_SUGGESTION" });
  });
  it("maps provider failure and enforces one feedback decision", async () => {
    const repository = new MemoryCategorization(); const service = new CategorizationService(repository, new FakeModel(new Error("offline")));
    await expect(service.suggest("user-1", "tx-1")).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
    await expect(service.feedback("user-1", { suggestionId: "suggestion-1", accepted: true, categoryId: "food" })).resolves.toBe(true);
    await expect(service.feedback("user-1", { suggestionId: "suggestion-1", accepted: true, categoryId: "food" })).rejects.toMatchObject({ code: "FEEDBACK_EXISTS" });
    await expect(service.feedback("user-1", { suggestionId: "suggestion-2", accepted: false, categoryId: "foreign" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

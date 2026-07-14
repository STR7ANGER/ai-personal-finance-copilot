import { createHash } from "node:crypto";
import type { CategorizationRepository, CategoryModel } from "./ports.js";

export class CategorizationError extends Error {
  constructor(readonly code: "NOT_FOUND" | "AI_UNAVAILABLE" | "INVALID_SUGGESTION" | "FORBIDDEN" | "FEEDBACK_EXISTS") { super(code); }
}

export class CategorizationService {
  static readonly promptVersion = "category-v1";
  constructor(private readonly repository: CategorizationRepository, private readonly model: CategoryModel, private readonly threshold = 0.65) {}

  async suggest(userId: string, transactionId: string) {
    const context = await this.repository.context(userId, transactionId);
    if (!context) throw new CategorizationError("NOT_FOUND");
    const grounded = { description: context.description.slice(0, 300), amountMinor: context.amountMinor.toString(), currency: context.currency, direction: context.amountMinor < 0n ? "debit" as const : "credit" as const, categories: context.categories.map(({ slug, name }) => ({ slug, name })) };
    let proposed;
    try { proposed = await this.model.suggest(grounded); } catch { throw new CategorizationError("AI_UNAVAILABLE"); }
    const category = context.categories.find((option) => option.slug === proposed.categorySlug);
    if (!category || !Number.isFinite(proposed.confidence) || proposed.explanation.length > 240) throw new CategorizationError("INVALID_SUGGESTION");
    const hash = createHash("sha256").update(JSON.stringify({ ...grounded, model: this.model.model, promptVersion: CategorizationService.promptVersion })).digest("hex");
    return this.repository.saveSuggestion(userId, { transactionId, ...(proposed.confidence >= this.threshold ? { categoryId: category.id } : {}), confidence: proposed.confidence, explanation: proposed.explanation, model: this.model.model, promptVersion: CategorizationService.promptVersion, groundedInputHash: hash });
  }

  async feedback(userId: string, input: { suggestionId: string; accepted: boolean; categoryId?: string; reason?: string }) {
    if (input.categoryId && !(await this.repository.categoryAllowed(userId, input.categoryId))) throw new CategorizationError("FORBIDDEN");
    if (!(await this.repository.recordFeedback(userId, input))) throw new CategorizationError("FEEDBACK_EXISTS");
    return true;
  }
}

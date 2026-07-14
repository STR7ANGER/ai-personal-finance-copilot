export type CategoryOption = { id: string; slug: string; name: string };
export type CategorizationContext = { transactionId: string; description: string; amountMinor: bigint; currency: string; categories: CategoryOption[] };
export type ModelSuggestion = { categorySlug: string; confidence: number; explanation: string };
export type SavedSuggestion = { id: string; transactionId: string; category: CategoryOption | null; confidence: number; explanation: string; model: string; promptVersion: string; status: string };

export interface CategoryModel {
  readonly model: string;
  suggest(input: { description: string; amountMinor: string; currency: string; direction: "debit" | "credit"; categories: Array<{ slug: string; name: string }> }): Promise<ModelSuggestion>;
}

export interface CategorizationRepository {
  context(userId: string, transactionId: string): Promise<CategorizationContext | null>;
  saveSuggestion(userId: string, input: { transactionId: string; categoryId?: string; confidence: number; explanation: string; model: string; promptVersion: string; groundedInputHash: string }): Promise<SavedSuggestion>;
  recordFeedback(userId: string, input: { suggestionId: string; accepted: boolean; categoryId?: string; reason?: string }): Promise<boolean>;
  categoryAllowed(userId: string, categoryId: string): Promise<boolean>;
}

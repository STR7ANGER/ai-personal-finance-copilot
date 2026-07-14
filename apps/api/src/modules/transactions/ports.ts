export type ReviewTransaction = {
  id: string; accountName: string; postedDate: Date; description: string; amountMinor: bigint; currency: string;
  category: { id: string; name: string } | null; categorySource: string; categoryConfidence: number | null;
  reviewStatus: string; version: number; possibleDuplicateCount: number;
};

export type ReviewPage = { items: ReviewTransaction[]; nextCursor: string | null };

export interface TransactionRepository {
  listReview(userId: string, input: { cursor?: string; limit: number; status?: string }): Promise<ReviewPage>;
  categoryBelongsToUser(userId: string, categoryId: string): Promise<boolean>;
  setCategory(userId: string, input: { transactionId: string; categoryId: string; expectedVersion: number }): Promise<ReviewTransaction | null>;
  resolveDuplicate(userId: string, input: { candidateId: string; resolution: "KEEP_BOTH" | "MERGED" | "NOT_DUPLICATE"; canonicalId?: string }): Promise<boolean>;
}

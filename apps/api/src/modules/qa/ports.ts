export type FinanceFact = { id: string; label: string; sourceType: "TRANSACTIONS" | "CATEGORY" | "BUDGET" | "SUBSCRIPTIONS"; sourceId?: string; valueMinor?: bigint; text: string };
export type FinanceAnswerView = { id: string; question: string; answer: string; currency: string; periodStart: Date; model: string; promptVersion: string; createdAt: Date; citations: Array<Omit<FinanceFact, "text">> };

export interface FinanceQaRepository {
  facts(userId: string, periodStart: Date, currency: string): Promise<FinanceFact[]>;
  save(userId: string, input: { question: string; answer: string; currency: string; periodStart: Date; model: string; promptVersion: string; factsHash: string; citations: FinanceFact[] }): Promise<FinanceAnswerView>;
  find(userId: string, id: string): Promise<FinanceAnswerView | null>;
}

export interface FinanceAnswerModel {
  readonly model: string;
  answer(input: { question: string; period: string; currency: string; facts: Array<{ id: string; text: string }> }): Promise<{ answer: string; citationIds: string[] }>;
}

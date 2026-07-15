import { createHash } from "node:crypto";
import type { FinanceAnswerModel, FinanceQaRepository } from "./ports.js";

export class FinanceQaError extends Error { constructor(readonly code: "INVALID_QUESTION" | "INVALID_PERIOD" | "AI_UNAVAILABLE" | "UNGROUNDED_ANSWER" | "NOT_FOUND") { super(code); } }

function month(value: string) { if (!/^\d{4}-\d{2}$/.test(value)) throw new FinanceQaError("INVALID_PERIOD"); const date = new Date(`${value}-01T00:00:00.000Z`); if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 7) !== value) throw new FinanceQaError("INVALID_PERIOD"); return date; }

export class FinanceQaService {
  static readonly promptVersion = "finance-qa-v1";
  constructor(private readonly repository: FinanceQaRepository, private readonly model: FinanceAnswerModel) {}
  facts(userId: string, input: { month: string; currency: string }) { return this.repository.facts(userId, month(input.month), input.currency.toUpperCase()); }
  async ask(userId: string, input: { question: string; month: string; currency: string }) {
    const question = input.question.trim(); if (question.length < 3 || question.length > 500) throw new FinanceQaError("INVALID_QUESTION");
    const periodStart = month(input.month); const currency = input.currency.toUpperCase(); const facts = await this.repository.facts(userId, periodStart, currency);
    if (!facts.length) throw new FinanceQaError("NOT_FOUND");
    let output; try { output = await this.model.answer({ question, period: input.month, currency, facts: facts.map(({ id, text }) => ({ id, text })) }); } catch { throw new FinanceQaError("AI_UNAVAILABLE"); }
    const ids = [...new Set(output.citationIds)]; const citations = ids.map((id) => facts.find((fact) => fact.id === id));
    if (!ids.length || citations.some((fact) => !fact) || output.answer.length > 1_200) throw new FinanceQaError("UNGROUNDED_ANSWER");
    const factsHash = createHash("sha256").update(JSON.stringify(facts.map((fact) => ({ ...fact, valueMinor: fact.valueMinor?.toString() })))).digest("hex");
    return this.repository.save(userId, { question, answer: output.answer, currency, periodStart, model: this.model.model, promptVersion: FinanceQaService.promptVersion, factsHash, citations: citations as typeof facts });
  }
  async find(userId: string, id: string) { const answer = await this.repository.find(userId, id); if (!answer) throw new FinanceQaError("NOT_FOUND"); return answer; }
}

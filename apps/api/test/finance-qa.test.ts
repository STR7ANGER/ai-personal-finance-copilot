import { describe, expect, it } from "vitest";
import type { FinanceAnswerModel, FinanceFact, FinanceQaRepository } from "../src/modules/qa/ports.js";
import { FinanceQaService } from "../src/modules/qa/service.js";

const facts: FinanceFact[] = [{ id: "spend-total", label: "Reviewed spending", sourceType: "TRANSACTIONS", valueMinor: 450n, text: "Reviewed spending is 450 minor units." }, { id: "budget", label: "July plan", sourceType: "BUDGET", valueMinor: 150000n, text: "Budget is 150000 minor units." }];
class MemoryQa implements FinanceQaRepository {
  saved = false;
  async facts() { return facts; }
  async save(_userId: string, input: { question: string; answer: string; currency: string; periodStart: Date; model: string; promptVersion: string; citations: FinanceFact[] }) { this.saved = true; return { id: "answer-1", ...input, createdAt: new Date("2026-07-15"), citations: input.citations.map(({ text: _text, ...citation }) => citation) }; }
  async find(_userId: string, id: string) { return id === "answer-1" ? { id, question: "Why?", answer: "Because.", currency: "USD", periodStart: new Date("2026-07-01"), model: "fake", promptVersion: "v1", createdAt: new Date(), citations: [] } : null; }
}
class FakeQaModel implements FinanceAnswerModel { readonly model = "fake-gemini"; constructor(private readonly output: { answer: string; citationIds: string[] } | Error) {} async answer() { if (this.output instanceof Error) throw this.output; return this.output; } }

describe("grounded finance Q&A", () => {
  it("persists an answer only with validated fact citations", async () => {
    const repository = new MemoryQa(); const service = new FinanceQaService(repository, new FakeQaModel({ answer: "You spent 450 minor units, within the July budget.", citationIds: ["spend-total", "budget"] }));
    await expect(service.ask("user-1", { question: "How am I doing?", month: "2026-07", currency: "USD" })).resolves.toMatchObject({ id: "answer-1", citations: [{ id: "spend-total" }, { id: "budget" }] });
    expect(repository.saved).toBe(true);
  });
  it("rejects hallucinated citations and provider failure", async () => {
    const repository = new MemoryQa();
    await expect(new FinanceQaService(repository, new FakeQaModel({ answer: "Unsupported", citationIds: ["invented"] })).ask("u", { question: "Explain spending", month: "2026-07", currency: "USD" })).rejects.toMatchObject({ code: "UNGROUNDED_ANSWER" });
    await expect(new FinanceQaService(repository, new FakeQaModel(new Error("offline"))).ask("u", { question: "Explain spending", month: "2026-07", currency: "USD" })).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
  });
  it("rejects malformed questions and cross-user answer lookups", async () => {
    const service = new FinanceQaService(new MemoryQa(), new FakeQaModel({ answer: "ok", citationIds: ["spend-total"] }));
    await expect(service.ask("u", { question: "?", month: "2026-07", currency: "USD" })).rejects.toMatchObject({ code: "INVALID_QUESTION" });
    await expect(service.find("u", "foreign")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

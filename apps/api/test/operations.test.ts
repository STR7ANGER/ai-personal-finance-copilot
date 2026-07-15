import { describe, expect, it } from "vitest";
import type { AlertView, ExportTransaction, OperationsRepository } from "../src/modules/operations/ports.js";
import { OperationsService } from "../src/modules/operations/service.js";

class MemoryOperationsRepository implements OperationsRepository {
  exports: ExportTransaction[] = [];
  privacyInputs: Array<{ type: "EXPORT" | "DELETE"; confirmationHash: string }> = [];
  alertInputs: Array<{ type: "BUDGET_THRESHOLD" | "LOW_BALANCE" | "SUBSCRIPTION_DUE"; currency: string; thresholdMinor?: bigint }> = [];
  auditEvents: string[] = [];

  async exportTransactions(_userId: string, _periodStart: Date, _currency: string, limit: number) { return this.exports.slice(0, limit); }
  async createPrivacyRequest(_userId: string, input: { type: "EXPORT" | "DELETE"; confirmationHash: string }) {
    this.privacyInputs.push(input);
    return { id: "privacy-1", type: input.type, status: "PENDING", requestedAt: new Date("2026-07-15") };
  }
  async createAlertRule(_userId: string, input: { type: "BUDGET_THRESHOLD" | "LOW_BALANCE" | "SUBSCRIPTION_DUE"; currency: string; thresholdMinor?: bigint }) {
    this.alertInputs.push(input);
    return { id: "rule-1", type: input.type, currency: input.currency, thresholdMinor: input.thresholdMinor ?? null, active: true };
  }
  async alerts(_userId: string, _limit: number): Promise<AlertView[]> { return []; }
  async audit(_userId: string, action: string) { this.auditEvents.push(action); }
}

describe("operations and privacy", () => {
  it("exports only repository-approved rows and neutralizes spreadsheet formulas", async () => {
    const repository = new MemoryOperationsRepository();
    repository.exports = [{ postedDate: new Date("2026-07-10"), account: "Checking", description: "=HYPERLINK(\"https://bad.example\")", amountMinor: -1200n, currency: "USD", category: null, reviewStatus: "REVIEWED" }];
    const result = await new OperationsService(repository).transactionCsv("user-secret", { month: "2026-07", currency: "usd" });
    expect(result.content).toContain("\"'=HYPERLINK(\"\"https://bad.example\"\")\"");
    expect(result.rowCount).toBe(1);
    expect(repository.auditEvents).toEqual(["export.transactions_created"]);
  });

  it("requires exact privacy confirmation and persists only its hash", async () => {
    const repository = new MemoryOperationsRepository(); const service = new OperationsService(repository);
    await expect(service.requestPrivacy("user", { type: "DELETE", confirmation: "delete my data" })).rejects.toMatchObject({ code: "INVALID_CONFIRMATION" });
    await service.requestPrivacy("user", { type: "DELETE", confirmation: "DELETE MY DATA" });
    expect(repository.privacyInputs[0]?.confirmationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(repository.privacyInputs)).not.toContain("DELETE MY DATA");
  });

  it("validates thresholds and normalizes currencies", async () => {
    const repository = new MemoryOperationsRepository(); const service = new OperationsService(repository);
    await expect(service.createAlert("user", { type: "LOW_BALANCE", currency: "USD" })).rejects.toMatchObject({ code: "INVALID_ALERT" });
    await service.createAlert("user", { type: "LOW_BALANCE", currency: "usd", thresholdMinor: "5000" });
    expect(repository.alertInputs[0]).toEqual({ type: "LOW_BALANCE", currency: "USD", thresholdMinor: 5000n });
  });
});

import { createHash } from "node:crypto";
import type { OperationsRepository } from "./ports.js";

export class OperationsError extends Error { constructor(readonly code: "INVALID_EXPORT" | "INVALID_CONFIRMATION" | "INVALID_ALERT") { super(code); } }
const month = (value: string) => { if (!/^\d{4}-\d{2}$/.test(value)) throw new OperationsError("INVALID_EXPORT"); const parsed = new Date(`${value}-01T00:00:00.000Z`); if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 7) !== value) throw new OperationsError("INVALID_EXPORT"); return parsed; };
const safeCell = (value: string) => { const escaped = /^[=+\-@]/.test(value) ? `'${value}` : value; return `"${escaped.replaceAll('"', '""')}"`; };

export class OperationsService {
  constructor(private readonly repository: OperationsRepository) {}
  async transactionCsv(userId: string, input: { month: string; currency: string }) {
    const periodStart = month(input.month); const currency = input.currency.toUpperCase(); if (!/^[A-Z]{3}$/.test(currency)) throw new OperationsError("INVALID_EXPORT");
    const rows = await this.repository.exportTransactions(userId, periodStart, currency, 10_000);
    const header = ["posted_date", "account", "description", "amount_minor", "currency", "category", "review_status"].map(safeCell).join(",");
    const body = rows.map((row) => [row.postedDate.toISOString().slice(0, 10), row.account, row.description, row.amountMinor.toString(), row.currency, row.category ?? "Uncategorized", row.reviewStatus].map(safeCell).join(","));
    await this.repository.audit(userId, "export.transactions_created", "TransactionExport");
    return { fileName: `transactions-${input.month}-${currency}.csv`, content: [header, ...body].join("\r\n") + "\r\n", rowCount: rows.length };
  }
  async requestPrivacy(userId: string, input: { type: "EXPORT" | "DELETE"; confirmation: string }) {
    const expected = input.type === "DELETE" ? "DELETE MY DATA" : "EXPORT MY DATA";
    if (input.confirmation !== expected) throw new OperationsError("INVALID_CONFIRMATION");
    const request = await this.repository.createPrivacyRequest(userId, { type: input.type, confirmationHash: createHash("sha256").update(input.confirmation).digest("hex") });
    await this.repository.audit(userId, `privacy.${input.type.toLowerCase()}_requested`, "PrivacyRequest", request.id); return request;
  }
  async createAlert(userId: string, input: { type: "BUDGET_THRESHOLD" | "LOW_BALANCE" | "SUBSCRIPTION_DUE"; currency: string; thresholdMinor?: string }) {
    const currency = input.currency.toUpperCase(); const thresholdMinor = input.thresholdMinor === undefined ? undefined : BigInt(input.thresholdMinor);
    if (!/^[A-Z]{3}$/.test(currency) || ((input.type === "BUDGET_THRESHOLD" || input.type === "LOW_BALANCE") && (thresholdMinor === undefined || thresholdMinor < 0n))) throw new OperationsError("INVALID_ALERT");
    return this.repository.createAlertRule(userId, { type: input.type, currency, ...(thresholdMinor !== undefined ? { thresholdMinor } : {}) });
  }
  alerts(userId: string, limit = 50) { return this.repository.alerts(userId, Math.min(Math.max(limit, 1), 100)); }
}

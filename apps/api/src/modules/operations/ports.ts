export type ExportTransaction = { postedDate: Date; account: string; description: string; amountMinor: bigint; currency: string; category: string | null; reviewStatus: string };
export type AlertView = { id: string; title: string; message: string; occurredAt: Date; readAt: Date | null };

export interface OperationsRepository {
  exportTransactions(userId: string, periodStart: Date, currency: string, limit: number): Promise<ExportTransaction[]>;
  createPrivacyRequest(userId: string, input: { type: "EXPORT" | "DELETE"; confirmationHash: string }): Promise<{ id: string; type: string; status: string; requestedAt: Date }>;
  createAlertRule(userId: string, input: { type: "BUDGET_THRESHOLD" | "LOW_BALANCE" | "SUBSCRIPTION_DUE"; currency: string; thresholdMinor?: bigint }): Promise<{ id: string; type: string; currency: string; thresholdMinor: bigint | null; active: boolean }>;
  alerts(userId: string, limit: number): Promise<AlertView[]>;
  audit(userId: string, action: string, targetType: string, targetId?: string): Promise<void>;
}

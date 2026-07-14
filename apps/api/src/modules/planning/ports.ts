export type BudgetView = { id: string; name: string; month: Date; currency: string; totalLimitMinor: bigint; spentMinor: bigint; version: number };
export type GoalView = { id: string; name: string; targetMinor: bigint; currentMinor: bigint; currency: string; targetDate: Date | null; status: string; version: number };
export type SubscriptionView = { id: string; merchant: string; amountMinor: bigint; currency: string; cadence: string; nextChargeDate: Date; active: boolean; version: number };
export type FinancialDashboard = { budgets: BudgetView[]; goals: GoalView[]; subscriptions: SubscriptionView[]; calculatedAt: Date };

export interface PlanningRepository {
  dashboard(userId: string, month: Date, currency: string): Promise<FinancialDashboard>;
  createBudget(userId: string, input: { name: string; month: Date; currency: string; totalLimitMinor: bigint }): Promise<BudgetView>;
  createGoal(userId: string, input: { name: string; targetMinor: bigint; currentMinor: bigint; currency: string; targetDate?: Date }): Promise<GoalView>;
  createSubscription(userId: string, input: { merchant: string; normalizedMerchant: string; amountMinor: bigint; currency: string; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"; nextChargeDate: Date }): Promise<SubscriptionView>;
}

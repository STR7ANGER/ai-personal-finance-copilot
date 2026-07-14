import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import type { AuthService } from "../auth/service.js";
import { TransactionError, type TransactionService } from "./service.js";
import { CategorizationError, type CategorizationService } from "../categorization/service.js";
import { PlanningError, type PlanningService } from "../planning/service.js";
import { ForecastError, type ForecastService } from "../forecasting/service.js";

function cookie(request: Request, name: string) { const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined; }

export function createFinanceGraphQL(auth: AuthService, transactions: TransactionService, categorization: CategorizationService, planning: PlanningService, forecasting: ForecastService) {
  const schema = createSchema({
    typeDefs: `
      type Category { id: ID!, name: String! }
      type Transaction { id: ID!, accountName: String!, postedDate: String!, description: String!, amountMinor: String!, currency: String!, category: Category, categorySource: String!, categoryConfidence: Float, reviewStatus: String!, version: Int!, possibleDuplicateCount: Int! }
      type TransactionConnection { items: [Transaction!]!, nextCursor: String }
      type CategorySuggestion { id: ID!, transactionId: ID!, category: Category, confidence: Float!, explanation: String!, model: String!, promptVersion: String!, status: String! }
      type Budget { id: ID!, name: String!, month: String!, currency: String!, totalLimitMinor: String!, spentMinor: String!, version: Int! }
      type FinancialGoal { id: ID!, name: String!, targetMinor: String!, currentMinor: String!, currency: String!, targetDate: String, status: String!, version: Int! }
      type Subscription { id: ID!, merchant: String!, amountMinor: String!, currency: String!, cadence: String!, nextChargeDate: String!, active: Boolean!, version: Int! }
      type FinancialDashboard { budgets: [Budget!]!, goals: [FinancialGoal!]!, subscriptions: [Subscription!]!, calculatedAt: String! }
      input ScenarioEventInput { date: String!, amountMinor: String!, label: String! }
      type ForecastPoint { date: String!, expectedBalanceMinor: String!, lowerBalanceMinor: String!, upperBalanceMinor: String!, expectedInflowMinor: String!, expectedOutflowMinor: String!, subscriptionMinor: String!, scenarioMinor: String!, drivers: [String!]! }
      type CashFlowForecast { currency: String!, modelVersion: String!, generatedAt: String!, historyDays: Int!, incomeAdjustmentBps: Int!, expenseAdjustmentBps: Int!, points: [ForecastPoint!]! }
      type Query { transactionReviewQueue(cursor: String, limit: Int, status: String): TransactionConnection!, financialDashboard(month: String!, currency: String!): FinancialDashboard!, cashFlowForecast(startingBalanceMinor: String!, horizonDays: Int!, currency: String!, incomeAdjustmentBps: Int, expenseAdjustmentBps: Int, events: [ScenarioEventInput!]): CashFlowForecast! }
      type Mutation { setTransactionCategory(transactionId: ID!, categoryId: ID!, expectedVersion: Int!): Transaction!, resolveDuplicate(candidateId: ID!, resolution: String!, canonicalId: ID): Boolean!, suggestTransactionCategory(transactionId: ID!): CategorySuggestion!, recordCategoryFeedback(suggestionId: ID!, accepted: Boolean!, categoryId: ID, reason: String): Boolean!, createBudget(name: String!, month: String!, currency: String!, totalLimitMinor: String!): Budget!, createFinancialGoal(name: String!, targetMinor: String!, currentMinor: String, currency: String!, targetDate: String): FinancialGoal!, createSubscription(merchant: String!, amountMinor: String!, currency: String!, cadence: String!, nextChargeDate: String!): Subscription! }
    `,
    resolvers: {
      Transaction: { postedDate: (value: { postedDate: Date }) => value.postedDate.toISOString(), amountMinor: (value: { amountMinor: bigint }) => value.amountMinor.toString() },
      Budget: { month: (value: { month: Date }) => value.month.toISOString().slice(0, 10), totalLimitMinor: (value: { totalLimitMinor: bigint }) => value.totalLimitMinor.toString(), spentMinor: (value: { spentMinor: bigint }) => value.spentMinor.toString() },
      FinancialGoal: { targetMinor: (value: { targetMinor: bigint }) => value.targetMinor.toString(), currentMinor: (value: { currentMinor: bigint }) => value.currentMinor.toString(), targetDate: (value: { targetDate: Date | null }) => value.targetDate?.toISOString().slice(0, 10) ?? null },
      Subscription: { amountMinor: (value: { amountMinor: bigint }) => value.amountMinor.toString(), nextChargeDate: (value: { nextChargeDate: Date }) => value.nextChargeDate.toISOString().slice(0, 10) },
      FinancialDashboard: { calculatedAt: (value: { calculatedAt: Date }) => value.calculatedAt.toISOString() },
      ForecastPoint: { date: (value: { date: Date }) => value.date.toISOString().slice(0, 10), expectedBalanceMinor: (value: { expectedBalanceMinor: bigint }) => value.expectedBalanceMinor.toString(), lowerBalanceMinor: (value: { lowerBalanceMinor: bigint }) => value.lowerBalanceMinor.toString(), upperBalanceMinor: (value: { upperBalanceMinor: bigint }) => value.upperBalanceMinor.toString(), expectedInflowMinor: (value: { expectedInflowMinor: bigint }) => value.expectedInflowMinor.toString(), expectedOutflowMinor: (value: { expectedOutflowMinor: bigint }) => value.expectedOutflowMinor.toString(), subscriptionMinor: (value: { subscriptionMinor: bigint }) => value.subscriptionMinor.toString(), scenarioMinor: (value: { scenarioMinor: bigint }) => value.scenarioMinor.toString() },
      CashFlowForecast: { generatedAt: (value: { generatedAt: Date }) => value.generatedAt.toISOString() },
      Query: { transactionReviewQueue: (_root, args: { cursor?: string; limit?: number; status?: string }, context: { userId: string }) => transactions.reviewQueue(context.userId, args), financialDashboard: (_root, args: { month: string; currency: string }, context: { userId: string }) => planning.dashboard(context.userId, args), cashFlowForecast: (_root, args: { startingBalanceMinor: string; horizonDays: number; currency: string; incomeAdjustmentBps?: number; expenseAdjustmentBps?: number; events?: Array<{ date: string; amountMinor: string; label: string }> }, context: { userId: string }) => forecasting.generate(context.userId, { startingBalanceMinor: args.startingBalanceMinor, horizonDays: args.horizonDays, currency: args.currency, ...(args.incomeAdjustmentBps !== undefined ? { incomeAdjustmentBps: args.incomeAdjustmentBps } : {}), ...(args.expenseAdjustmentBps !== undefined ? { expenseAdjustmentBps: args.expenseAdjustmentBps } : {}), ...(args.events ? { events: args.events } : {}) }) },
      Mutation: {
        setTransactionCategory: (_root, args: { transactionId: string; categoryId: string; expectedVersion: number }, context: { userId: string }) => transactions.setCategory(context.userId, args),
        resolveDuplicate: (_root, args: { candidateId: string; resolution: "KEEP_BOTH" | "MERGED" | "NOT_DUPLICATE"; canonicalId?: string }, context: { userId: string }) => transactions.resolveDuplicate(context.userId, args),
        suggestTransactionCategory: (_root, args: { transactionId: string }, context: { userId: string }) => categorization.suggest(context.userId, args.transactionId),
        recordCategoryFeedback: (_root, args: { suggestionId: string; accepted: boolean; categoryId?: string; reason?: string }, context: { userId: string }) => categorization.feedback(context.userId, { suggestionId: args.suggestionId, accepted: args.accepted, ...(args.categoryId ? { categoryId: args.categoryId } : {}), ...(args.reason ? { reason: args.reason } : {}) }),
        createBudget: (_root, args: { name: string; month: string; currency: string; totalLimitMinor: string }, context: { userId: string }) => planning.createBudget(context.userId, args),
        createFinancialGoal: (_root, args: { name: string; targetMinor: string; currentMinor?: string; currency: string; targetDate?: string }, context: { userId: string }) => planning.createGoal(context.userId, { name: args.name, targetMinor: args.targetMinor, currency: args.currency, ...(args.currentMinor ? { currentMinor: args.currentMinor } : {}), ...(args.targetDate ? { targetDate: args.targetDate } : {}) }),
        createSubscription: (_root, args: { merchant: string; amountMinor: string; currency: string; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"; nextChargeDate: string }, context: { userId: string }) => planning.createSubscription(context.userId, args),
      },
    },
  });
  return createYoga({ schema, graphqlEndpoint: "/graphql", context: async ({ request }) => ({ userId: (await auth.authenticate(cookie(request, "finance_session"))).id }), maskedErrors: { maskError(error) { if (error instanceof GraphQLError && (error.originalError instanceof TransactionError || error.originalError instanceof CategorizationError || error.originalError instanceof PlanningError || error.originalError instanceof ForecastError)) return new GraphQLError(error.originalError.code); return new GraphQLError("Unexpected error"); } } });
}

import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import type { AuthService } from "../auth/service.js";
import { TransactionError, type TransactionService } from "./service.js";
import { CategorizationError, type CategorizationService } from "../categorization/service.js";

function cookie(request: Request, name: string) { const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined; }

export function createFinanceGraphQL(auth: AuthService, transactions: TransactionService, categorization: CategorizationService) {
  const schema = createSchema({
    typeDefs: `
      type Category { id: ID!, name: String! }
      type Transaction { id: ID!, accountName: String!, postedDate: String!, description: String!, amountMinor: String!, currency: String!, category: Category, categorySource: String!, categoryConfidence: Float, reviewStatus: String!, version: Int!, possibleDuplicateCount: Int! }
      type TransactionConnection { items: [Transaction!]!, nextCursor: String }
      type CategorySuggestion { id: ID!, transactionId: ID!, category: Category, confidence: Float!, explanation: String!, model: String!, promptVersion: String!, status: String! }
      type Query { transactionReviewQueue(cursor: String, limit: Int, status: String): TransactionConnection! }
      type Mutation { setTransactionCategory(transactionId: ID!, categoryId: ID!, expectedVersion: Int!): Transaction!, resolveDuplicate(candidateId: ID!, resolution: String!, canonicalId: ID): Boolean!, suggestTransactionCategory(transactionId: ID!): CategorySuggestion!, recordCategoryFeedback(suggestionId: ID!, accepted: Boolean!, categoryId: ID, reason: String): Boolean! }
    `,
    resolvers: {
      Transaction: { postedDate: (value: { postedDate: Date }) => value.postedDate.toISOString(), amountMinor: (value: { amountMinor: bigint }) => value.amountMinor.toString() },
      Query: { transactionReviewQueue: (_root, args: { cursor?: string; limit?: number; status?: string }, context: { userId: string }) => transactions.reviewQueue(context.userId, args) },
      Mutation: {
        setTransactionCategory: (_root, args: { transactionId: string; categoryId: string; expectedVersion: number }, context: { userId: string }) => transactions.setCategory(context.userId, args),
        resolveDuplicate: (_root, args: { candidateId: string; resolution: "KEEP_BOTH" | "MERGED" | "NOT_DUPLICATE"; canonicalId?: string }, context: { userId: string }) => transactions.resolveDuplicate(context.userId, args),
        suggestTransactionCategory: (_root, args: { transactionId: string }, context: { userId: string }) => categorization.suggest(context.userId, args.transactionId),
        recordCategoryFeedback: (_root, args: { suggestionId: string; accepted: boolean; categoryId?: string; reason?: string }, context: { userId: string }) => categorization.feedback(context.userId, { suggestionId: args.suggestionId, accepted: args.accepted, ...(args.categoryId ? { categoryId: args.categoryId } : {}), ...(args.reason ? { reason: args.reason } : {}) }),
      },
    },
  });
  return createYoga({ schema, graphqlEndpoint: "/graphql", context: async ({ request }) => ({ userId: (await auth.authenticate(cookie(request, "finance_session"))).id }), maskedErrors: { maskError(error) { if (error instanceof GraphQLError && (error.originalError instanceof TransactionError || error.originalError instanceof CategorizationError)) return new GraphQLError(error.originalError.code); return new GraphQLError("Unexpected error"); } } });
}

import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import type { AuthService } from "../auth/service.js";
import { TransactionError, type TransactionService } from "./service.js";

function cookie(request: Request, name: string) { const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined; }

export function createFinanceGraphQL(auth: AuthService, transactions: TransactionService) {
  const schema = createSchema({
    typeDefs: `
      type Category { id: ID!, name: String! }
      type Transaction { id: ID!, accountName: String!, postedDate: String!, description: String!, amountMinor: String!, currency: String!, category: Category, categorySource: String!, categoryConfidence: Float, reviewStatus: String!, version: Int!, possibleDuplicateCount: Int! }
      type TransactionConnection { items: [Transaction!]!, nextCursor: String }
      type Query { transactionReviewQueue(cursor: String, limit: Int, status: String): TransactionConnection! }
      type Mutation { setTransactionCategory(transactionId: ID!, categoryId: ID!, expectedVersion: Int!): Transaction!, resolveDuplicate(candidateId: ID!, resolution: String!, canonicalId: ID): Boolean! }
    `,
    resolvers: {
      Transaction: { postedDate: (value: { postedDate: Date }) => value.postedDate.toISOString(), amountMinor: (value: { amountMinor: bigint }) => value.amountMinor.toString() },
      Query: { transactionReviewQueue: (_root, args: { cursor?: string; limit?: number; status?: string }, context: { userId: string }) => transactions.reviewQueue(context.userId, args) },
      Mutation: {
        setTransactionCategory: (_root, args: { transactionId: string; categoryId: string; expectedVersion: number }, context: { userId: string }) => transactions.setCategory(context.userId, args),
        resolveDuplicate: (_root, args: { candidateId: string; resolution: "KEEP_BOTH" | "MERGED" | "NOT_DUPLICATE"; canonicalId?: string }, context: { userId: string }) => transactions.resolveDuplicate(context.userId, args),
      },
    },
  });
  return createYoga({ schema, graphqlEndpoint: "/graphql", context: async ({ request }) => ({ userId: (await auth.authenticate(cookie(request, "finance_session"))).id }), maskedErrors: { maskError(error) { if (error instanceof GraphQLError && error.originalError instanceof TransactionError) return new Error(error.originalError.code); return new Error("Unexpected error"); } } });
}

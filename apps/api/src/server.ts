import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnvironment } from "./env.js";
import { PrismaAuthRepository } from "./modules/auth/prisma-repository.js";
import { AuthService } from "./modules/auth/service.js";
import { PrismaImportRepository } from "./modules/imports/prisma-repository.js";
import { RedisImportQueue, S3ObjectStorage } from "./modules/imports/adapters.js";
import { ImportService } from "./modules/imports/service.js";
import { createFinanceGraphQL } from "./modules/transactions/graphql.js";
import { PrismaTransactionRepository } from "./modules/transactions/prisma-repository.js";
import { TransactionService } from "./modules/transactions/service.js";
import { GeminiCategoryClient } from "./modules/categorization/gemini.js";
import { PrismaCategorizationRepository } from "./modules/categorization/prisma-repository.js";
import { CategorizationService } from "./modules/categorization/service.js";
import { PrismaPlanningRepository } from "./modules/planning/prisma-repository.js";
import { PlanningService } from "./modules/planning/service.js";
import { PrismaForecastRepository } from "./modules/forecasting/prisma-repository.js";
import { ForecastService } from "./modules/forecasting/service.js";
import { GeminiFinanceAnswerClient } from "./modules/qa/gemini.js";
import { PrismaFinanceQaRepository } from "./modules/qa/prisma-repository.js";
import { FinanceQaService } from "./modules/qa/service.js";

const environment = parseEnvironment(process.env);
const authService = new AuthService(new PrismaAuthRepository(), Buffer.from(environment.PROFILE_ENCRYPTION_KEY, "base64"));
const importService = new ImportService(
  new PrismaImportRepository(),
  new S3ObjectStorage({ endpoint: environment.S3_ENDPOINT, region: environment.S3_REGION, bucket: environment.S3_BUCKET, accessKeyId: environment.S3_ACCESS_KEY, secretAccessKey: environment.S3_SECRET_KEY }),
  new RedisImportQueue(environment.REDIS_URL),
);
const transactionService = new TransactionService(new PrismaTransactionRepository());
const categorizationService = new CategorizationService(new PrismaCategorizationRepository(), new GeminiCategoryClient(environment.GEMINI_API_KEY, environment.GEMINI_MODEL));
const planningService = new PlanningService(new PrismaPlanningRepository());
const forecastService = new ForecastService(new PrismaForecastRepository(), () => new Date(), { record: (event) => console.info(JSON.stringify({ level: "info", ...event })) });
const financeQaService = new FinanceQaService(new PrismaFinanceQaRepository(), new GeminiFinanceAnswerClient(environment.GEMINI_API_KEY, environment.GEMINI_MODEL));
const graphQL = createFinanceGraphQL(authService, transactionService, categorizationService, planningService, forecastService, financeQaService);
serve({ fetch: createApp({ authService, importService, graphqlFetch: (request) => graphQL.fetch(request) }).fetch, port: environment.PORT });
console.info(JSON.stringify({ level: "info", event: "server.started", port: environment.PORT }));

import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnvironment } from "./env.js";
import { PrismaAuthRepository } from "./modules/auth/prisma-repository.js";
import { AuthService } from "./modules/auth/service.js";
import { PrismaImportRepository } from "./modules/imports/prisma-repository.js";
import { RedisImportQueue, S3ObjectStorage } from "./modules/imports/adapters.js";
import { ImportService } from "./modules/imports/service.js";

const environment = parseEnvironment(process.env);
const authService = new AuthService(new PrismaAuthRepository(), Buffer.from(environment.PROFILE_ENCRYPTION_KEY, "base64"));
const importService = new ImportService(
  new PrismaImportRepository(),
  new S3ObjectStorage({ endpoint: environment.S3_ENDPOINT, region: environment.S3_REGION, bucket: environment.S3_BUCKET, accessKeyId: environment.S3_ACCESS_KEY, secretAccessKey: environment.S3_SECRET_KEY }),
  new RedisImportQueue(environment.REDIS_URL),
);
serve({ fetch: createApp({ authService, importService }).fetch, port: environment.PORT });
console.info(JSON.stringify({ level: "info", event: "server.started", port: environment.PORT }));

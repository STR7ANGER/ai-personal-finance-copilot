import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnvironment } from "./env.js";
import { PrismaAuthRepository } from "./modules/auth/prisma-repository.js";
import { AuthService } from "./modules/auth/service.js";

const environment = parseEnvironment(process.env);
const authService = new AuthService(new PrismaAuthRepository(), Buffer.from(environment.PROFILE_ENCRYPTION_KEY, "base64"));
serve({ fetch: createApp({ authService }).fetch, port: environment.PORT });
console.info(JSON.stringify({ level: "info", event: "server.started", port: environment.PORT }));

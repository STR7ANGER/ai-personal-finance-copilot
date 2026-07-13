import { Hono } from "hono";
import { requestId } from "hono/request-id";
import type { AuthService } from "./modules/auth/service.js";
import { createAuthRoutes } from "./modules/auth/routes.js";
import type { ImportService } from "./modules/imports/service.js";
import { createImportRoutes } from "./modules/imports/routes.js";

export function createApp(options: { authService?: AuthService; importService?: ImportService } = {}) {
  const app = new Hono();
  app.use("*", requestId());
  app.get("/health", (context) => context.json({ status: "ok", service: "finance-copilot-api" }));
  if (options.authService) app.route("/v1/auth", createAuthRoutes(options.authService));
  if (options.authService && options.importService) app.route("/v1/imports", createImportRoutes(options.authService, options.importService));
  app.notFound((context) => context.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404));
  return app;
}

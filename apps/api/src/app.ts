import { Hono } from "hono";
import { requestId } from "hono/request-id";
import type { AuthService } from "./modules/auth/service.js";
import { createAuthRoutes } from "./modules/auth/routes.js";

export function createApp(options: { authService?: AuthService } = {}) {
  const app = new Hono();
  app.use("*", requestId());
  app.get("/health", (context) => context.json({ status: "ok", service: "finance-copilot-api" }));
  if (options.authService) app.route("/v1/auth", createAuthRoutes(options.authService));
  app.notFound((context) => context.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404));
  return app;
}

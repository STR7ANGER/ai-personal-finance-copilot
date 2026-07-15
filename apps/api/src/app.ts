import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { AuthService } from "./modules/auth/service.js";
import { createAuthRoutes } from "./modules/auth/routes.js";
import type { ImportService } from "./modules/imports/service.js";
import { createImportRoutes } from "./modules/imports/routes.js";
import type { OperationsService } from "./modules/operations/service.js";
import { createOperationsRoutes } from "./modules/operations/routes.js";
import { MetricsRegistry, routeLabel } from "./infra/metrics.js";
import type { FixedWindowRateLimiter } from "./infra/rate-limit.js";

export function createApp(options: { authService?: AuthService; importService?: ImportService; operationsService?: OperationsService; graphqlFetch?: (request: Request) => Response | Promise<Response>; metrics?: MetricsRegistry; rateLimiter?: FixedWindowRateLimiter; operatorMetricsToken?: string } = {}) {
  const app = new Hono();
  const metrics = options.metrics ?? new MetricsRegistry();
  app.use("*", requestId());
  app.use("*", cors({ origin: process.env.WEB_URL ?? "http://localhost:3000", credentials: true }));
  app.use("*", async (context, next) => { const startedAt = performance.now(); await next(); const route = routeLabel(context.req.path); const durationMs = Math.round(performance.now() - startedAt); metrics.record(context.req.method, route, context.res.status, durationMs); console.info(JSON.stringify({ level: "info", event: "http.request_completed", requestId: context.get("requestId"), method: context.req.method, route, status: context.res.status, durationMs })); });
  if (options.rateLimiter) app.use("*", async (context, next) => { const path = context.req.path; const config = path.startsWith("/v1/auth/") ? { bucket: "auth", limit: 20 } : path.startsWith("/v1/imports/") ? { bucket: "imports", limit: 10 } : path.startsWith("/v1/operations/") ? { bucket: "operations", limit: 10 } : path === "/graphql" ? { bucket: "graphql", limit: 120 } : null; if (!config) return next(); const identity = context.req.header("cookie") ?? context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"; const result = await options.rateLimiter!.consume(identity, config.bucket, config.limit, 60); context.header("x-ratelimit-remaining", String(result.remaining)); if (!result.allowed) { context.header("retry-after", String(result.retryAfter)); return context.json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, 429); } return next(); });
  app.get("/health", (context) => context.json({ status: "ok", service: "finance-copilot-api" }));
  app.get("/internal/metrics", (context) => { if (!options.operatorMetricsToken || context.req.header("authorization") !== `Bearer ${options.operatorMetricsToken}`) return context.json({ error: { code: "FORBIDDEN", message: "Operator access required" } }, 403); context.header("content-type", "text/plain; version=0.0.4"); return context.body(metrics.render()); });
  if (options.authService) app.route("/v1/auth", createAuthRoutes(options.authService));
  if (options.authService && options.importService) app.route("/v1/imports", createImportRoutes(options.authService, options.importService));
  if (options.authService && options.operationsService) app.route("/v1/operations", createOperationsRoutes(options.authService, options.operationsService));
  if (options.graphqlFetch) app.on(["GET", "POST"], "/graphql", (context) => options.graphqlFetch!(context.req.raw));
  app.notFound((context) => context.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404));
  return app;
}

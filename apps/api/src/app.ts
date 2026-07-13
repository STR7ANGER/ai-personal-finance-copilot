import { Hono } from "hono";
import { requestId } from "hono/request-id";

export function createApp() {
  const app = new Hono();
  app.use("*", requestId());
  app.get("/health", (context) => context.json({ status: "ok", service: "finance-copilot-api" }));
  app.notFound((context) => context.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404));
  return app;
}

import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import { z } from "zod";
import type { AuthService } from "../auth/service.js";
import { AuthError } from "../auth/service.js";
import { OperationsError, type OperationsService } from "./service.js";

const privacySchema = z.object({ type: z.enum(["EXPORT", "DELETE"]), confirmation: z.string().max(100) });
const alertSchema = z.object({ type: z.enum(["BUDGET_THRESHOLD", "LOW_BALANCE", "SUBSCRIPTION_DUE"]), currency: z.string(), thresholdMinor: z.string().regex(/^\d+$/).optional() });

export function createOperationsRoutes(auth: AuthService, operations: OperationsService) {
  const routes = new Hono();
  routes.onError((error, context) => { if (error instanceof AuthError) return context.json({ error: { code: error.code, message: "Authentication required" } }, 401); if (error instanceof OperationsError || error instanceof z.ZodError) return context.json({ error: { code: error instanceof OperationsError ? error.code : "VALIDATION_ERROR", message: "Invalid operation" } }, 400); throw error; });
  const user = (context: Parameters<AuthService["authenticate"]>[0]) => auth.authenticate(context);
  routes.get("/exports/transactions.csv", async (context) => { const current = await user(getCookie(context, "finance_session")); const result = await operations.transactionCsv(current.id, { month: context.req.query("month") ?? "", currency: context.req.query("currency") ?? "" }); context.header("content-type", "text/csv; charset=utf-8"); context.header("content-disposition", `attachment; filename="${result.fileName}"`); context.header("x-export-row-count", String(result.rowCount)); return context.body(result.content); });
  routes.post("/privacy/requests", async (context) => { const current = await user(getCookie(context, "finance_session")); return context.json({ request: await operations.requestPrivacy(current.id, privacySchema.parse(await context.req.json())) }, 202); });
  routes.get("/alerts", async (context) => { const current = await user(getCookie(context, "finance_session")); return context.json({ alerts: await operations.alerts(current.id, Number(context.req.query("limit") ?? 50)) }); });
  routes.post("/alerts/rules", async (context) => {
    const current = await user(getCookie(context, "finance_session"));
    const input = alertSchema.parse(await context.req.json());
    const rule = await operations.createAlert(current.id, {
        type: input.type,
        currency: input.currency,
        ...(input.thresholdMinor !== undefined ? { thresholdMinor: input.thresholdMinor } : {}),
    });
    return context.json({ rule: { ...rule, thresholdMinor: rule.thresholdMinor?.toString() ?? null } }, 201);
  });
  return routes;
}

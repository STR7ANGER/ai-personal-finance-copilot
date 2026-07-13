import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { z } from "zod";
import { AuthError, type AuthService } from "./service.js";

const registrationSchema = z.object({ email: z.string().email(), password: z.string().min(12).max(128), displayName: z.string().trim().min(1).max(100) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });

export function createAuthRoutes(service: AuthService) {
  const routes = new Hono();
  routes.onError((error, context) => {
    if (error instanceof AuthError) {
      const status = error.code === "EMAIL_TAKEN" ? 409 : 401;
      return context.json({ error: { code: error.code, message: error.code === "EMAIL_TAKEN" ? "Email is already registered" : "Authentication failed" } }, status);
    }
    if (error instanceof z.ZodError) return context.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request", issues: error.issues } }, 400);
    console.error(JSON.stringify({ level: "error", event: "request.failed", requestId: context.get("requestId"), error: error.name }));
    return context.json({ error: { code: "INTERNAL_ERROR", message: "Unexpected error" } }, 500);
  });
  routes.post("/register", async (context) => context.json(await service.register({ ...registrationSchema.parse(await context.req.json()), requestId: context.get("requestId") }), 201));
  routes.post("/login", async (context) => {
    const result = await service.login({ ...loginSchema.parse(await context.req.json()), requestId: context.get("requestId") });
    setCookie(context, "finance_session", result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax", path: "/", expires: result.expiresAt });
    return context.json({ user: result.user });
  });
  routes.get("/me", async (context) => context.json({ user: await service.authenticate(getCookie(context, "finance_session")) }));
  routes.post("/logout", async (context) => {
    await service.logout(getCookie(context, "finance_session"), context.get("requestId"));
    deleteCookie(context, "finance_session", { path: "/" });
    return context.body(null, 204);
  });
  return routes;
}

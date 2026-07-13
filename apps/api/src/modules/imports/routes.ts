import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import type { AuthService } from "../auth/service.js";
import { AuthError } from "../auth/service.js";
import { ImportError, type ImportService } from "./service.js";

export function createImportRoutes(auth: AuthService, imports: ImportService) {
  const routes = new Hono();
  routes.onError((error, context) => {
    if (error instanceof AuthError) return context.json({ error: { code: error.code, message: "Authentication required" } }, 401);
    if (error instanceof ImportError) {
      const status = error.code === "DUPLICATE_IMPORT" ? 409 : error.code === "IMPORT_FAILED" ? 503 : 400;
      return context.json({ error: { code: error.code, message: error.code.replaceAll("_", " ").toLowerCase() } }, status);
    }
    throw error;
  });
  routes.post("/csv", async (context) => {
    const user = await auth.authenticate(getCookie(context, "finance_session"));
    const body = await context.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) throw new ImportError("INVALID_FILE");
    const record = await imports.start({ userId: user.id, fileName: file.name, contentType: file.type || "text/csv", bytes: new Uint8Array(await file.arrayBuffer()), requestId: context.get("requestId") });
    return context.json({ import: record }, 202);
  });
  return routes;
}

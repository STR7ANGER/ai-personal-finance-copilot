import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/env.js";

describe("foundation", () => {
  it("reports API health", async () => {
    const response = await createApp().request("/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  it("rejects weak secrets", () => {
    expect(() => parseEnvironment({ DATABASE_URL: "postgresql://localhost/test", MONGODB_URI: "mongodb://localhost/test", REDIS_URL: "redis://localhost:6379", SESSION_SECRET: "short", PROFILE_ENCRYPTION_KEY: "short" })).toThrow();
  });
});

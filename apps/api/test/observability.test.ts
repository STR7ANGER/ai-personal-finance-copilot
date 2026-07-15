import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { MetricsRegistry, routeLabel } from "../src/infra/metrics.js";
import { FixedWindowRateLimiter, type RateLimitStore } from "../src/infra/rate-limit.js";

class MemoryRateLimitStore implements RateLimitStore {
  keys: string[] = []; private count = 0;
  async increment(key: string) { this.keys.push(key); return { count: ++this.count, ttl: 60 }; }
}

describe("observability and abuse controls", () => {
  it("hashes rate-limit identities and blocks requests over the window", async () => {
    const store = new MemoryRateLimitStore(); const limiter = new FixedWindowRateLimiter(store);
    await expect(limiter.consume("private-session-cookie", "auth", 1, 60)).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(limiter.consume("private-session-cookie", "auth", 1, 60)).resolves.toMatchObject({ allowed: false, retryAfter: 60 });
    expect(store.keys.every((key) => !key.includes("private-session-cookie"))).toBe(true);
  });

  it("uses bounded route labels and protects operator metrics", async () => {
    expect(routeLabel("/v1/imports/private-id")).toBe("/v1/imports/*");
    expect(routeLabel("/unknown/private-id")).toBe("/other");
    const metrics = new MetricsRegistry();
    const app = createApp({ metrics, operatorMetricsToken: "operator-token-with-at-least-32-chars" });
    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/internal/metrics")).status).toBe(403);
    const response = await app.request("/internal/metrics", { headers: { authorization: "Bearer operator-token-with-at-least-32-chars" } });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('finance_http_requests_total{method="GET",route="/health",status_class="2xx"} 1');
  });
});

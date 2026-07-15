import { expect, test } from "@playwright/test";

test("serves the API health contract without leaking configuration", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:3101/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", service: "finance-copilot-api" });
});

test("presents the product entry point and core capabilities", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Know where your money is going." })).toBeVisible();
  await expect(page.getByRole("region", { name: "Product capabilities" })).toContainText("Review transactions");
});

test("renders a deterministic reviewed-data dashboard", async ({ page }) => {
  await page.route("**/graphql", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { financialDashboard: {
      budgets: [{ id: "budget-1", name: "Monthly plan", totalLimitMinor: "150000", spentMinor: "45000", currency: "USD" }],
      goals: [{ id: "goal-1", name: "Emergency fund", targetMinor: "100000", currentMinor: "25000", currency: "USD", targetDate: "2026-12-31", status: "ACTIVE" }],
      subscriptions: [{ id: "sub-1", merchant: "Music", amountMinor: "999", currency: "USD", cadence: "MONTHLY", nextChargeDate: "2026-07-20" }],
      calculatedAt: "2026-07-15T00:00:00.000Z",
    } } }),
  }));
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Turn plans into progress." })).toBeVisible();
  await expect(page.getByText("Monthly plan")).toBeVisible();
  await expect(page.getByLabel("Monthly plan is 30% used")).toBeVisible();
  await expect(page.getByText("Music")).toBeVisible();
});

test("shows an accessible recovery state when the dashboard API fails", async ({ page }) => {
  await page.route("**/graphql", async (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.goto("/dashboard");
  await expect(page.getByText("Couldn’t load your dashboard. Sign in and retry.")).toBeVisible();
});

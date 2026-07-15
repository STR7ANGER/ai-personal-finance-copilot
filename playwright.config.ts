import { defineConfig, devices } from "@playwright/test";

const apiEnvironment = [
  "NODE_ENV=test",
  "WEB_URL=http://127.0.0.1:3100",
  "API_URL=http://127.0.0.1:3101",
  "PORT=3101",
  "DATABASE_URL=postgresql://finance:finance@127.0.0.1:5432/finance_copilot?schema=public",
  "MONGODB_URI=mongodb://127.0.0.1:27017/finance_copilot",
  "REDIS_URL=redis://127.0.0.1:6379",
  "S3_ENDPOINT=http://127.0.0.1:9000",
  "S3_REGION=us-east-1",
  "S3_BUCKET=finance-imports",
  "S3_ACCESS_KEY=minio",
  "S3_SECRET_KEY=miniosecret",
  "SESSION_SECRET=e2e-session-secret-at-least-32-characters",
  "PROFILE_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
  "GEMINI_API_KEY=",
  "GEMINI_MODEL=gemini-2.5-flash",
  "OPERATOR_METRICS_TOKEN=e2e-operator-token-at-least-32-chars",
].join(" ");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: `${apiEnvironment} npm run dev:api`, url: "http://127.0.0.1:3101/health", reuseExistingServer: !process.env.CI, timeout: 120_000 },
    { command: "NEXT_PUBLIC_API_URL=http://127.0.0.1:3101 npm run dev --workspace @finance-copilot/web -- --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
});

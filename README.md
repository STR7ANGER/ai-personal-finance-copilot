# AI Personal Finance Copilot

Privacy-first transaction imports, budgets, forecasts, subscriptions, goals, and grounded financial answers.

## Local setup

1. Copy `.env.example` to `.env` and replace the example secrets.
2. Run `npm install`.
3. Run `docker compose up -d`.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Run `npm run dev:api` and `npm run dev` in separate terminals.

Use `npm run check` for type checking and tests. Architecture decisions live in `docs/adr`.

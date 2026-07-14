-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionCadence" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "totalLimitMinor" BIGINT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limitMinor" BIGINT NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetMinor" BIGINT NOT NULL,
    "currentMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "targetDate" DATE,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "normalizedMerchant" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "cadence" "SubscriptionCadence" NOT NULL,
    "nextChargeDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Budget_userId_month_idx" ON "Budget"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_month_currency_key" ON "Budget"("userId", "month", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_budgetId_categoryId_key" ON "BudgetAllocation"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "FinancialGoal_userId_status_targetDate_idx" ON "FinancialGoal"("userId", "status", "targetDate");

-- CreateIndex
CREATE INDEX "Subscription_userId_active_nextChargeDate_idx" ON "Subscription"("userId", "active", "nextChargeDate");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_normalizedMerchant_amountMinor_currency_key" ON "Subscription"("userId", "normalizedMerchant", "amountMinor", "currency", "cadence");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

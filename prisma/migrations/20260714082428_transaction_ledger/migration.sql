-- CreateEnum
CREATE TYPE "CategorySource" AS ENUM ('USER', 'USER_RULE', 'MERCHANT_HISTORY', 'PLATFORM_RULE', 'AI', 'UNCATEGORIZED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'REVIEWED', 'POSSIBLE_DUPLICATE');

-- CreateEnum
CREATE TYPE "RuleMatchType" AS ENUM ('DESCRIPTION_EXACT', 'DESCRIPTION_CONTAINS', 'DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "DuplicateResolution" AS ENUM ('PENDING', 'KEEP_BOTH', 'MERGED', 'NOT_DUPLICATE');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'slate',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "importId" TEXT,
    "sourceRowNumber" INTEGER,
    "sourceTransactionId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "postedDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "normalizedDescription" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "fingerprintVersion" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "categorySource" "CategorySource" NOT NULL DEFAULT 'UNCATEGORIZED',
    "categoryConfidence" DOUBLE PRECISION,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "matchType" "RuleMatchType" NOT NULL,
    "pattern" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateCandidate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leftId" TEXT NOT NULL,
    "rightId" TEXT NOT NULL,
    "resolution" "DuplicateResolution" NOT NULL DEFAULT 'PENDING',
    "canonicalId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_name_key" ON "Account"("userId", "name");

-- CreateIndex
CREATE INDEX "Category_userId_active_idx" ON "Category"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_slug_key" ON "Category"("userId", "slug");

-- CreateIndex
CREATE INDEX "Transaction_userId_postedDate_id_idx" ON "Transaction"("userId", "postedDate", "id");

-- CreateIndex
CREATE INDEX "Transaction_userId_reviewStatus_postedDate_idx" ON "Transaction"("userId", "reviewStatus", "postedDate");

-- CreateIndex
CREATE INDEX "Transaction_accountId_fingerprint_idx" ON "Transaction"("accountId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_importId_sourceRowNumber_key" ON "Transaction"("importId", "sourceRowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_accountId_sourceTransactionId_key" ON "Transaction"("accountId", "sourceTransactionId");

-- CreateIndex
CREATE INDEX "CategoryRule_userId_active_priority_idx" ON "CategoryRule"("userId", "active", "priority");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_userId_resolution_createdAt_idx" ON "DuplicateCandidate"("userId", "resolution", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateCandidate_leftId_rightId_key" ON "DuplicateCandidate"("leftId", "rightId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_importId_fkey" FOREIGN KEY ("importId") REFERENCES "StatementImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryRule" ADD CONSTRAINT "CategoryRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryRule" ADD CONSTRAINT "CategoryRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

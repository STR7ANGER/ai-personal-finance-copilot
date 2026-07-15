-- CreateTable
CREATE TABLE "FinanceAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "periodStart" DATE NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "factsHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceCitation" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "factId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "valueMinor" BIGINT,

    CONSTRAINT "FinanceCitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceAnswer_userId_createdAt_idx" ON "FinanceAnswer"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceCitation_answerId_factId_key" ON "FinanceCitation"("answerId", "factId");

-- AddForeignKey
ALTER TABLE "FinanceAnswer" ADD CONSTRAINT "FinanceAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceCitation" ADD CONSTRAINT "FinanceCitation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "FinanceAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

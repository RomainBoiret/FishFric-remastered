-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_hiddenAt_createdAt_idx" ON "LedgerEntry"("accountId", "hiddenAt", "createdAt");

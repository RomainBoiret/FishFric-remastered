-- CreateEnum
CREATE TYPE "MobileDepositStatus" AS ENUM ('PENDING', 'CREDITED', 'REJECTED');

-- CreateTable
CREATE TABLE "MobileDeposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "MobileDepositStatus" NOT NULL DEFAULT 'PENDING',
    "imageLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MobileDeposit_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN "mobileDepositId" TEXT;

-- CreateIndex
CREATE INDEX "MobileDeposit_userId_createdAt_idx" ON "MobileDeposit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MobileDeposit_accountId_status_idx" ON "MobileDeposit"("accountId", "status");

-- CreateIndex
CREATE INDEX "LedgerEntry_mobileDepositId_idx" ON "LedgerEntry"("mobileDepositId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_mobileDepositId_fkey" FOREIGN KEY ("mobileDepositId") REFERENCES "MobileDeposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileDeposit" ADD CONSTRAINT "MobileDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileDeposit" ADD CONSTRAINT "MobileDeposit_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

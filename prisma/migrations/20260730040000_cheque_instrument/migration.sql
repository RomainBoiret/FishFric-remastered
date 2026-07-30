-- CreateEnum
CREATE TYPE "ChequeInstrumentStatus" AS ENUM ('ISSUED', 'CLEARED', 'VOID');

-- CreateTable
CREATE TABLE "ChequeInstrument" (
    "id" TEXT NOT NULL,
    "payeeUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payeeName" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "ChequeInstrumentStatus" NOT NULL DEFAULT 'ISSUED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "ChequeInstrument_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "MobileDeposit" ADD COLUMN "chequeInstrumentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MobileDeposit_chequeInstrumentId_key" ON "MobileDeposit"("chequeInstrumentId");

-- CreateIndex
CREATE INDEX "ChequeInstrument_payeeUserId_status_idx" ON "ChequeInstrument"("payeeUserId", "status");

-- CreateIndex
CREATE INDEX "ChequeInstrument_status_expiresAt_idx" ON "ChequeInstrument"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "MobileDeposit" ADD CONSTRAINT "MobileDeposit_chequeInstrumentId_fkey" FOREIGN KEY ("chequeInstrumentId") REFERENCES "ChequeInstrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChequeInstrument" ADD CONSTRAINT "ChequeInstrument_payeeUserId_fkey" FOREIGN KEY ("payeeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

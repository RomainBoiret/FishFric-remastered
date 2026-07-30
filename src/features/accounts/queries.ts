import { notFound } from "next/navigation";
import { ACCOUNT_HISTORY_RULES } from "@/domain/ledger";
import { pruneAccountLedgerHistory } from "@/features/accounts/history";
import { prisma } from "@/lib/db";

export async function getOwnedAccount(userId: string, accountId: string) {
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId,
      status: "ACTIVE",
    },
  });

  if (!account) notFound();
  return account;
}

/** Visible account history only (hidden rows stay in the ledger for integrity). */
export async function getAccountLedger(accountId: string) {
  await pruneAccountLedgerHistory(prisma, accountId);

  return prisma.ledgerEntry.findMany({
    where: { accountId, hiddenAt: null },
    orderBy: { createdAt: "desc" },
    take: ACCOUNT_HISTORY_RULES.listTake,
  });
}

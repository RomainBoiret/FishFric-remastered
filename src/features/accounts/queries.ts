import { notFound } from "next/navigation";
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

export async function getAccountLedger(accountId: string, take = 50) {
  return prisma.ledgerEntry.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

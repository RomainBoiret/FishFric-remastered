import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { ACCOUNT_HISTORY_RULES } from "@/domain/ledger";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Soft-hide oldest visible ledger rows beyond the per-account cap.
 * Never deletes entries - balances and ledger integrity stay intact.
 */
export async function pruneAccountLedgerHistory(
  db: DbClient,
  accountId: string,
): Promise<number> {
  const overflow = await db.ledgerEntry.findMany({
    where: { accountId, hiddenAt: null },
    orderBy: { createdAt: "desc" },
    skip: ACCOUNT_HISTORY_RULES.maxVisiblePerAccount,
    select: { id: true },
  });

  if (overflow.length === 0) return 0;

  const result = await db.ledgerEntry.updateMany({
    where: { id: { in: overflow.map((row) => row.id) } },
    data: { hiddenAt: new Date() },
  });

  return result.count;
}

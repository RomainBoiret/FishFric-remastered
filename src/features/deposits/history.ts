import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { DEPOSIT_HISTORY_RULES } from "@/domain/deposits";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Drop oldest mobile-deposit history rows beyond the per-user cap.
 * Ledger credits are never reversed - history rows only.
 */
export async function pruneUserMobileDeposits(
  db: DbClient,
  userId: string,
): Promise<number> {
  const overflow = await db.mobileDeposit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: DEPOSIT_HISTORY_RULES.maxPerUser,
    select: { id: true },
  });

  if (overflow.length === 0) return 0;

  const result = await db.mobileDeposit.deleteMany({
    where: { id: { in: overflow.map((row) => row.id) } },
  });

  return result.count;
}

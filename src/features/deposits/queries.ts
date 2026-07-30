import { DEPOSIT_HISTORY_RULES } from "@/domain/deposits";
import { pruneUserMobileDeposits } from "@/features/deposits/history";
import { prisma } from "@/lib/db";

export async function getMobileDepositsForUser(userId: string) {
  await pruneUserMobileDeposits(prisma, userId);

  return prisma.mobileDeposit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: DEPOSIT_HISTORY_RULES.listTake,
    include: {
      account: { select: { label: true, type: true } },
    },
  });
}

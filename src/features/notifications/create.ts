import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { NOTIFICATION_RULES } from "@/domain/notifications";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Drop oldest notifications beyond the per-user cap.
 * Safe with empty results (never uses `notIn: []`).
 */
export async function pruneUserNotifications(
  db: DbClient,
  userId: string,
): Promise<number> {
  const overflow = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: NOTIFICATION_RULES.maxPerUser,
    select: { id: true },
  });

  if (overflow.length === 0) return 0;

  const result = await db.notification.deleteMany({
    where: { id: { in: overflow.map((row) => row.id) } },
  });

  return result.count;
}

export async function createUserNotification(
  db: DbClient,
  data: {
    userId: string;
    title: string;
    body: string;
    p2pTransferId?: string | null;
  },
) {
  const notification = await db.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      body: data.body,
      p2pTransferId: data.p2pTransferId ?? null,
    },
  });

  await pruneUserNotifications(db, data.userId);
  return notification;
}

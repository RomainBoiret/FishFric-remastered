import { NOTIFICATION_RULES } from "@/domain/notifications";
import { pruneUserNotifications } from "@/features/notifications/create";
import { prisma } from "@/lib/db";

export async function getNotificationsForUser(userId: string) {
  await pruneUserNotifications(prisma, userId);

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATION_RULES.listTake,
    include: {
      p2pTransfer: {
        select: { id: true, status: true },
      },
    },
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

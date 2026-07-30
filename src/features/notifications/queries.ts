import { prisma } from "@/lib/db";

export async function getNotificationsForUser(userId: string, take = 40) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
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

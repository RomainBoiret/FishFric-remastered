"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type NotificationActionState = {
  error?: string;
  success?: string;
};

function revalidateNotifications() {
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
}

export async function markNotificationReadAction(
  _prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const id = String(formData.get("notificationId") ?? "");
  if (!id) return { error: "Invalid notification." };

  const result = await prisma.notification.updateMany({
    where: {
      id,
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  if (result.count === 0) {
    return {};
  }

  revalidateNotifications();
  return {};
}

export async function markAllNotificationsReadAction(
  _prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  void formData;
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidateNotifications();

  if (result.count === 0) {
    return { success: "All caught up." };
  }

  return {
    success:
      result.count === 1
        ? "1 notification marked as read."
        : `${result.count} notifications marked as read.`,
  };
}

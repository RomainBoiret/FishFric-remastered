"use server";

import { revalidatePath } from "next/cache";
import { pruneUserNotifications } from "@/features/notifications/create";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type NotificationActionState = {
  error?: string;
  success?: string;
};

function revalidateNotifications() {
  revalidatePath("/app");
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
}

/** Dismiss one alert (delete - keeps the inbox from growing). */
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

  await prisma.notification.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  revalidateNotifications();
  return {};
}

/** Clear the whole inbox for this user. */
export async function clearAllNotificationsAction(
  _prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  void formData;
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const result = await prisma.notification.deleteMany({
    where: { userId: session.user.id },
  });

  revalidateNotifications();

  if (result.count === 0) {
    return { success: "Inbox already empty." };
  }

  return {
    success:
      result.count === 1
        ? "1 notification cleared."
        : `${result.count} notifications cleared.`,
  };
}

/** @deprecated Prefer clearAllNotificationsAction - kept name for the UI button. */
export async function markAllNotificationsReadAction(
  prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  return clearAllNotificationsAction(prev, formData);
}

export async function pruneMyNotificationsAction(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await pruneUserNotifications(prisma, session.user.id);
  revalidateNotifications();
}

"use server";

import { revalidatePath } from "next/cache";
import { resetDemoData } from "@/features/demo/reset-demo-data";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ResetDemoActionState = {
  error?: string;
  success?: string;
};

export async function resetDemoAction(
  _prev: ResetDemoActionState,
  _formData: FormData,
): Promise<ResetDemoActionState> {
  void _formData;
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }
  if (!session.user.isDemo) {
    return { error: "Only demo accounts can reset the shared reef." };
  }

  try {
    await resetDemoData(prisma);
  } catch (error) {
    console.error("demo reset action failed", error);
    return { error: "Could not reset the demo reef. Please try again." };
  }

  revalidatePath("/app");
  revalidatePath("/app", "layout");
  revalidatePath("/app/transfer");
  revalidatePath("/app/p2p");
  revalidatePath("/app/bills");
  revalidatePath("/app/deposit");
  revalidatePath("/app/notifications");
  revalidatePath("/app/accounts/open");

  return {
    success: "Demo reef restored - balances and sample history are fresh.",
  };
}

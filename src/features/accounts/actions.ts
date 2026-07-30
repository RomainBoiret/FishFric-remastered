"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canOpenAccount,
  defaultAccountLabel,
  type AccountType,
} from "@/domain/accounts";
import { ACCOUNT_RULES } from "@/domain/money";
import {
  openAccountSchema,
  type OpenAccountActionState,
} from "@/features/accounts/schemas";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function openAccountAction(
  _prev: OpenAccountActionState,
  formData: FormData,
): Promise<OpenAccountActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const rawLabel = formData.get("label");
  const parsed = openAccountSchema.safeParse({
    type: formData.get("type"),
    label: typeof rawLabel === "string" ? rawLabel : undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid form." };
  }

  const { type, label: customLabel } = parsed.data;
  const userId = session.user.id;

  let accountId: string;

  try {
    accountId = await prisma.$transaction(async (tx) => {
      const accounts = await tx.bankAccount.findMany({
        where: { userId, status: "ACTIVE" },
        select: { type: true },
      });

      const existingTypes = accounts.map((a) => a.type as AccountType);
      const savingsCount = accounts.filter((a) => a.type === "SAVINGS").length;

      const validation = canOpenAccount({
        type,
        existingTypes,
        savingsCount,
      });

      if (!validation.ok) {
        throw new Error(validation.reason ?? "Cannot open this account.");
      }

      const label =
        customLabel ?? defaultAccountLabel(type, savingsCount);

      const account = await tx.bankAccount.create({
        data: {
          userId,
          type,
          label,
          balanceCents: 0,
          interestBps: ACCOUNT_RULES.interestBps[type],
          creditLimitCents:
            type === "CREDIT"
              ? ACCOUNT_RULES.defaultCreditLimitCents
              : null,
        },
      });

      return account.id;
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open account.";
    return { error: message };
  }

  revalidatePath("/app");
  revalidatePath("/app/accounts/open");
  redirect(`/app/accounts/${accountId}`);
}

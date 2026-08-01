"use server";

import { revalidatePath } from "next/cache";
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
import { Prisma } from "@/generated/prisma/client";

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
  let label: string;

  try {
    const created = await prisma.$transaction(
      async (tx) => {
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

        const resolvedLabel =
          customLabel ?? defaultAccountLabel(type, savingsCount);

        const account = await tx.bankAccount.create({
          data: {
            userId,
            type,
            label: resolvedLabel,
            balanceCents: 0,
            interestBps: ACCOUNT_RULES.interestBps[type],
            creditLimitCents:
              type === "CREDIT"
                ? ACCOUNT_RULES.defaultCreditLimitCents
                : null,
          },
        });

        // Re-check after insert so a concurrent open cannot slip past the gate.
        const after = await tx.bankAccount.findMany({
          where: { userId, status: "ACTIVE" },
          select: { type: true },
        });
        const typesAfter = after.map((a) => a.type as AccountType);
        const savingsAfter = after.filter((a) => a.type === "SAVINGS").length;
        const checkingCount = typesAfter.filter((t) => t === "CHECKING").length;
        const creditCount = typesAfter.filter((t) => t === "CREDIT").length;

        if (
          (type === "CHECKING" && checkingCount > 1) ||
          (type === "CREDIT" && creditCount > 1) ||
          (type === "SAVINGS" &&
            savingsAfter > ACCOUNT_RULES.maxSavingsAccounts)
        ) {
          throw new Error(
            validation.reason ?? "Cannot open this account right now.",
          );
        }

        return { id: account.id, label: resolvedLabel };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    accountId = created.id;
    label = created.label;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        error: "Could not open this account right now. Please try again.",
      };
    }
    const message =
      error instanceof Error ? error.message : "Could not open account.";
    return { error: message };
  }

  revalidatePath("/app");
  revalidatePath("/app/accounts/open");
  revalidatePath(`/app/accounts/${accountId}`);

  return {
    success: `${label} opened.`,
    accountId,
  };
}

export type AccountHistoryActionState = {
  error?: string;
  success?: string;
};

function revalidateAccountHistory(accountId: string) {
  revalidatePath("/app");
  revalidatePath(`/app/accounts/${accountId}`);
  revalidatePath("/app", "layout");
}

/** Dismiss one history row (soft-hide - ledger balance stays). */
export async function dismissLedgerEntryAction(
  _prev: AccountHistoryActionState,
  formData: FormData,
): Promise<AccountHistoryActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const entryId = String(formData.get("entryId") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  if (!entryId || !accountId) return { error: "Invalid entry." };

  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!account) return { error: "Account not found." };

  await prisma.ledgerEntry.updateMany({
    where: {
      id: entryId,
      accountId: account.id,
      hiddenAt: null,
    },
    data: { hiddenAt: new Date() },
  });

  revalidateAccountHistory(account.id);
  return {};
}

/** Clear the whole visible history for this account (soft-hide only). */
export async function clearAccountHistoryAction(
  _prev: AccountHistoryActionState,
  formData: FormData,
): Promise<AccountHistoryActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const accountId = String(formData.get("accountId") ?? "");
  if (!accountId) return { error: "Invalid account." };

  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!account) return { error: "Account not found." };

  const result = await prisma.ledgerEntry.updateMany({
    where: {
      accountId: account.id,
      hiddenAt: null,
    },
    data: { hiddenAt: new Date() },
  });

  revalidateAccountHistory(account.id);

  if (result.count === 0) {
    return { success: "History already empty." };
  }

  return {
    success:
      result.count === 1
        ? "1 transaction cleared."
        : `${result.count} transactions cleared.`,
  };
}

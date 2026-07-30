"use server";

import { revalidatePath } from "next/cache";
import {
  isAllowedDepositImage,
  MOBILE_DEPOSIT_RULES,
  validateMobileDeposit,
} from "@/domain/deposits";
import { formatMoney } from "@/domain/money";
import { parseAmountToCents } from "@/domain/transfers";
import {
  creditMobileDepositSchema,
  submitMobileDepositSchema,
  type DepositActionState,
} from "@/features/deposits/schemas";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function revalidateDeposits(accountId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/deposit");
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
  if (accountId) revalidatePath(`/app/accounts/${accountId}`);
}

export async function submitMobileDepositAction(
  _prev: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const parsed = submitMobileDepositSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    useSampleCheck: formData.get("useSampleCheck"),
  });

  if (!parsed.success) {
    return { error: "Invalid form." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Invalid amount (e.g. 120 or 120.50)." };
  }

  const image = formData.get("chequeImage");
  let imageLabel: string | null = null;

  if (parsed.data.useSampleCheck) {
    imageLabel = MOBILE_DEPOSIT_RULES.sampleImageLabel;
  } else if (image instanceof File && image.size > 0) {
    const check = isAllowedDepositImage({
      type: image.type,
      size: image.size,
    });
    if (!check.ok) return { error: check.reason };
    imageLabel = image.name.slice(0, 80) || "cheque-upload";
  } else {
    return {
      error: "Upload a cheque photo or use the sample cheque.",
    };
  }

  const { accountId } = parsed.data;
  const userId = session.user.id;
  let depositId = "";

  try {
    depositId = await prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findFirst({
        where: { id: accountId, userId, status: "ACTIVE" },
      });

      if (!account) throw new Error("Account not found.");

      const validation = validateMobileDeposit({
        account: { id: account.id, type: account.type },
        amountCents,
      });
      if (!validation.ok) throw new Error(validation.reason);

      const deposit = await tx.mobileDeposit.create({
        data: {
          userId,
          accountId: account.id,
          amountCents,
          status: "PENDING",
          imageLabel,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "Mobile deposit pending",
          body: `${formatMoney(amountCents)} is under review (${imageLabel}).`,
        },
      });

      return deposit.id;
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit deposit.";
    return { error: message };
  }

  revalidateDeposits(accountId);

  return {
    success: "Deposit submitted - simulating review…",
    depositId,
    pendingReview: true,
  };
}

export async function creditMobileDepositAction(
  _prev: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const parsed = creditMobileDepositSchema.safeParse({
    depositId: formData.get("depositId"),
  });
  if (!parsed.success) return { error: "Invalid deposit." };

  const userId = session.user.id;
  let accountId = "";
  let amountCents = 0;

  try {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.mobileDeposit.findFirst({
        where: {
          id: parsed.data.depositId,
          userId,
        },
      });

      if (!deposit) throw new Error("Deposit not found.");
      if (deposit.status !== "PENDING") {
        throw new Error("This deposit was already processed.");
      }

      const account = await tx.bankAccount.findFirst({
        where: {
          id: deposit.accountId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!account) throw new Error("Account not found.");

      accountId = account.id;
      amountCents = deposit.amountCents;

      await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          amountCents: deposit.amountCents,
          kind: "MOBILE_DEPOSIT",
          description: `Mobile deposit · ${deposit.imageLabel ?? "cheque"}`,
          mobileDepositId: deposit.id,
        },
      });

      await tx.bankAccount.update({
        where: { id: account.id },
        data: { balanceCents: account.balanceCents + deposit.amountCents },
      });

      await tx.mobileDeposit.update({
        where: { id: deposit.id },
        data: {
          status: "CREDITED",
          resolvedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "Mobile deposit credited",
          body: `${formatMoney(deposit.amountCents)} is now available.`,
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not credit deposit.";
    return { error: message };
  }

  revalidateDeposits(accountId);

  return {
    success: `Deposit credited · ${formatMoney(amountCents)}.`,
  };
}

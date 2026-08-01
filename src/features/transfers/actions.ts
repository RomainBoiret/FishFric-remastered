"use server";

import { revalidatePath } from "next/cache";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import {
  parseAmountToCents,
  validateInternalTransfer,
} from "@/domain/transfers";
import { auth } from "@/lib/auth";
import { applyBalanceDelta } from "@/lib/account-balance";
import { prisma } from "@/lib/db";
import { pruneAccountLedgerHistory } from "@/features/accounts/history";
import {
  internalTransferSchema,
  type TransferActionState,
} from "@/features/transfers/schemas";

export async function transferInternalAction(
  _prev: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const parsed = internalTransferSchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: "Invalid form." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Invalid amount (e.g. 50 or 50.25)." };
  }

  const { fromAccountId, toAccountId } = parsed.data;
  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const ids = [fromAccountId, toAccountId].sort();
      const accounts = await tx.bankAccount.findMany({
        where: {
          id: { in: ids },
          userId,
          status: "ACTIVE",
        },
      });

      const from = accounts.find((a) => a.id === fromAccountId);
      const to = accounts.find((a) => a.id === toAccountId);

      if (!from || !to) {
        throw new Error("Account not found.");
      }

      const validation = validateInternalTransfer({
        from: {
          id: from.id,
          type: from.type,
          balanceCents: from.balanceCents,
          creditLimitCents: from.creditLimitCents,
          label: from.label,
        },
        to: {
          id: to.id,
          type: to.type,
          balanceCents: to.balanceCents,
          creditLimitCents: to.creditLimitCents,
          label: to.label,
        },
        amountCents,
      });

      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      const transferGroupId = crypto.randomUUID();
      const fromLabel = from.label ?? ACCOUNT_TYPE_LABELS[from.type];
      const toLabel = to.label ?? ACCOUNT_TYPE_LABELS[to.type];

      await tx.ledgerEntry.create({
        data: {
          accountId: from.id,
          amountCents: -amountCents,
          kind: "TRANSFER_INTERNAL",
          description: `To ${toLabel}`,
          transferGroupId,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: to.id,
          amountCents,
          kind: "TRANSFER_INTERNAL",
          description: `From ${fromLabel}`,
          transferGroupId,
        },
      });

      await pruneAccountLedgerHistory(tx, from.id);
      await pruneAccountLedgerHistory(tx, to.id);

      await applyBalanceDelta(tx, {
        accountId: from.id,
        expectedBalanceCents: from.balanceCents,
        deltaCents: -amountCents,
      });

      await applyBalanceDelta(tx, {
        accountId: to.id,
        expectedBalanceCents: to.balanceCents,
        deltaCents: amountCents,
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transfer failed.";
    return { error: message };
  }

  revalidatePath("/app");
  revalidatePath("/app/transfer");
  revalidatePath(`/app/accounts/${fromAccountId}`);
  revalidatePath(`/app/accounts/${toAccountId}`);

  return { success: "Transfer completed." };
}

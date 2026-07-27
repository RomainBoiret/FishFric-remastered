"use server";

import { revalidatePath } from "next/cache";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import {
  parseAmountToCents,
  validateInternalTransfer,
} from "@/domain/transfers";
import {
  internalTransferSchema,
  type TransferActionState,
} from "@/features/transfers/schemas";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function transferInternalAction(
  _prev: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expirée. Reconnecte-toi." };
  }

  const parsed = internalTransferSchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: "Formulaire invalide." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Montant invalide (ex. 50 ou 50.25)." };
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
        throw new Error("Compte introuvable.");
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
          description: `Vers ${toLabel}`,
          transferGroupId,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: to.id,
          amountCents,
          kind: "TRANSFER_INTERNAL",
          description: `Depuis ${fromLabel}`,
          transferGroupId,
        },
      });

      await tx.bankAccount.update({
        where: { id: from.id },
        data: { balanceCents: from.balanceCents - amountCents },
      });

      await tx.bankAccount.update({
        where: { id: to.id },
        data: { balanceCents: to.balanceCents + amountCents },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transfert impossible.";
    return { error: message };
  }

  revalidatePath("/app");
  revalidatePath("/app/transfert");
  revalidatePath(`/app/comptes/${fromAccountId}`);
  revalidatePath(`/app/comptes/${toAccountId}`);

  return { success: "Transfert effectué." };
}

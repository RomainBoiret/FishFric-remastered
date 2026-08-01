"use server";

import { revalidatePath } from "next/cache";
import { validateBillPayment } from "@/domain/bills";
import { formatMoney } from "@/domain/money";
import { parseAmountToCents } from "@/domain/transfers";
import {
  billPaymentSchema,
  type BillPayActionState,
} from "@/features/bills/schemas";
import { createUserNotification } from "@/features/notifications/create";
import { pruneAccountLedgerHistory } from "@/features/accounts/history";
import { applyBalanceDelta } from "@/lib/account-balance";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function payBillAction(
  _prev: BillPayActionState,
  formData: FormData,
): Promise<BillPayActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const rawMemo = formData.get("memo");
  const parsed = billPaymentSchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    payeeId: formData.get("payeeId"),
    amount: formData.get("amount"),
    memo: typeof rawMemo === "string" ? rawMemo : undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid form." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Invalid amount (e.g. 75 or 75.50)." };
  }

  const { fromAccountId, payeeId, memo } = parsed.data;
  const userId = session.user.id;
  let payeeName = "";

  try {
    await prisma.$transaction(async (tx) => {
      const from = await tx.bankAccount.findFirst({
        where: {
          id: fromAccountId,
          userId,
          status: "ACTIVE",
        },
      });

      if (!from) {
        throw new Error("Account not found.");
      }

      const validation = validateBillPayment({
        from: {
          id: from.id,
          type: from.type,
          balanceCents: from.balanceCents,
          creditLimitCents: from.creditLimitCents,
        },
        payeeId,
        amountCents,
      });

      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      payeeName = validation.payeeName;
      const description = memo
        ? `Bill · ${payeeName} · ${memo}`
        : `Bill · ${payeeName}`;

      await tx.ledgerEntry.create({
        data: {
          accountId: from.id,
          amountCents: -amountCents,
          kind: "BILL_PAYMENT",
          description,
        },
      });

      await pruneAccountLedgerHistory(tx, from.id);

      await applyBalanceDelta(tx, {
        accountId: from.id,
        expectedBalanceCents: from.balanceCents,
        deltaCents: -amountCents,
      });

      await createUserNotification(tx, {
        userId,
        title: "Bill payment sent",
        body: `Paid ${formatMoney(amountCents)} to ${payeeName}.`,
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bill payment failed.";
    return { error: message };
  }

  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
  revalidatePath(`/app/accounts/${fromAccountId}`);

  return {
    success: `Paid ${formatMoney(amountCents)} to ${payeeName}.`,
  };
}

"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { ACCOUNT_RULES, formatMoney } from "@/domain/money";
import {
  canSendP2PFrom,
  isP2PExpired,
  normalizeP2PAnswer,
  p2pExpiresAt,
} from "@/domain/p2p";
import { parseAmountToCents } from "@/domain/transfers";
import { createUserNotification } from "@/features/notifications/create";
import { pruneAccountLedgerHistory } from "@/features/accounts/history";
import {
  acceptP2PSchema,
  createP2PSchema,
  rejectP2PSchema,
  type P2PActionState,
} from "@/features/p2p/schemas";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function revalidateP2P(extra: string[] = []) {
  revalidatePath("/app");
  revalidatePath("/app/p2p");
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
  for (const path of extra) revalidatePath(path);
}

export async function createP2PAction(
  _prev: P2PActionState,
  formData: FormData,
): Promise<P2PActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expired." };

  const parsed = createP2PSchema.safeParse({
    sourceAccountId: formData.get("sourceAccountId"),
    recipientEmail: formData.get("recipientEmail"),
    amount: formData.get("amount"),
    question: formData.get("question"),
    answer: formData.get("answer"),
  });

  if (!parsed.success) {
    return { error: "Invalid form - please check the fields." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Invalid amount (e.g. 40 or 40.50)." };
  }

  const email = parsed.data.recipientEmail;
  if (email === session.user.email?.toLowerCase()) {
    return { error: "You cannot send a P2P transfer to yourself." };
  }

  const answerHash = await bcrypt.hash(
    normalizeP2PAnswer(parsed.data.answer),
    12,
  );

  try {
    await prisma.$transaction(async (tx) => {
      const source = await tx.bankAccount.findFirst({
        where: {
          id: parsed.data.sourceAccountId,
          userId: session.user.id,
          status: "ACTIVE",
        },
      });

      if (!source || !canSendP2PFrom(source.type)) {
        throw new Error("Invalid source account.");
      }

      if (source.balanceCents < amountCents) {
        throw new Error("Insufficient funds.");
      }

      const recipient = await tx.user.findUnique({ where: { email } });

      const p2p = await tx.p2PTransfer.create({
        data: {
          senderUserId: session.user.id,
          recipientEmail: email,
          recipientUserId: recipient?.id ?? null,
          sourceAccountId: source.id,
          amountCents,
          question: parsed.data.question.trim(),
          answerHash,
          status: "PENDING",
          expiresAt: p2pExpiresAt(),
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: source.id,
          amountCents: -amountCents,
          kind: "TRANSFER_P2P",
          description: `P2P to ${email} (pending)`,
          p2pTransferId: p2p.id,
        },
      });

      await pruneAccountLedgerHistory(tx, source.id);

      await tx.bankAccount.update({
        where: { id: source.id },
        data: { balanceCents: source.balanceCents - amountCents },
      });

      if (recipient) {
        await createUserNotification(tx, {
          userId: recipient.id,
          title: "P2P transfer received",
          body: `${session.user.name ?? "Someone"} sent you ${formatMoney(amountCents)}.`,
          p2pTransferId: p2p.id,
        });
      }
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not send transfer.",
    };
  }

  revalidateP2P([`/app/accounts/${parsed.data.sourceAccountId}`]);
  return { success: "Transfer sent - waiting for a reply." };
}

export async function acceptP2PAction(
  _prev: P2PActionState,
  formData: FormData,
): Promise<P2PActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expired." };

  const parsed = acceptP2PSchema.safeParse({
    p2pId: formData.get("p2pId"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) return { error: "Invalid form." };

  const userEmail = session.user.email?.toLowerCase();
  if (!userEmail) return { error: "Invalid session." };

  try {
    await prisma.$transaction(async (tx) => {
      const p2p = await tx.p2PTransfer.findUnique({
        where: { id: parsed.data.p2pId },
        include: {
          senderUser: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (!p2p || p2p.status !== "PENDING") {
        throw new Error("Transfer not found or already processed.");
      }

      if (p2p.recipientEmail !== userEmail) {
        throw new Error("This transfer is not for you.");
      }

      if (isP2PExpired(p2p.expiresAt)) {
        throw new Error("This transfer has expired.");
      }

      const ok = await bcrypt.compare(
        normalizeP2PAnswer(parsed.data.answer),
        p2p.answerHash,
      );
      if (!ok) {
        throw new Error("Incorrect answer.");
      }

      let checking = await tx.bankAccount.findFirst({
        where: {
          userId: session.user.id,
          type: "CHECKING",
          status: "ACTIVE",
        },
      });

      if (!checking) {
        checking = await tx.bankAccount.create({
          data: {
            userId: session.user.id,
            type: "CHECKING",
            label: "Checking account",
            balanceCents: 0,
            interestBps: ACCOUNT_RULES.interestBps.CHECKING,
          },
        });
      }

      const senderName = `${p2p.senderUser.firstName} ${p2p.senderUser.lastName}`;

      await tx.ledgerEntry.create({
        data: {
          accountId: checking.id,
          amountCents: p2p.amountCents,
          kind: "TRANSFER_P2P",
          description: `P2P received from ${senderName}`,
          p2pTransferId: p2p.id,
        },
      });

      await pruneAccountLedgerHistory(tx, checking.id);

      await tx.bankAccount.update({
        where: { id: checking.id },
        data: { balanceCents: checking.balanceCents + p2p.amountCents },
      });

      await tx.p2PTransfer.update({
        where: { id: p2p.id },
        data: {
          status: "ACCEPTED",
          resolvedAt: new Date(),
          recipientUserId: session.user.id,
        },
      });

      await tx.ledgerEntry.updateMany({
        where: {
          p2pTransferId: p2p.id,
          accountId: p2p.sourceAccountId,
          amountCents: { lt: 0 },
        },
        data: {
          description: `P2P to ${userEmail} (accepted)`,
        },
      });

      await createUserNotification(tx, {
        userId: p2p.senderUserId,
        title: "P2P accepted",
        body: `${session.user.name ?? "The recipient"} accepted your ${formatMoney(p2p.amountCents)} transfer.`,
        p2pTransferId: p2p.id,
      });
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not accept transfer.",
    };
  }

  revalidateP2P();
  return { success: "Funds received in your checking account." };
}

export async function rejectP2PAction(
  _prev: P2PActionState,
  formData: FormData,
): Promise<P2PActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expired." };

  const parsed = rejectP2PSchema.safeParse({
    p2pId: formData.get("p2pId"),
  });
  if (!parsed.success) return { error: "Invalid form." };

  const userEmail = session.user.email?.toLowerCase();
  if (!userEmail) return { error: "Invalid session." };

  try {
    await prisma.$transaction(async (tx) => {
      const p2p = await tx.p2PTransfer.findUnique({
        where: { id: parsed.data.p2pId },
      });

      if (!p2p || p2p.status !== "PENDING") {
        throw new Error("Transfer not found or already processed.");
      }

      if (p2p.recipientEmail !== userEmail) {
        throw new Error("This transfer is not for you.");
      }

      const source = await tx.bankAccount.findUnique({
        where: { id: p2p.sourceAccountId },
      });
      if (!source) throw new Error("Source account not found.");

      await tx.ledgerEntry.create({
        data: {
          accountId: source.id,
          amountCents: p2p.amountCents,
          kind: "TRANSFER_P2P",
          description: `P2P to ${p2p.recipientEmail} (declined - refund)`,
          p2pTransferId: p2p.id,
        },
      });

      await pruneAccountLedgerHistory(tx, source.id);

      await tx.bankAccount.update({
        where: { id: source.id },
        data: { balanceCents: source.balanceCents + p2p.amountCents },
      });

      await tx.p2PTransfer.update({
        where: { id: p2p.id },
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
          recipientUserId: session.user.id,
        },
      });

      await createUserNotification(tx, {
        userId: p2p.senderUserId,
        title: "P2P declined",
        body: `Your ${formatMoney(p2p.amountCents)} transfer was declined. Funds returned.`,
        p2pTransferId: p2p.id,
      });
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not decline transfer.",
    };
  }

  revalidateP2P();
  return { success: "Transfer declined." };
}

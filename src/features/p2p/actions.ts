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
  for (const path of extra) revalidatePath(path);
}

export async function createP2PAction(
  _prev: P2PActionState,
  formData: FormData,
): Promise<P2PActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };

  const parsed = createP2PSchema.safeParse({
    sourceAccountId: formData.get("sourceAccountId"),
    recipientEmail: formData.get("recipientEmail"),
    amount: formData.get("amount"),
    question: formData.get("question"),
    answer: formData.get("answer"),
  });

  if (!parsed.success) {
    return { error: "Formulaire invalide — vérifie les champs." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Montant invalide (ex. 40 ou 40.50)." };
  }

  const email = parsed.data.recipientEmail;
  if (email === session.user.email?.toLowerCase()) {
    return { error: "Tu ne peux pas t'envoyer un P2P à toi-même." };
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
        throw new Error("Compte source invalide.");
      }

      if (source.balanceCents < amountCents) {
        throw new Error("Fonds insuffisants.");
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
          description: `P2P vers ${email} (en attente)`,
          p2pTransferId: p2p.id,
        },
      });

      await tx.bankAccount.update({
        where: { id: source.id },
        data: { balanceCents: source.balanceCents - amountCents },
      });

      if (recipient) {
        await tx.notification.create({
          data: {
            userId: recipient.id,
            title: "Transfert P2P reçu",
            body: `${session.user.name ?? "Quelqu'un"} t'envoie ${formatMoney(amountCents)}.`,
            p2pTransferId: p2p.id,
          },
        });
      }
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Envoi impossible.",
    };
  }

  revalidateP2P([`/app/comptes/${parsed.data.sourceAccountId}`]);
  return { success: "Transfert envoyé — en attente de réponse." };
}

export async function acceptP2PAction(
  _prev: P2PActionState,
  formData: FormData,
): Promise<P2PActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };

  const parsed = acceptP2PSchema.safeParse({
    p2pId: formData.get("p2pId"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) return { error: "Formulaire invalide." };

  const userEmail = session.user.email?.toLowerCase();
  if (!userEmail) return { error: "Session invalide." };

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
        throw new Error("Transfert introuvable ou déjà traité.");
      }

      if (p2p.recipientEmail !== userEmail) {
        throw new Error("Ce transfert ne t'est pas destiné.");
      }

      if (isP2PExpired(p2p.expiresAt)) {
        throw new Error("Ce transfert a expiré.");
      }

      const ok = await bcrypt.compare(
        normalizeP2PAnswer(parsed.data.answer),
        p2p.answerHash,
      );
      if (!ok) {
        throw new Error("Réponse incorrecte.");
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
            label: "Compte chèque",
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
          description: `P2P reçu de ${senderName}`,
          p2pTransferId: p2p.id,
        },
      });

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
          description: `P2P vers ${userEmail} (accepté)`,
        },
      });

      await tx.notification.create({
        data: {
          userId: p2p.senderUserId,
          title: "P2P accepté",
          body: `${session.user.name ?? "Le destinataire"} a accepté ton transfert de ${formatMoney(p2p.amountCents)}.`,
          p2pTransferId: p2p.id,
        },
      });
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Acceptation impossible.",
    };
  }

  revalidateP2P();
  return { success: "Fonds reçus sur ton compte chèque." };
}

export async function rejectP2PAction(
  _prev: P2PActionState,
  formData: FormData,
): Promise<P2PActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };

  const parsed = rejectP2PSchema.safeParse({
    p2pId: formData.get("p2pId"),
  });
  if (!parsed.success) return { error: "Formulaire invalide." };

  const userEmail = session.user.email?.toLowerCase();
  if (!userEmail) return { error: "Session invalide." };

  try {
    await prisma.$transaction(async (tx) => {
      const p2p = await tx.p2PTransfer.findUnique({
        where: { id: parsed.data.p2pId },
      });

      if (!p2p || p2p.status !== "PENDING") {
        throw new Error("Transfert introuvable ou déjà traité.");
      }

      if (p2p.recipientEmail !== userEmail) {
        throw new Error("Ce transfert ne t'est pas destiné.");
      }

      const source = await tx.bankAccount.findUnique({
        where: { id: p2p.sourceAccountId },
      });
      if (!source) throw new Error("Compte source introuvable.");

      await tx.ledgerEntry.create({
        data: {
          accountId: source.id,
          amountCents: p2p.amountCents,
          kind: "TRANSFER_P2P",
          description: `P2P vers ${p2p.recipientEmail} (refusé — remboursement)`,
          p2pTransferId: p2p.id,
        },
      });

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

      await tx.notification.create({
        data: {
          userId: p2p.senderUserId,
          title: "P2P refusé",
          body: `Ton transfert de ${formatMoney(p2p.amountCents)} a été refusé. Fonds remis.`,
          p2pTransferId: p2p.id,
        },
      });
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Refus impossible.",
    };
  }

  revalidateP2P();
  return { success: "Transfert refusé." };
}

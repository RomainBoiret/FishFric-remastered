"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  CHEQUE_SECURITY,
  evaluateChequeForDeposit,
  getChequeHmacSecret,
  signChequePayload,
} from "@/domain/cheque-security";
import {
  buildDemoChequeSvg,
  demoChequeFileName,
  extractChequeSecurityFromSvg,
  isFishFricDemoChequeSvg,
} from "@/domain/cheque-svg";
import {
  isAllowedDepositImage,
  validateGeneratedChequeAmount,
  validateMobileDeposit,
} from "@/domain/deposits";
import { formatMoney } from "@/domain/money";
import { parseAmountToCents } from "@/domain/transfers";
import {
  creditMobileDepositSchema,
  issueDemoChequeSchema,
  submitMobileDepositSchema,
  type DepositActionState,
  type IssueChequeActionState,
} from "@/features/deposits/schemas";
import { createUserNotification } from "@/features/notifications/create";
import { pruneUserMobileDeposits } from "@/features/deposits/history";
import { pruneAccountLedgerHistory } from "@/features/accounts/history";
import {
  applyBalanceDelta,
  claimPendingDeposit,
} from "@/lib/account-balance";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function newChequeId(): string {
  return `c${randomBytes(16).toString("hex")}`;
}

function revalidateDeposits(accountId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/deposit");
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
  if (accountId) revalidatePath(`/app/accounts/${accountId}`);
}

/** Persist a failed attempt in history and surface the reason (toast). */
async function rejectMobileDeposit(input: {
  userId: string;
  accountId: string;
  amountCents: number;
  imageLabel: string | null;
  reason: string;
}): Promise<DepositActionState> {
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: input.accountId,
      userId: input.userId,
      status: "ACTIVE",
    },
  });

  if (!account) {
    return { error: "Account not found." };
  }

  await prisma.mobileDeposit.create({
    data: {
      userId: input.userId,
      accountId: account.id,
      amountCents: input.amountCents,
      status: "REJECTED",
      imageLabel: input.imageLabel,
      resolvedAt: new Date(),
    },
  });

  await pruneUserMobileDeposits(prisma, input.userId);

  revalidateDeposits(account.id);
  return { error: input.reason };
}

async function loadAndEvaluateCheque(input: {
  chequeId: string;
  depositAmountCents: number;
  depositorUserId: string;
  presentedSignature?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const instrument = await prisma.chequeInstrument.findUnique({
    where: { id: input.chequeId },
  });

  if (!instrument) {
    return {
      ok: false,
      reason: "Unknown cheque ID. Issue a signed cheque from Fish&Fric first.",
    };
  }

  let secret: string | null = null;
  try {
    secret = getChequeHmacSecret();
  } catch {
    secret = null;
  }

  return evaluateChequeForDeposit({
    instrument: {
      id: instrument.id,
      amountCents: instrument.amountCents,
      payeeUserId: instrument.payeeUserId,
      signature: instrument.signature,
      status: instrument.status,
      expiresAt: instrument.expiresAt,
    },
    depositAmountCents: input.depositAmountCents,
    depositorUserId: input.depositorUserId,
    presentedSignature: input.presentedSignature,
    hmacSecret: secret,
  });
}

/** Server-issued, HMAC-signed, payee-bound demo cheque (downloadable SVG). */
export async function issueDemoChequeAction(
  _prev: IssueChequeActionState,
  formData: FormData,
): Promise<IssueChequeActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const parsed = issueDemoChequeSchema.safeParse({
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: "Invalid amount." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Invalid amount (e.g. 120 or 120.50)." };
  }

  if (
    amountCents < 100 ||
    amountCents > 500_000
  ) {
    return { error: "Amount must be between $1.00 and $5,000.00." };
  }

  const payeeUserId = session.user.id;
  const payeeName = session.user.name?.trim() || "Fish&Fric customer";
  const chequeId = newChequeId();
  const expiresAtMs = Date.now() + CHEQUE_SECURITY.ttlMs;

  let signature: string;
  try {
    signature = signChequePayload(
      {
        chequeId,
        amountCents,
        payeeUserId,
        expiresAtMs,
      },
      getChequeHmacSecret(),
    );
  } catch {
    return { error: "Cheque signing is not configured (missing AUTH_SECRET)." };
  }

  await prisma.chequeInstrument.create({
    data: {
      id: chequeId,
      payeeUserId,
      amountCents,
      payeeName,
      signature,
      status: "ISSUED",
      expiresAt: new Date(expiresAtMs),
    },
  });

  const fileName = demoChequeFileName(amountCents, chequeId);
  const svg = buildDemoChequeSvg({
    amountCents,
    payeeName,
    memo: "Cheque deposit · fictional",
    chequeId,
    payeeUserId,
    signature,
    expiresAtMs,
  });

  return {
    success: "Signed cheque issued - downloading to your PC.",
    chequeId,
    amountCents,
    fileName,
    svg,
  };
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
    depositMode: formData.get("depositMode"),
    chequeAmount: formData.get("chequeAmount") || undefined,
    chequeFileName: formData.get("chequeFileName") || undefined,
    chequeId: formData.get("chequeId") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid form." };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  if (amountCents == null) {
    return { error: "Invalid amount (e.g. 120 or 120.50)." };
  }

  const { accountId } = parsed.data;
  const userId = session.user.id;

  const reject = (reason: string, imageLabel: string | null = null) =>
    rejectMobileDeposit({
      userId,
      accountId,
      amountCents,
      imageLabel,
      reason,
    });

  let imageLabel: string | null = null;
  let chequeInstrumentId: string | null = null;

  if (parsed.data.depositMode === "generated") {
    const chequeId = parsed.data.chequeId?.trim();
    if (!chequeId) {
      return reject(
        "Issue and download a signed cheque before submitting.",
      );
    }

    const chequeAmountCents = parseAmountToCents(
      parsed.data.chequeAmount ?? "",
    );
    if (chequeAmountCents == null) {
      return reject(
        "Issue and download a signed cheque before submitting.",
      );
    }

    const chequeFileName =
      parsed.data.chequeFileName?.trim() ||
      demoChequeFileName(amountCents, chequeId);

    const match = validateGeneratedChequeAmount({
      amountCents,
      chequeAmountCents,
      chequeFileName,
      chequeId,
    });
    if (!match.ok) return reject(match.reason, chequeFileName);

    const evaluation = await loadAndEvaluateCheque({
      chequeId,
      depositAmountCents: amountCents,
      depositorUserId: userId,
    });
    if (!evaluation.ok) return reject(evaluation.reason, chequeFileName);

    imageLabel = chequeFileName;
    chequeInstrumentId = chequeId;
  } else {
    const image = formData.get("chequeImage");
    if (!(image instanceof File) || image.size <= 0) {
      return reject("Upload a cheque photo or issue a demo cheque.");
    }
    const check = isAllowedDepositImage({
      type: image.type,
      size: image.size,
    });
    if (!check.ok) {
      return reject(check.reason, image.name.slice(0, 80) || null);
    }

    const fileName = image.name.slice(0, 80) || "cheque-upload";
    const isSvg =
      image.type === "image/svg+xml" ||
      fileName.toLowerCase().endsWith(".svg");

    let svgText: string | null = null;
    if (isSvg) {
      svgText = await image.text();
    }

    const looksLikeDemoCheque =
      svgText != null && isFishFricDemoChequeSvg(svgText);

    if (looksLikeDemoCheque && svgText) {
      const security = extractChequeSecurityFromSvg(svgText);
      if (!security) {
        return reject(
          "This Fish&Fric cheque is unsigned or incomplete. Issue a new signed cheque.",
          fileName,
        );
      }

      const faceAmountCents = security.amountCents;

      if (faceAmountCents !== amountCents) {
        return reject(
          `Cheque face is $${(faceAmountCents / 100).toFixed(2)} but deposit amount is $${(amountCents / 100).toFixed(2)}.`,
          fileName,
        );
      }

      const evaluation = await loadAndEvaluateCheque({
        chequeId: security.chequeId,
        depositAmountCents: amountCents,
        depositorUserId: userId,
        presentedSignature: security.signature,
      });
      if (!evaluation.ok) return reject(evaluation.reason, fileName);

      imageLabel = fileName;
      chequeInstrumentId = security.chequeId;
    } else {
      // Plain photo upload (no Fish&Fric instrument) - demo soft path.
      imageLabel = fileName;
    }
  }

  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, userId, status: "ACTIVE" },
  });
  if (!account) {
    return { error: "Account not found." };
  }

  const validation = validateMobileDeposit({
    account: { id: account.id, type: account.type },
    amountCents,
  });
  if (!validation.ok) {
    return reject(validation.reason, imageLabel);
  }

  let depositId = "";

  try {
    depositId = await prisma.$transaction(async (tx) => {
      if (chequeInstrumentId) {
        const cleared = await tx.chequeInstrument.updateMany({
          where: {
            id: chequeInstrumentId,
            status: "ISSUED",
            payeeUserId: userId,
            amountCents,
            expiresAt: { gt: new Date() },
          },
          data: {
            status: "CLEARED",
            clearedAt: new Date(),
          },
        });

        if (cleared.count !== 1) {
          throw new Error(
            "This cheque was already cashed or is no longer valid.",
          );
        }
      }

      const deposit = await tx.mobileDeposit.create({
        data: {
          userId,
          accountId: account.id,
          amountCents,
          status: "PENDING",
          imageLabel,
          chequeInstrumentId,
        },
      });

      await createUserNotification(tx, {
        userId,
        title: "Cheque deposit pending",
        body: `${formatMoney(amountCents)} is under review (${imageLabel}).`,
      });

      await pruneUserMobileDeposits(tx, userId);

      return deposit.id;
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit deposit.";
    if (
      message.includes("already cashed") ||
      message.includes("no longer valid")
    ) {
      return reject(message, imageLabel);
    }
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
      await claimPendingDeposit(tx, {
        depositId: parsed.data.depositId,
        userId,
      });

      const deposit = await tx.mobileDeposit.findFirst({
        where: {
          id: parsed.data.depositId,
          userId,
        },
      });

      if (!deposit) throw new Error("Deposit not found.");

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
          description: `Cheque deposit · ${deposit.imageLabel ?? "cheque"}`,
          mobileDepositId: deposit.id,
        },
      });

      await pruneAccountLedgerHistory(tx, account.id);

      await applyBalanceDelta(tx, {
        accountId: account.id,
        expectedBalanceCents: account.balanceCents,
        deltaCents: deposit.amountCents,
      });

      await createUserNotification(tx, {
        userId,
        title: "Cheque deposit credited",
        body: `${formatMoney(deposit.amountCents)} is now available.`,
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

export type ClearDepositsActionState = {
  error?: string;
  success?: string;
};

/** Dismiss one history row (delete - keeps the list from growing). */
export async function dismissMobileDepositAction(
  _prev: ClearDepositsActionState,
  formData: FormData,
): Promise<ClearDepositsActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const id = String(formData.get("depositId") ?? "");
  if (!id) return { error: "Invalid deposit." };

  await prisma.mobileDeposit.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  revalidateDeposits();
  return {};
}

/** Clear the whole deposit history for this user (ledger balances stay). */
export async function clearMobileDepositHistoryAction(
  _prev: ClearDepositsActionState,
  _formData: FormData,
): Promise<ClearDepositsActionState> {
  void _formData;
  const session = await auth();
  if (!session?.user) {
    return { error: "Session expired. Please sign in again." };
  }

  const result = await prisma.mobileDeposit.deleteMany({
    where: { userId: session.user.id },
  });

  revalidateDeposits();

  if (result.count === 0) {
    return { success: "History already empty." };
  }

  return {
    success:
      result.count === 1
        ? "1 deposit cleared."
        : `${result.count} deposits cleared.`,
  };
}

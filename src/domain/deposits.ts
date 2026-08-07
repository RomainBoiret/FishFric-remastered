import type { AccountType } from "@/domain/accounts";
import { demoChequeFileName } from "@/domain/cheque-svg";

export const MOBILE_DEPOSIT_RULES = {
  minAmountCents: 100, // $1.00
  maxAmountCents: 500_000, // $5,000.00
  /** Client-side simulated review delay before credit */
  reviewDelayMs: 1800,
  maxImageBytes: 2 * 1024 * 1024,
  allowedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ] as const,
} as const;

/** Same retention model as notifications: capped list, prune oldest. */
export const DEPOSIT_HISTORY_RULES = {
  /** Hard cap of stored deposit history rows per user (oldest dropped). */
  maxPerUser: 8,
  /** How many to show in the deposit history panel. */
  listTake: 8,
} as const;

export type DepositAccount = {
  id: string;
  type: AccountType;
};

export function canDepositTo(type: AccountType): boolean {
  return type === "CHECKING" || type === "SAVINGS";
}

export function validateMobileDeposit(input: {
  account: DepositAccount;
  amountCents: number;
}): { ok: true } | { ok: false; reason: string } {
  const { account, amountCents } = input;

  if (!canDepositTo(account.type)) {
    return {
      ok: false,
      reason: "Cheque deposits go to checking or savings only.",
    };
  }

  if (amountCents < MOBILE_DEPOSIT_RULES.minAmountCents) {
    return { ok: false, reason: "Minimum deposit is $1.00." };
  }

  if (amountCents > MOBILE_DEPOSIT_RULES.maxAmountCents) {
    return {
      ok: false,
      reason: `Maximum deposit is $${(MOBILE_DEPOSIT_RULES.maxAmountCents / 100).toFixed(2)}.`,
    };
  }

  return { ok: true };
}

/** Generated / uploaded Fish&Fric cheques: face amount must match deposit. */
export function validateChequeFaceMatchesDeposit(input: {
  amountCents: number;
  faceAmountCents: number;
}): { ok: true } | { ok: false; reason: string } {
  if (input.amountCents !== input.faceAmountCents) {
    return {
      ok: false,
      reason: `Cheque face is $${(input.faceAmountCents / 100).toFixed(2)} but deposit amount is $${(input.amountCents / 100).toFixed(2)}.`,
    };
  }
  return { ok: true };
}

/** Generated cheques: face amount must match the submitted deposit amount. */
export function validateGeneratedChequeAmount(input: {
  amountCents: number;
  chequeAmountCents: number;
  chequeFileName: string;
  chequeId?: string;
}): { ok: true } | { ok: false; reason: string } {
  const face = validateChequeFaceMatchesDeposit({
    amountCents: input.amountCents,
    faceAmountCents: input.chequeAmountCents,
  });
  if (!face.ok) {
    return {
      ok: false,
      reason: `${face.reason} Re-issue / re-download the cheque.`,
    };
  }

  const expectedName = demoChequeFileName(
    input.amountCents,
    input.chequeId,
  );
  if (input.chequeFileName !== expectedName) {
    return {
      ok: false,
      reason: "Cheque file does not match the deposit amount.",
    };
  }

  return { ok: true };
}

export function isAllowedDepositImage(file: {
  type: string;
  size: number;
}): { ok: true } | { ok: false; reason: string } {
  const allowed = MOBILE_DEPOSIT_RULES.allowedImageTypes as readonly string[];
  if (!allowed.includes(file.type)) {
    return { ok: false, reason: "Use a JPG, PNG, WebP, or SVG image." };
  }
  if (file.size > MOBILE_DEPOSIT_RULES.maxImageBytes) {
    return { ok: false, reason: "Image must be 2 MB or smaller." };
  }
  return { ok: true };
}

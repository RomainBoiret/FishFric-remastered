import type { AccountType } from "@/domain/accounts";

export const MOBILE_DEPOSIT_RULES = {
  minAmountCents: 100, // $1.00
  maxAmountCents: 500_000, // $5,000.00
  /** Client-side simulated review delay before credit */
  reviewDelayMs: 1800,
  maxImageBytes: 2 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  sampleImageLabel: "sample-cheque.png",
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
      reason: "Mobile deposits go to checking or savings only.",
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

export function isAllowedDepositImage(file: {
  type: string;
  size: number;
}): { ok: true } | { ok: false; reason: string } {
  const allowed = MOBILE_DEPOSIT_RULES.allowedImageTypes as readonly string[];
  if (!allowed.includes(file.type)) {
    return { ok: false, reason: "Use a JPG, PNG, or WebP image." };
  }
  if (file.size > MOBILE_DEPOSIT_RULES.maxImageBytes) {
    return { ok: false, reason: "Image must be 2 MB or smaller." };
  }
  return { ok: true };
}

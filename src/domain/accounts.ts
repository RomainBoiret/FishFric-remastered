import { ACCOUNT_RULES } from "@/domain/money";

export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT";

export type OpenAccountInput = {
  type: AccountType;
  existingTypes: AccountType[];
  savingsCount: number;
};

export function canOpenAccount(input: OpenAccountInput): {
  ok: boolean;
  reason?: string;
} {
  const { type, existingTypes, savingsCount } = input;

  if (type === "CHECKING") {
    if (existingTypes.includes("CHECKING")) {
      return { ok: false, reason: "A checking account already exists." };
    }
    return { ok: true };
  }

  if (type === "SAVINGS") {
    if (savingsCount >= ACCOUNT_RULES.maxSavingsAccounts) {
      return {
        ok: false,
        reason: `Maximum ${ACCOUNT_RULES.maxSavingsAccounts} savings accounts.`,
      };
    }
    return { ok: true };
  }

  if (type === "CREDIT") {
    if (existingTypes.includes("CREDIT")) {
      return { ok: false, reason: "A Shark Card already exists." };
    }
    return { ok: true };
  }

  return { ok: false, reason: "Invalid account type." };
}

export function assertSufficientFunds(
  balanceCents: number,
  amountCents: number,
): void {
  if (amountCents <= 0) {
    throw new Error("Amount must be positive.");
  }
  if (balanceCents < amountCents) {
    throw new Error("Insufficient funds.");
  }
}

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
      return { ok: false, reason: "Un compte chèque existe déjà." };
    }
    return { ok: true };
  }

  if (type === "SAVINGS") {
    if (savingsCount >= ACCOUNT_RULES.maxSavingsAccounts) {
      return {
        ok: false,
        reason: `Maximum ${ACCOUNT_RULES.maxSavingsAccounts} comptes épargne.`,
      };
    }
    return { ok: true };
  }

  if (type === "CREDIT") {
    if (existingTypes.includes("CREDIT")) {
      return { ok: false, reason: "Une Carte requin existe déjà." };
    }
    return { ok: true };
  }

  return { ok: false, reason: "Type de compte invalide." };
}

export function assertSufficientFunds(
  balanceCents: number,
  amountCents: number,
): void {
  if (amountCents <= 0) {
    throw new Error("Le montant doit être positif.");
  }
  if (balanceCents < amountCents) {
    throw new Error("Fonds insuffisants.");
  }
}

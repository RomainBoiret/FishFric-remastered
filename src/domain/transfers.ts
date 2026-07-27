import type { AccountType } from "@/domain/accounts";

export type TransferAccount = {
  id: string;
  type: AccountType;
  balanceCents: number;
  creditLimitCents: number | null;
  label: string | null;
};

export function parseAmountToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, frac = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return cents;
}

export function validateInternalTransfer(input: {
  from: TransferAccount;
  to: TransferAccount;
  amountCents: number;
}): { ok: true } | { ok: false; reason: string } {
  const { from, to, amountCents } = input;

  if (from.id === to.id) {
    return { ok: false, reason: "Choose two different accounts." };
  }

  if (amountCents <= 0) {
    return { ok: false, reason: "Amount must be positive." };
  }

  // MVP: no cash advances from Shark Card
  if (from.type === "CREDIT") {
    return {
      ok: false,
      reason: "Cannot transfer from the Shark Card.",
    };
  }

  if (from.balanceCents < amountCents) {
    return { ok: false, reason: "Insufficient funds on the source account." };
  }

  if (to.type === "CREDIT") {
    const next = to.balanceCents + amountCents;
    const limit = to.creditLimitCents ?? 0;
    if (next > 0) {
      return {
        ok: false,
        reason: "This payment exceeds the amount owed on the card.",
      };
    }
    if (next < limit) {
      return { ok: false, reason: "Credit limit exceeded." };
    }
  }

  return { ok: true };
}

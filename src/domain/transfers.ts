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
    return { ok: false, reason: "Choisis deux comptes différents." };
  }

  if (amountCents <= 0) {
    return { ok: false, reason: "Le montant doit être positif." };
  }

  // MVP : pas d'avance depuis la Carte requin (source interdite)
  if (from.type === "CREDIT") {
    return {
      ok: false,
      reason: "Impossible de transférer depuis la Carte requin.",
    };
  }

  if (from.balanceCents < amountCents) {
    return { ok: false, reason: "Fonds insuffisants sur le compte source." };
  }

  if (to.type === "CREDIT") {
    const next = to.balanceCents + amountCents;
    const limit = to.creditLimitCents ?? 0;
    if (next > 0) {
      return {
        ok: false,
        reason: "Ce remboursement dépasse le solde dû sur la carte.",
      };
    }
    if (next < limit) {
      return { ok: false, reason: "Limite de crédit dépassée." };
    }
  }

  return { ok: true };
}

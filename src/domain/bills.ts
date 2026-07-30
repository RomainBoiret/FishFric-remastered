import type { AccountType } from "@/domain/accounts";

export const BILL_PAYEES = [
  {
    id: "ocean-hydro",
    name: "Ocean Hydro",
    category: "Utilities",
  },
  {
    id: "reef-mobile",
    name: "Reef Mobile",
    category: "Phone & internet",
  },
  {
    id: "wave-insurance",
    name: "Wave Insurance",
    category: "Insurance",
  },
  {
    id: "coralville",
    name: "City of Coralville",
    category: "Municipal",
  },
] as const;

export type BillPayeeId = (typeof BILL_PAYEES)[number]["id"];

export type BillPayAccount = {
  id: string;
  type: AccountType;
  balanceCents: number;
  creditLimitCents: number | null;
};

export function getBillPayee(id: string) {
  return BILL_PAYEES.find((payee) => payee.id === id) ?? null;
}

export function canPayBillFrom(type: AccountType): boolean {
  return type === "CHECKING" || type === "SAVINGS" || type === "CREDIT";
}

export function validateBillPayment(input: {
  from: BillPayAccount;
  payeeId: string;
  amountCents: number;
}): { ok: true; payeeName: string } | { ok: false; reason: string } {
  const { from, payeeId, amountCents } = input;
  const payee = getBillPayee(payeeId);

  if (!payee) {
    return { ok: false, reason: "Unknown bill payee." };
  }

  if (amountCents <= 0) {
    return { ok: false, reason: "Amount must be positive." };
  }

  if (!canPayBillFrom(from.type)) {
    return { ok: false, reason: "This account cannot pay bills." };
  }

  if (from.type === "CREDIT") {
    const next = from.balanceCents - amountCents;
    const limit = from.creditLimitCents ?? 0;
    if (next < limit) {
      return { ok: false, reason: "Credit limit exceeded." };
    }
  } else if (from.balanceCents < amountCents) {
    return { ok: false, reason: "Insufficient funds on the source account." };
  }

  return { ok: true, payeeName: payee.name };
}

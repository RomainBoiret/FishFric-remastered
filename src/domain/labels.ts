export const ACCOUNT_TYPE_LABELS = {
  CHECKING: "Checking account",
  SAVINGS: "Savings account",
  CREDIT: "Shark Card",
} as const;

export const ENTRY_KIND_LABELS = {
  TRANSFER_INTERNAL: "Internal transfer",
  TRANSFER_P2P: "P2P transfer",
  BILL_PAYMENT: "Bill payment",
  MOBILE_DEPOSIT: "Mobile deposit",
  INTEREST: "Interest",
  ADJUSTMENT: "Adjustment",
} as const;

export function formatDateTime(date: Date, locale = "en-CA"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

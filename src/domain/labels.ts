export const ACCOUNT_TYPE_LABELS = {
  CHECKING: "Compte chèque",
  SAVINGS: "Compte épargne",
  CREDIT: "Carte requin",
} as const;

export const ENTRY_KIND_LABELS = {
  TRANSFER_INTERNAL: "Transfert interne",
  TRANSFER_P2P: "Transfert P2P",
  BILL_PAYMENT: "Paiement de facture",
  MOBILE_DEPOSIT: "Dépôt mobile",
  INTEREST: "Intérêts",
  ADJUSTMENT: "Ajustement",
} as const;

export function formatDateTime(date: Date, locale = "fr-CA"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

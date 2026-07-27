/** Fish&Fric business constants (amounts in cents, rates in bps). */

export const ACCOUNT_RULES = {
  maxSavingsAccounts: 3,
  maxCreditAccounts: 1,
  defaultCreditLimitCents: -500_000, // -5,000.00
  interestBps: {
    CHECKING: 100, // 1%
    SAVINGS: 300, // 3%
    CREDIT: 999, // 9.99%
  },
} as const;

export const P2P_RULES = {
  expiryDays: 7,
  maxAnswerAttempts: 5,
} as const;

export function formatMoney(cents: number, locale = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

/**
 * Ledger integrity helpers.
 * `BankAccount.balanceCents` is a denormalized cache of Σ LedgerEntry.amountCents.
 */

/** Same retention model as notifications/deposits - hide overflow, never delete. */
export const ACCOUNT_HISTORY_RULES = {
  /** Max visible history rows per account (oldest auto-hidden). */
  maxVisiblePerAccount: 10,
  /** How many to show on the account page. */
  listTake: 10,
} as const;

export function sumLedgerCents(
  entries: ReadonlyArray<{ amountCents: number }>,
): number {
  return entries.reduce((sum, entry) => sum + entry.amountCents, 0);
}

export function isBalanceConsistent(
  balanceCents: number,
  entries: ReadonlyArray<{ amountCents: number }>,
): boolean {
  return balanceCents === sumLedgerCents(entries);
}

export type LedgerMismatch = {
  accountId: string;
  balanceCents: number;
  ledgerSumCents: number;
  deltaCents: number;
};

export function findBalanceMismatches(
  accounts: ReadonlyArray<{
    id: string;
    balanceCents: number;
    entries: ReadonlyArray<{ amountCents: number }>;
  }>,
): LedgerMismatch[] {
  const mismatches: LedgerMismatch[] = [];

  for (const account of accounts) {
    const ledgerSumCents = sumLedgerCents(account.entries);
    if (ledgerSumCents !== account.balanceCents) {
      mismatches.push({
        accountId: account.id,
        balanceCents: account.balanceCents,
        ledgerSumCents,
        deltaCents: account.balanceCents - ledgerSumCents,
      });
    }
  }

  return mismatches;
}

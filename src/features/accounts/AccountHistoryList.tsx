"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/ui/toast";
import {
  ENTRY_KIND_LABELS,
  formatDateTime,
} from "@/domain/labels";
import { ACCOUNT_HISTORY_RULES } from "@/domain/ledger";
import { formatMoney } from "@/domain/money";
import {
  clearAccountHistoryAction,
  dismissLedgerEntryAction,
  type AccountHistoryActionState,
} from "@/features/accounts/actions";

export type AccountHistoryItem = {
  id: string;
  amountCents: number;
  kind: keyof typeof ENTRY_KIND_LABELS;
  description: string;
  createdAt: string;
};

const initial: AccountHistoryActionState = {};

function DismissButton({
  entryId,
  accountId,
}: {
  entryId: string;
  accountId: string;
}) {
  const [, formAction, pending] = useActionState(
    dismissLedgerEntryAction,
    initial,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="accountId" value={accountId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)] hover:text-[var(--ff-gold-hi)] disabled:opacity-60"
        aria-busy={pending}
        title="Hides this row from history. Balance stays the same."
      >
        {pending ? "…" : "Dismiss"}
      </button>
    </form>
  );
}

function ClearAllButton({
  accountId,
  hasItems,
}: {
  accountId: string;
  hasItems: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    clearAccountHistoryAction,
    initial,
  );
  useActionToast(state, pending);

  if (!hasItems) return null;

  return (
    <form action={formAction}>
      <input type="hidden" name="accountId" value={accountId} />
      <button
        type="submit"
        disabled={pending}
        className="ff-btn ff-btn-sm ff-btn-ghost"
        aria-busy={pending}
        title="Hides history rows only. Ledger balances stay."
      >
        {pending ? "Clearing…" : "Clear all"}
      </button>
    </form>
  );
}

export function AccountHistoryList({
  accountId,
  items,
}: {
  accountId: string;
  items: AccountHistoryItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h2 id="history-heading" className="ff-display text-lg">
          History
        </h2>
        <p className="text-sm text-[var(--ff-muted)]" role="status">
          Still waters - no transactions yet (max{" "}
          {ACCOUNT_HISTORY_RULES.maxVisiblePerAccount} kept visible).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="history-heading" className="ff-display text-lg">
          History
        </h2>
        <ClearAllButton accountId={accountId} hasItems />
      </div>

      <ul className="ff-surface m-0 flex list-none flex-col overflow-hidden p-0">
        {items.map((entry, index) => {
          const credit = entry.amountCents > 0;
          const amount = formatMoney(entry.amountCents);
          return (
            <li
              key={entry.id}
              className={
                index < items.length - 1 ? "border-b-2 border-black" : ""
              }
            >
              <article className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-bold text-white">
                    {entry.description}
                  </p>
                  <p className="text-xs text-[var(--ff-muted)]">
                    {ENTRY_KIND_LABELS[entry.kind]} ·{" "}
                    <time dateTime={entry.createdAt}>
                      {formatDateTime(new Date(entry.createdAt))}
                    </time>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p
                    className={`ff-display text-sm tabular-nums sm:text-base ${
                      credit ? "text-[var(--ff-ok)]" : "text-white"
                    }`}
                    aria-label={`${credit ? "Credit" : "Debit"} ${amount}`}
                  >
                    {credit ? "+" : ""}
                    {amount}
                  </p>
                  <DismissButton entryId={entry.id} accountId={accountId} />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import { useActionState, useId } from "react";
import { formatMoney } from "@/domain/money";
import { transferInternalAction } from "@/features/transfers/actions";
import type { TransferActionState } from "@/features/transfers/schemas";

export type TransferAccountOption = {
  id: string;
  label: string;
  type: string;
  balanceCents: number;
};

const initial: TransferActionState = {};

export function TransferForm({
  accounts,
  defaultFromId,
}: {
  accounts: TransferAccountOption[];
  defaultFromId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    transferInternalAction,
    initial,
  );
  const fromId = useId();
  const toId = useId();
  const amountId = useId();
  const statusId = useId();

  const sources = accounts.filter((a) => a.type !== "CREDIT");
  const defaultFrom =
    defaultFromId && sources.some((a) => a.id === defaultFromId)
      ? defaultFromId
      : sources[0]?.id;

  if (sources.length === 0 || accounts.length < 2) {
    return (
      <p className="text-[var(--ff-muted)]" role="status">
        You need at least two accounts (with a non-credit source) to transfer.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4"
      aria-busy={pending}
    >
      <label className="ff-label" htmlFor={fromId}>
        From
        <select
          id={fromId}
          name="fromAccountId"
          required
          defaultValue={defaultFrom}
          className="ff-input"
        >
          {sources.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} - {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <label className="ff-label" htmlFor={toId}>
        To
        <select
          id={toId}
          name="toAccountId"
          required
          defaultValue={
            accounts.find((a) => a.id !== defaultFrom)?.id ?? accounts[0]?.id
          }
          className="ff-input"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} - {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <label className="ff-label" htmlFor={amountId}>
        Amount (CAD)
        <input
          id={amountId}
          name="amount"
          inputMode="decimal"
          placeholder="50.00"
          required
          className="ff-input"
          aria-describedby={
            state.error || state.success ? statusId : undefined
          }
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      {state.error ? (
        <p
          id={statusId}
          className="text-sm text-[var(--ff-danger)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p id={statusId} className="text-sm text-[var(--ff-ok)]" role="status">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ff-btn mt-2 w-full"
        aria-busy={pending}
      >
        {pending ? "Sending…" : "Transfer"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

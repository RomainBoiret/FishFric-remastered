"use client";

import { useActionState, useId } from "react";
import { useActionToast } from "@/components/ui/toast";
import { BILL_PAYEES } from "@/domain/bills";
import { formatMoney } from "@/domain/money";
import { payBillAction } from "@/features/bills/actions";
import type { BillPayActionState } from "@/features/bills/schemas";

export type BillPayAccountOption = {
  id: string;
  label: string;
  type: string;
  balanceCents: number;
};

const initial: BillPayActionState = {};

export function BillPayForm({
  accounts,
  defaultFromId,
}: {
  accounts: BillPayAccountOption[];
  defaultFromId?: string;
}) {
  const [state, formAction, pending] = useActionState(payBillAction, initial);
  useActionToast(state, pending);

  const fromId = useId();
  const payeeId = useId();
  const amountId = useId();
  const memoId = useId();
  const statusId = useId();

  const defaultFrom =
    defaultFromId && accounts.some((a) => a.id === defaultFromId)
      ? defaultFromId
      : accounts[0]?.id;

  if (accounts.length === 0) {
    return (
      <p className="text-[var(--ff-muted)]" role="status">
        You need an active account to pay a bill.
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
        Pay from
        <select
          id={fromId}
          name="fromAccountId"
          required
          defaultValue={defaultFrom}
          className="ff-input"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} - {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="ff-label mb-1">Payee</legend>
        {BILL_PAYEES.map((payee, index) => {
          const optionId = `${payeeId}-${payee.id}`;
          return (
            <label
              key={payee.id}
              htmlFor={optionId}
              className="flex cursor-pointer items-start gap-3 border-2 border-black bg-black/20 px-3 py-3 hover:bg-black/35"
            >
              <input
                id={optionId}
                type="radio"
                name="payeeId"
                value={payee.id}
                required
                defaultChecked={index === 0}
                className="mt-1"
              />
              <span>
                <span className="block font-bold text-white">{payee.name}</span>
                <span className="block text-sm text-[var(--ff-muted)]">
                  {payee.category}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <label className="ff-label" htmlFor={amountId}>
        Amount (CAD)
        <input
          id={amountId}
          name="amount"
          inputMode="decimal"
          placeholder="75.00"
          required
          className="ff-input"
          aria-describedby={state.error ? statusId : undefined}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label className="ff-label" htmlFor={memoId}>
        Memo (optional)
        <input
          id={memoId}
          name="memo"
          maxLength={60}
          placeholder="Account # or note"
          className="ff-input"
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

      <button
        type="submit"
        disabled={pending}
        className="ff-btn mt-2 w-full"
        aria-busy={pending}
      >
        {pending ? "Paying…" : "Pay bill"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

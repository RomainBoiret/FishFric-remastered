"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useActionToast } from "@/components/ui/toast";
import { MOBILE_DEPOSIT_RULES } from "@/domain/deposits";
import { formatMoney } from "@/domain/money";
import {
  creditMobileDepositAction,
  submitMobileDepositAction,
} from "@/features/deposits/actions";
import type { DepositActionState } from "@/features/deposits/schemas";

export type DepositAccountOption = {
  id: string;
  label: string;
  balanceCents: number;
};

const initial: DepositActionState = {};

export function MobileDepositForm({
  accounts,
  defaultAccountId,
}: {
  accounts: DepositAccountOption[];
  defaultAccountId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitMobileDepositAction,
    initial,
  );
  const [creditState, creditAction, creditPending] = useActionState(
    creditMobileDepositAction,
    initial,
  );
  useActionToast(state, pending);
  useActionToast(creditState, creditPending);

  const queuedDepositId = useRef<string | null>(null);
  const [useSample, setUseSample] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const accountFieldId = useId();
  const amountId = useId();
  const fileId = useId();
  const sampleId = useId();
  const statusId = useId();

  const defaultAccount =
    defaultAccountId && accounts.some((a) => a.id === defaultAccountId)
      ? defaultAccountId
      : accounts[0]?.id;

  useEffect(() => {
    if (!state.pendingReview || !state.depositId) return;
    if (queuedDepositId.current === state.depositId) return;

    queuedDepositId.current = state.depositId;
    setReviewing(true);

    const timer = setTimeout(() => {
      const formData = new FormData();
      formData.set("depositId", state.depositId!);
      startTransition(() => {
        creditAction(formData);
      });
      setReviewing(false);
    }, MOBILE_DEPOSIT_RULES.reviewDelayMs);

    return () => clearTimeout(timer);
  }, [state.depositId, state.pendingReview, creditAction]);

  if (accounts.length === 0) {
    return (
      <p className="text-[var(--ff-muted)]" role="status">
        Open a checking or savings account to deposit a cheque.
      </p>
    );
  }

  const busy = pending || reviewing || creditPending;

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4"
      aria-busy={busy}
    >
      <label className="ff-label" htmlFor={accountFieldId}>
        Deposit to
        <select
          id={accountFieldId}
          name="accountId"
          required
          defaultValue={defaultAccount}
          className="ff-input"
          disabled={busy}
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
          placeholder="120.00"
          required
          className="ff-input"
          disabled={busy}
          aria-describedby={state.error ? statusId : undefined}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      <label
        htmlFor={sampleId}
        className="flex cursor-pointer items-start gap-3 border-2 border-black bg-black/20 px-3 py-3 hover:bg-black/35"
      >
        <input
          id={sampleId}
          type="checkbox"
          name="useSampleCheck"
          checked={useSample}
          onChange={(event) => setUseSample(event.target.checked)}
          className="mt-1"
          disabled={busy}
        />
        <span>
          <span className="block font-bold text-white">
            Use sample cheque photo
          </span>
          <span className="block text-sm text-[var(--ff-muted)]">
            Demo mock - no real image required (
            {MOBILE_DEPOSIT_RULES.sampleImageLabel}).
          </span>
        </span>
      </label>

      {!useSample ? (
        <label className="ff-label" htmlFor={fileId}>
          Cheque photo
          <input
            id={fileId}
            name="chequeImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="ff-input file:mr-3 file:border-0 file:bg-transparent file:font-bold file:text-[var(--ff-gold)]"
            disabled={busy}
          />
        </label>
      ) : null}

      {state.error ? (
        <p
          id={statusId}
          className="text-sm text-[var(--ff-danger)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {creditState.error ? (
        <p className="text-sm text-[var(--ff-danger)]" role="alert">
          {creditState.error}
        </p>
      ) : null}

      {reviewing ? (
        <p className="text-sm text-[var(--ff-gold)]" role="status">
          Bank review in progress…
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="ff-btn mt-2 w-full"
        aria-busy={busy}
      >
        {pending
          ? "Submitting…"
          : reviewing
            ? "Reviewing…"
            : creditPending
              ? "Crediting…"
              : "Submit deposit"}
        {!busy ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useId } from "react";
import { useActionToast } from "@/components/ui/toast";
import { formatMoney } from "@/domain/money";
import { createP2PAction } from "@/features/p2p/actions";
import type { P2PActionState } from "@/features/p2p/schemas";

export type P2PSourceOption = {
  id: string;
  label: string;
  balanceCents: number;
};

const initial: P2PActionState = {};

export function SendP2PForm({
  sources,
  defaultRecipient,
}: {
  sources: P2PSourceOption[];
  defaultRecipient?: string;
}) {
  const [state, formAction, pending] = useActionState(createP2PAction, initial);
  useActionToast(state, pending);
  const fromId = useId();
  const emailId = useId();
  const amountId = useId();
  const questionId = useId();
  const answerId = useId();
  const statusId = useId();

  if (sources.length === 0) {
    return (
      <p className="text-[var(--ff-muted)]" role="status">
        No eligible account (checking or savings) for P2P.
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
          name="sourceAccountId"
          required
          defaultValue={sources[0]?.id}
          className="ff-input"
        >
          {sources.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} - {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <label className="ff-label" htmlFor={emailId}>
        Recipient email
        <input
          id={emailId}
          name="recipientEmail"
          type="email"
          required
          defaultValue={defaultRecipient}
          placeholder="ami@fishfric.app"
          autoComplete="email"
          inputMode="email"
          className="ff-input"
        />
      </label>

      <label className="ff-label" htmlFor={amountId}>
        Amount (CAD)
        <input
          id={amountId}
          name="amount"
          inputMode="decimal"
          placeholder="40.00"
          required
          className="ff-input"
        />
      </label>

      <label className="ff-label" htmlFor={questionId}>
        Security question
        <input
          id={questionId}
          name="question"
          required
          placeholder="Favorite sea animal?"
          className="ff-input"
        />
      </label>

      <label className="ff-label" htmlFor={answerId}>
        Answer
        <input
          id={answerId}
          name="answer"
          required
          className="ff-input"
          autoComplete="off"
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
        {pending ? "Sending…" : "Send P2P"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

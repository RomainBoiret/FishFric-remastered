"use client";

import { useActionState, useId } from "react";
import { useActionToast } from "@/components/ui/toast";
import { formatMoney } from "@/domain/money";
import { formatDateTime } from "@/domain/labels";
import {
  acceptP2PAction,
  rejectP2PAction,
} from "@/features/p2p/actions";
import type { P2PActionState } from "@/features/p2p/schemas";

export type IncomingP2P = {
  id: string;
  amountCents: number;
  question: string;
  expiresAt: string;
  senderName: string;
};

const initial: P2PActionState = {};

function AcceptForm({ p2p }: { p2p: IncomingP2P }) {
  const [state, formAction, pending] = useActionState(acceptP2PAction, initial);
  useActionToast(state, pending);
  const answerId = useId();
  const statusId = useId();

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2"
      aria-label={`Accept transfer from ${p2p.senderName}`}
      aria-busy={pending}
    >
      <input type="hidden" name="p2pId" value={p2p.id} />
      <label className="ff-label" htmlFor={answerId}>
        Answer
        <input
          id={answerId}
          name="answer"
          required
          className="ff-input"
          autoComplete="off"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? statusId : undefined}
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
        className="ff-btn w-full"
        aria-busy={pending}
      >
        {pending ? "Confirming…" : "Accept"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

function RejectForm({
  p2pId,
  senderName,
}: {
  p2pId: string;
  senderName: string;
}) {
  const [state, formAction, pending] = useActionState(rejectP2PAction, initial);
  useActionToast(state, pending);

  return (
    <form
      action={formAction}
      aria-label={`Decline transfer from ${senderName}`}
    >
      <input type="hidden" name="p2pId" value={p2pId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-[var(--ff-muted)] underline underline-offset-4 hover:text-[var(--ff-danger)] disabled:opacity-60"
        aria-busy={pending}
      >
        {pending ? "Declining…" : "Decline"}
      </button>
      {state.error ? (
        <p className="mt-1 text-sm text-[var(--ff-danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function IncomingP2PList({ items }: { items: IncomingP2P[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ff-muted)]" role="status">
        No pending P2P transfers.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((p2p) => (
        <li
          key={p2p.id}
          className="border-b border-black/40 pb-4 last:border-b-0"
        >
          <p className="font-medium text-[var(--ff-ink)]">
            {p2p.senderName} · {formatMoney(p2p.amountCents)}
          </p>
          <p className="mt-1 text-sm text-[var(--ff-muted)]">
            Security question: {p2p.question}
          </p>
          <p className="text-xs text-[var(--ff-muted)]">
            Expires {formatDateTime(new Date(p2p.expiresAt))}
          </p>
          <AcceptForm p2p={p2p} />
          <div className="mt-2">
            <RejectForm p2pId={p2p.id} senderName={p2p.senderName} />
          </div>
        </li>
      ))}
    </ul>
  );
}

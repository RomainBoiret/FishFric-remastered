"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="p2pId" value={p2p.id} />
      <label className="flex flex-col gap-1 text-sm text-[#9bb8c4]">
        Réponse
        <input
          name="answer"
          required
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-[#f0a8a8]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-[#7ec8d8]" role="status">
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[#7ec8d8] px-3 py-2 text-sm font-semibold text-[#04161f] disabled:opacity-60"
      >
        {pending ? "Validation…" : "Accepter"}
      </button>
    </form>
  );
}

function RejectForm({ p2pId }: { p2pId: string }) {
  const [state, formAction, pending] = useActionState(rejectP2PAction, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="p2pId" value={p2pId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-[#9bb8c4] underline-offset-2 hover:text-[#f0a8a8] hover:underline disabled:opacity-60"
      >
        {pending ? "Refus…" : "Refuser"}
      </button>
      {state.error ? (
        <p className="mt-1 text-sm text-[#f0a8a8]" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function IncomingP2PList({ items }: { items: IncomingP2P[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#6a8894]">Aucun P2P en attente.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((p2p) => (
        <li key={p2p.id} className="border-b border-[#1e4a58] pb-4">
          <p className="font-medium text-[#e8f4f8]">
            {p2p.senderName} · {formatMoney(p2p.amountCents)}
          </p>
          <p className="mt-1 text-sm text-[#9bb8c4]">Q : {p2p.question}</p>
          <p className="text-xs text-[#6a8894]">
            Expire le {formatDateTime(new Date(p2p.expiresAt))}
          </p>
          <AcceptForm p2p={p2p} />
          <div className="mt-2">
            <RejectForm p2pId={p2p.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}

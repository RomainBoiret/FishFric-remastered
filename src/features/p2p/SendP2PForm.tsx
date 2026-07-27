"use client";

import { useActionState } from "react";
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

  if (sources.length === 0) {
    return (
      <p className="text-[#9bb8c4]">
        No eligible account (checking or savings) to send a P2P transfer.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        From
        <select
          name="sourceAccountId"
          required
          defaultValue={sources[0]?.id}
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        >
          {sources.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} — {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Recipient email
        <input
          name="recipientEmail"
          type="email"
          required
          defaultValue={defaultRecipient}
          placeholder="ami@fishfric.app"
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Amount (CAD)
        <input
          name="amount"
          inputMode="decimal"
          placeholder="40.00"
          required
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Security question
        <input
          name="question"
          required
          placeholder="Name of my first fish?"
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Answer
        <input
          name="answer"
          required
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
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
        className="mt-2 rounded-md bg-[#7ec8d8] px-4 py-2.5 text-sm font-semibold text-[#04161f] transition hover:bg-[#9ad7e4] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send P2P"}
      </button>
    </form>
  );
}

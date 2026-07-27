"use client";

import { useActionState } from "react";
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

  const sources = accounts.filter((a) => a.type !== "CREDIT");
  const defaultFrom =
    defaultFromId && sources.some((a) => a.id === defaultFromId)
      ? defaultFromId
      : sources[0]?.id;

  if (sources.length === 0 || accounts.length < 2) {
    return (
      <p className="text-[#9bb8c4]">
        Il te faut au moins deux comptes (dont une source hors Carte requin)
        pour faire un transfert.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Depuis
        <select
          name="fromAccountId"
          required
          defaultValue={defaultFrom}
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
        Vers
        <select
          name="toAccountId"
          required
          defaultValue={
            accounts.find((a) => a.id !== defaultFrom)?.id ?? accounts[0]?.id
          }
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} — {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Montant (CAD)
        <input
          name="amount"
          inputMode="decimal"
          placeholder="50.00"
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
        {pending ? "Transfert…" : "Transférer"}
      </button>
    </form>
  );
}

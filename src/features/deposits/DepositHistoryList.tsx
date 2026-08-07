"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/ui/toast";
import {
  extractAmountCentsFromChequeFileName,
  buildDemoChequeSvg,
  chequeSvgDataUri,
  isGeneratedChequeLabel,
} from "@/domain/cheque-svg";
import { DEPOSIT_HISTORY_RULES } from "@/domain/deposits";
import { formatMoney } from "@/domain/money";
import {
  clearMobileDepositHistoryAction,
  dismissMobileDepositAction,
  type ClearDepositsActionState,
} from "@/features/deposits/actions";

export type DepositHistoryItem = {
  id: string;
  amountCents: number;
  status: "PENDING" | "CREDITED" | "REJECTED";
  imageLabel: string | null;
  createdAt: string;
  resolvedAt: string | null;
  accountLabel: string;
};

const STATUS_LABEL: Record<DepositHistoryItem["status"], string> = {
  PENDING: "Pending",
  CREDITED: "Credited",
  REJECTED: "Rejected",
};

const initial: ClearDepositsActionState = {};

function chequeCaption(imageLabel: string | null): string {
  if (!imageLabel) return "Cheque";
  if (
    isGeneratedChequeLabel(imageLabel) ||
    imageLabel === "sample-cheque.svg" ||
    imageLabel === "sample-cheque.png"
  ) {
    return "Demo cheque";
  }
  const short =
    imageLabel.length > 22 ? `${imageLabel.slice(0, 20)}…` : imageLabel;
  return short;
}

function formatDepositDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function DismissButton({ depositId }: { depositId: string }) {
  const [, formAction, pending] = useActionState(
    dismissMobileDepositAction,
    initial,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="depositId" value={depositId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)] hover:text-[var(--ff-gold-hi)] disabled:opacity-60"
        aria-busy={pending}
        title="Removes this history row only. Ledger balances stay."
      >
        {pending ? "…" : "Dismiss"}
      </button>
    </form>
  );
}

function ClearAllButton({ hasItems }: { hasItems: boolean }) {
  const [state, formAction, pending] = useActionState(
    clearMobileDepositHistoryAction,
    initial,
  );
  useActionToast(state, pending);

  if (!hasItems) return null;

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="ff-btn ff-btn-sm ff-btn-ghost"
        aria-busy={pending}
        title="Removes history rows only. Ledger balances stay."
      >
        {pending ? "Clearing…" : "Clear all"}
      </button>
    </form>
  );
}

function StatusPill({ status }: { status: DepositHistoryItem["status"] }) {
  const tone =
    status === "CREDITED"
      ? "border-[var(--ff-ok)] text-[var(--ff-ok)]"
      : status === "PENDING"
        ? "border-[var(--ff-gold)] text-[var(--ff-gold)]"
        : "border-[var(--ff-danger)] text-[var(--ff-danger)]";

  return (
    <span
      className={`inline-block border-2 bg-black/25 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide ${tone}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function DepositHistoryList({
  items,
  payeeName,
}: {
  items: DepositHistoryItem[];
  payeeName: string;
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h2 id="deposit-history-heading" className="ff-display text-lg">
          Recent catches
        </h2>
        <p className="text-sm text-[var(--ff-muted)]" role="status">
          No cheques yet. Submitted deposits surface here (max{" "}
          {DEPOSIT_HISTORY_RULES.maxPerUser} kept).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h2
          id="deposit-history-heading"
          className="ff-display min-w-0 text-lg"
        >
          Recent catches
        </h2>
        <ClearAllButton hasItems />
      </div>

      <ul className="m-0 list-none space-y-3 p-0">
        {items.map((item) => {
          const faceFromName = item.imageLabel
            ? extractAmountCentsFromChequeFileName(item.imageLabel)
            : null;
          const previewCents = faceFromName ?? item.amountCents;
          const mismatched =
            faceFromName != null && faceFromName !== item.amountCents;

          const showGeneratedPreview =
            isGeneratedChequeLabel(item.imageLabel) ||
            item.imageLabel === "sample-cheque.svg" ||
            item.imageLabel === "sample-cheque.png";

          const previewSrc = showGeneratedPreview
            ? chequeSvgDataUri(
                buildDemoChequeSvg({
                  amountCents: previewCents,
                  payeeName,
                  memo: "Cheque deposit · fictional",
                }),
              )
            : null;

          return (
            <li key={item.id}>
              <article className="overflow-hidden border-2 border-black bg-black/25">
                {previewSrc ? (
                  <div className="border-b-2 border-black bg-[#d7e4ea]">
                    <img
                      src={previewSrc}
                      alt=""
                      className="h-auto w-full opacity-95"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 items-center justify-center border-b-2 border-black bg-black/35 text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                    Uploaded photo
                  </div>
                )}

                <div className="space-y-2 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="ff-display text-base text-white">
                        {formatMoney(item.amountCents)}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-[var(--ff-muted)]">
                        {item.accountLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill status={item.status} />
                      <DismissButton depositId={item.id} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ff-muted)]">
                    <span className="min-w-0 max-w-full truncate">
                      {chequeCaption(item.imageLabel)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={item.createdAt}>
                      {formatDepositDate(item.createdAt)}
                    </time>
                  </div>

                  {mismatched ? (
                    <p className="text-[0.7rem] text-[var(--ff-gold)]">
                      Cheque face {formatMoney(faceFromName)}
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

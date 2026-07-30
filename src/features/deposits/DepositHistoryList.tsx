import { formatDateTime } from "@/domain/labels";
import { formatMoney } from "@/domain/money";

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
  PENDING: "Pending review",
  CREDITED: "Credited",
  REJECTED: "Rejected",
};

export function DepositHistoryList({ items }: { items: DepositHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ff-muted)]" role="status">
        No mobile deposits yet.
      </p>
    );
  }

  return (
    <ul className="ff-surface m-0 list-none overflow-hidden p-0">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={index < items.length - 1 ? "border-b-2 border-black" : ""}
        >
          <article className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="font-bold text-white">
                {formatMoney(item.amountCents)}
                <span className="ml-2 text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                  → {item.accountLabel}
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                {item.imageLabel ?? "cheque"} ·{" "}
                {formatDateTime(new Date(item.createdAt))}
              </p>
            </div>
            <p
              className={
                item.status === "CREDITED"
                  ? "text-xs font-bold uppercase tracking-wide text-[var(--ff-ok)]"
                  : item.status === "PENDING"
                    ? "text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)]"
                    : "text-xs font-bold uppercase tracking-wide text-[var(--ff-danger)]"
              }
            >
              {STATUS_LABEL[item.status]}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import {
  ACCOUNT_TYPE_LABELS,
  ENTRY_KIND_LABELS,
  formatDateTime,
} from "@/domain/labels";
import { formatMoney } from "@/domain/money";
import {
  getAccountLedger,
  getOwnedAccount,
} from "@/features/accounts/queries";
import { auth } from "@/lib/auth";

type PageProps = {
  params: Promise<{ accountId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { accountId } = await params;
  const canonical = `/app/accounts/${accountId}`;

  const session = await auth();
  if (!session?.user) {
    return {
      title: "Account",
      alternates: { canonical },
    };
  }

  try {
    const account = await getOwnedAccount(session.user.id, accountId);
    const title = account.label ?? ACCOUNT_TYPE_LABELS[account.type];
    return {
      title,
      description: `Fish&Fric ${ACCOUNT_TYPE_LABELS[account.type]} - balance and transaction history.`,
      alternates: { canonical },
    };
  } catch {
    return {
      title: "Account",
      alternates: { canonical },
    };
  }
}

export default async function AccountDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { accountId } = await params;
  const account = await getOwnedAccount(session.user.id, accountId);
  const entries = await getAccountLedger(account.id);
  const title = account.label ?? ACCOUNT_TYPE_LABELS[account.type];
  const balance = formatMoney(account.balanceCents);

  return (
    <AppShell>
      <AppHeader />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6"
      >
        <div className="space-y-4">
          <Link
            href="/app"
            className="inline-block text-sm font-bold uppercase tracking-wide text-[var(--ff-muted)] hover:text-[var(--ff-gold)]"
          >
            <span aria-hidden="true">← </span>
            My accounts
          </Link>

          <section
            className="ff-surface space-y-3 p-5 sm:p-6"
            aria-labelledby="account-heading"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--ff-gold)]">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </p>
            <h1
              id="account-heading"
              className="ff-display text-2xl sm:text-3xl"
            >
              {title}
            </h1>
            <p
              className="ff-display text-3xl tabular-nums text-[var(--ff-gold)] sm:text-4xl"
              aria-label={`Balance ${balance}`}
            >
              {balance}
            </p>
            {account.type === "CREDIT" && account.creditLimitCents != null ? (
              <p className="text-sm text-[var(--ff-muted)]">
                Limit {formatMoney(account.creditLimitCents)}
              </p>
            ) : (
              <p className="text-sm text-[var(--ff-muted)]">
                Interest {(account.interestBps / 100).toFixed(2)}% / year
              </p>
            )}

            <div className="pt-2">
              {account.type !== "CREDIT" ? (
                <Link
                  href={`/app/transfer?from=${account.id}`}
                  className="ff-btn w-full sm:w-auto"
                >
                  Transfer from here
                  <span aria-hidden="true"> ›</span>
                </Link>
              ) : (
                <Link
                  href="/app/transfer"
                  className="ff-btn ff-btn-ghost w-full sm:w-auto"
                >
                  Pay the card
                  <span aria-hidden="true"> ›</span>
                </Link>
              )}
            </div>
          </section>
        </div>

        <section aria-labelledby="history-heading" className="space-y-4">
          <h2 id="history-heading" className="ff-display text-lg">
            History
          </h2>

          {entries.length === 0 ? (
            <p
              className="ff-surface py-6 text-center text-[var(--ff-muted)]"
              role="status"
            >
              Still waters - no transactions yet.
            </p>
          ) : (
            <ul className="ff-surface m-0 flex list-none flex-col overflow-hidden p-0">
              {entries.map((entry) => {
                const credit = entry.amountCents > 0;
                const amount = formatMoney(entry.amountCents);
                return (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-4 border-b-2 border-black px-4 py-4 last:border-b-0 sm:px-5"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-bold text-white">
                        {entry.description}
                      </p>
                      <p className="text-xs text-[var(--ff-muted)]">
                        {ENTRY_KIND_LABELS[entry.kind]} ·{" "}
                        <time dateTime={entry.createdAt.toISOString()}>
                          {formatDateTime(entry.createdAt)}
                        </time>
                      </p>
                    </div>
                    <p
                      className={`ff-display shrink-0 text-sm tabular-nums sm:text-base ${
                        credit ? "text-[var(--ff-ok)]" : "text-white"
                      }`}
                      aria-label={`${credit ? "Credit" : "Debit"} ${amount}`}
                    >
                      {credit ? "+" : ""}
                      {amount}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}

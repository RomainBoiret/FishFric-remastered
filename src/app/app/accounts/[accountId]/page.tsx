import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { ACCOUNT_HISTORY_RULES } from "@/domain/ledger";
import { formatMoney } from "@/domain/money";
import { AccountHistoryList } from "@/features/accounts/AccountHistoryList";
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
      description: `${ACCOUNT_TYPE_LABELS[account.type]} on Fish&Fric - balance and tide log.`,
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

  const history = entries.map((entry) => ({
    id: entry.id,
    amountCents: entry.amountCents,
    kind: entry.kind,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
  }));

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
                Credit limit {formatMoney(account.creditLimitCents)}
              </p>
            ) : (
              <p className="text-sm text-[var(--ff-muted)]">
                Interest {(account.interestBps / 100).toFixed(2)}% per year
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
                  Pay the Shark Card
                  <span aria-hidden="true"> ›</span>
                </Link>
              )}
            </div>
          </section>
        </div>

        <section aria-labelledby="history-heading" className="space-y-2">
          <p className="text-sm text-[var(--ff-muted)]">
            Tide log shows up to {ACCOUNT_HISTORY_RULES.maxVisiblePerAccount}{" "}
            rows. Clearing hides the list only - balances stay put.
          </p>
          <AccountHistoryList accountId={account.id} items={history} />
        </section>
      </main>
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { canDepositTo, DEPOSIT_HISTORY_RULES } from "@/domain/deposits";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { DepositHistoryList } from "@/features/deposits/DepositHistoryList";
import { MobileDepositForm } from "@/features/deposits/MobileDepositForm";
import { getMobileDepositsForUser } from "@/features/deposits/queries";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Mobile deposit",
  description:
    "Simulate a mobile cheque deposit with pending review and ledger credit.",
  alternates: { canonical: "/app/deposit" },
};

type PageProps = {
  searchParams: Promise<{ to?: string }>;
};

export default async function MobileDepositPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { to } = await searchParams;
  const payeeName = session.user.name?.trim() || "Fish&Fric customer";

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { openedAt: "asc" },
  });

  const depositAccounts = accounts
    .filter((account) => canDepositTo(account.type))
    .map((account) => ({
      id: account.id,
      balanceCents: account.balanceCents,
      label: account.label ?? ACCOUNT_TYPE_LABELS[account.type],
    }));

  const deposits = await getMobileDepositsForUser(session.user.id);

  const history = deposits.map((deposit) => ({
    id: deposit.id,
    amountCents: deposit.amountCents,
    status: deposit.status,
    imageLabel: deposit.imageLabel,
    createdAt: deposit.createdAt.toISOString(),
    resolvedAt: deposit.resolvedAt?.toISOString() ?? null,
    accountLabel:
      deposit.account.label ?? ACCOUNT_TYPE_LABELS[deposit.account.type],
  }));

  return (
    <AppShell>
      <AppHeader />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6"
      >
        <div className="space-y-2">
          <Link
            href="/app"
            className="inline-block text-sm font-bold uppercase tracking-wide text-[var(--ff-muted)] hover:text-[var(--ff-gold)]"
          >
            <span aria-hidden="true">← </span>
            My accounts
          </Link>
          <h1 className="ff-display text-2xl">Mobile deposit</h1>
          <p className="max-w-lg text-sm text-[var(--ff-muted)]">
            Issue a signed demo cheque (saved on your PC) or upload a photo.
            ID, payee, signature and one-time clear are checked, then{" "}
            <span className="text-[var(--ff-ink)]">pending → credited</span>.
            History keeps at most {DEPOSIT_HISTORY_RULES.maxPerUser} deposits.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="ff-surface space-y-4 p-5 sm:p-6"
            aria-labelledby="deposit-form-heading"
          >
            <h2 id="deposit-form-heading" className="ff-display text-lg">
              New deposit
            </h2>
            <MobileDepositForm
              accounts={depositAccounts}
              defaultAccountId={to}
              payeeName={payeeName}
            />
          </section>

          <section
            className="ff-surface space-y-4 p-5 sm:p-6"
            aria-labelledby="deposit-history-heading"
          >
            <DepositHistoryList items={history} payeeName={payeeName} />
          </section>
        </div>
      </main>
    </AppShell>
  );
}

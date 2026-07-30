import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { canDepositTo } from "@/domain/deposits";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { DepositHistoryList } from "@/features/deposits/DepositHistoryList";
import { MobileDepositForm } from "@/features/deposits/MobileDepositForm";
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

  const deposits = await prisma.mobileDeposit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      account: { select: { label: true, type: true } },
    },
  });

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
        className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-8 sm:px-6"
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
          <p className="text-sm text-[var(--ff-muted)]">
            Snap a cheque (or use the sample). Status goes{" "}
            <span className="text-[var(--ff-ink)]">pending → credited</span>{" "}
            with a <span className="text-[var(--ff-ink)]">MOBILE_DEPOSIT</span>{" "}
            ledger entry. No OCR - demo only.
          </p>
        </div>

        <section className="ff-surface p-5 sm:p-6" aria-label="Deposit form">
          <MobileDepositForm
            accounts={depositAccounts}
            defaultAccountId={to}
          />
        </section>

        <section className="space-y-3" aria-labelledby="deposit-history-heading">
          <h2 id="deposit-history-heading" className="ff-display text-lg">
            Recent deposits
          </h2>
          <DepositHistoryList items={history} />
        </section>
      </main>
    </AppShell>
  );
}

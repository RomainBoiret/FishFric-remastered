import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { TransferForm } from "@/features/transfers/TransferForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Transfer",
  description: "Move doubloons between your Fish&Fric accounts.",
  alternates: { canonical: "/app/transfer" },
};

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function TransferPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { from } = await searchParams;

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { openedAt: "asc" },
  });

  const options = accounts.map((account) => ({
    id: account.id,
    type: account.type,
    balanceCents: account.balanceCents,
    label: account.label ?? ACCOUNT_TYPE_LABELS[account.type],
  }));

  return (
    <AppShell>
      <AppHeader />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 sm:px-6"
      >
        <div className="space-y-2">
          <Link
            href="/app"
            className="inline-block text-sm font-bold uppercase tracking-wide text-[var(--ff-muted)] hover:text-[var(--ff-gold)]"
          >
            <span aria-hidden="true">← </span>
            My accounts
          </Link>
          <h1 className="ff-display text-2xl">Between accounts</h1>
          <p className="text-sm text-[var(--ff-muted)]">
            Shift funds from one of your pots to another - same reef, instant
            ledger.
          </p>
        </div>

        <section className="ff-surface p-5 sm:p-6" aria-label="Transfer form">
          <TransferForm accounts={options} defaultFromId={from} />
        </section>
      </main>
    </AppShell>
  );
}

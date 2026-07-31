import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { BillPayForm } from "@/features/bills/BillPayForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Pay a bill",
  description:
    "Clear demo utilities and reef services from your Fish&Fric accounts.",
  alternates: { canonical: "/app/bills" },
};

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function BillsPage({ searchParams }: PageProps) {
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
          <h1 className="ff-display text-2xl">Pay a bill</h1>
          <p className="text-sm text-[var(--ff-muted)]">
            Settle a demo payee from one of your accounts. The ledger logs it as
            a bill payment - no real invoices, just practice tides.
          </p>
        </div>

        <section className="ff-surface p-5 sm:p-6" aria-label="Bill payment form">
          <BillPayForm accounts={options} defaultFromId={from} />
        </section>
      </main>
    </AppShell>
  );
}

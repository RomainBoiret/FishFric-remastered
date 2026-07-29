import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { formatMoney } from "@/domain/money";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "My accounts",
  description: "View your Fish&Fric checking, savings, and Shark Card balances.",
  alternates: { canonical: "/app" },
};

export default async function AppHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { openedAt: "asc" },
  });

  return (
    <AppShell>
      <AppHeader />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6"
      >
        <div className="ff-in space-y-2">
          <h1 className="ff-display text-2xl sm:text-3xl">
            Hello, {session.user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-[var(--ff-muted)]">
            Your accounts.
            {session.user.isDemo
              ? " Demo mode - sample data for visitors."
              : null}
          </p>
        </div>

        <nav
          aria-label="Quick actions"
          className="ff-in ff-in-1 grid gap-3 sm:grid-cols-2"
        >
          <Link href="/app/transfer" className="ff-btn w-full">
            New transfer
            <span aria-hidden="true"> ›</span>
          </Link>
          <Link href="/app/p2p" className="ff-btn ff-btn-ghost w-full">
            P2P transfer
            <span aria-hidden="true"> ›</span>
          </Link>
        </nav>

        <section
          aria-labelledby="accounts-heading"
          className="ff-in ff-in-2"
        >
          <h2 id="accounts-heading" className="ff-sr-only">
            Account list
          </h2>
          <ul className="ff-surface m-0 list-none overflow-hidden p-0">
            {accounts.map((account, index) => {
              const name =
                account.label ?? ACCOUNT_TYPE_LABELS[account.type];
              const balance = formatMoney(account.balanceCents);
              return (
                <li
                  key={account.id}
                  className={
                    index < accounts.length - 1 ? "border-b-2 border-black" : ""
                  }
                >
                  <Link
                    href={`/app/accounts/${account.id}`}
                    className="ff-row-link flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
                    aria-label={`${name}, balance ${balance}`}
                  >
                    <div>
                      <p className="font-bold text-white">{name}</p>
                      <p className="text-xs uppercase tracking-wide text-[var(--ff-muted)]">
                        {ACCOUNT_TYPE_LABELS[account.type]}
                      </p>
                    </div>
                    <p
                      className="ff-display text-base tabular-nums text-[var(--ff-gold)] sm:text-lg"
                      aria-hidden="true"
                    >
                      {balance}
                    </p>
                  </Link>
                </li>
              );
            })}
            {accounts.length === 0 ? (
              <li className="px-5 py-8 text-[var(--ff-muted)]">
                No accounts yet.
              </li>
            ) : null}
          </ul>
        </section>
      </main>
    </AppShell>
  );
}

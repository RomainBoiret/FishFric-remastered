import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import {
  getOpenableAccountTypes,
  type AccountType,
} from "@/domain/accounts";
import { OpenAccountForm } from "@/features/accounts/OpenAccountForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Open an account",
  description:
    "Open checking, savings, or a Shark Card - new Fish&Fric products start at $0.00.",
  alternates: { canonical: "/app/accounts/open" },
};

export default async function OpenAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { type: true },
  });

  const existingTypes = accounts.map((a) => a.type as AccountType);
  const savingsCount = accounts.filter((a) => a.type === "SAVINGS").length;
  const openableTypes = getOpenableAccountTypes({
    existingTypes,
    savingsCount,
  });

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
          <h1 className="ff-display text-2xl">Open an account</h1>
          <p className="text-sm text-[var(--ff-muted)]">
            Add checking, savings, or a Shark Card to your reef. Fresh accounts
            launch at $0.00 - fill them when you are ready.
          </p>
        </div>

        <section
          className="ff-surface p-5 sm:p-6"
          aria-label="Open account form"
        >
          <OpenAccountForm openableTypes={openableTypes} />
        </section>
      </main>
    </AppShell>
  );
}

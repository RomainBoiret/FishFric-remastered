import Link from "next/link";
import { redirect } from "next/navigation";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { TransferForm } from "@/features/transfers/TransferForm";
import { logoutAction } from "@/features/auth/actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,#0a4a5c_0%,transparent_45%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link
          href="/app"
          className="text-xl text-[#7ec8d8]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fish&Fric
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-[#9bb8c4] transition hover:text-[#e8f4f8]"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 pb-16">
        <div className="space-y-2">
          <Link
            href="/app"
            className="inline-block text-sm text-[#9bb8c4] transition hover:text-[#7ec8d8]"
          >
            ← My accounts
          </Link>
          <h1
            className="text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Internal transfer
          </h1>
          <p className="text-[#9bb8c4]">
            Move funds between your Fish&Fric accounts.
          </p>
        </div>

        <TransferForm accounts={options} defaultFromId={from} />
      </main>
    </div>
  );
}

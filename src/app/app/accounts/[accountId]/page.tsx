import Link from "next/link";
import { redirect } from "next/navigation";
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
import { logoutAction } from "@/features/auth/actions";
import { auth } from "@/lib/auth";

type PageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AccountDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { accountId } = await params;
  const account = await getOwnedAccount(session.user.id, accountId);
  const entries = await getAccountLedger(account.id);
  const title = account.label ?? ACCOUNT_TYPE_LABELS[account.type];

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,#0a4a5c_0%,transparent_45%)]"
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

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 pb-16">
        <div className="space-y-4">
          <Link
            href="/app"
            className="inline-block text-sm text-[#9bb8c4] transition hover:text-[#7ec8d8]"
          >
            ← My accounts
          </Link>

          <div className="space-y-2">
            <p className="text-sm text-[#6a8894]">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </p>
            <h1
              className="text-3xl sm:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            <p
              className="text-4xl tabular-nums text-[#7ec8d8] sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatMoney(account.balanceCents)}
            </p>
            {account.type === "CREDIT" && account.creditLimitCents != null ? (
              <p className="text-sm text-[#6a8894]">
                Limit {formatMoney(account.creditLimitCents)}
              </p>
            ) : (
              <p className="text-sm text-[#6a8894]">
                Interest {(account.interestBps / 100).toFixed(2)}% / year
              </p>
            )}
          </div>

          {account.type !== "CREDIT" ? (
            <Link
              href={`/app/transfer?from=${account.id}`}
              className="inline-flex rounded-md bg-[#7ec8d8] px-4 py-2.5 text-sm font-semibold text-[#04161f] transition hover:bg-[#9ad7e4]"
            >
              Transfer from this account
            </Link>
          ) : (
            <Link
              href="/app/transfer"
              className="inline-flex rounded-md border border-[#7ec8d8] px-4 py-2.5 text-sm font-medium text-[#7ec8d8] transition hover:bg-[#0a2833]"
            >
              Pay the card
            </Link>
          )}
        </div>

        <section className="space-y-4">
          <h2
            className="text-xl text-[#e8f4f8]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            History
          </h2>

          {entries.length === 0 ? (
            <p className="py-6 text-[#9bb8c4]">No transactions yet.</p>
          ) : (
            <ul className="flex flex-col">
              {entries.map((entry) => {
                const credit = entry.amountCents > 0;
                return (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-4 border-b border-[#1e4a58] py-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium text-[#e8f4f8]">
                        {entry.description}
                      </p>
                      <p className="text-sm text-[#6a8894]">
                        {ENTRY_KIND_LABELS[entry.kind]} ·{" "}
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-lg tabular-nums ${
                        credit ? "text-[#7ec8d8]" : "text-[#e8f4f8]"
                      }`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {credit ? "+" : ""}
                      {formatMoney(entry.amountCents)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

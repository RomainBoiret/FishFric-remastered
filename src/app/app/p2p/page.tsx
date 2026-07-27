import Link from "next/link";
import { redirect } from "next/navigation";
import { ACCOUNT_TYPE_LABELS, formatDateTime } from "@/domain/labels";
import { formatMoney } from "@/domain/money";
import { logoutAction } from "@/features/auth/actions";
import { IncomingP2PList } from "@/features/p2p/IncomingP2PList";
import { FRIEND_CREDENTIALS } from "@/features/p2p/schemas";
import { SendP2PForm } from "@/features/p2p/SendP2PForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function P2PPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const email = session.user.email?.toLowerCase() ?? "";

  const [accounts, incoming, outgoing] = await Promise.all([
    prisma.bankAccount.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
        type: { in: ["CHECKING", "SAVINGS"] },
      },
      orderBy: { openedAt: "asc" },
    }),
    prisma.p2PTransfer.findMany({
      where: {
        status: "PENDING",
        recipientEmail: email,
      },
      include: {
        senderUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.p2PTransfer.findMany({
      where: {
        senderUserId: session.user.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sources = accounts.map((account) => ({
    id: account.id,
    balanceCents: account.balanceCents,
    label: account.label ?? ACCOUNT_TYPE_LABELS[account.type],
  }));

  const incomingItems = incoming.map((p2p) => ({
    id: p2p.id,
    amountCents: p2p.amountCents,
    question: p2p.question,
    expiresAt: p2p.expiresAt.toISOString(),
    senderName: `${p2p.senderUser.firstName} ${p2p.senderUser.lastName}`,
  }));

  const isDemo = session.user.isDemo;

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,#0a4a5c_0%,transparent_45%)]"
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

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 pb-16">
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
            P2P transfer
          </h1>
          <p className="max-w-lg text-[#9bb8c4]">
            Send funds with a security question. The recipient must answer to
            receive the money.
          </p>
          {isDemo ? (
            <p className="text-sm text-[#6a8894]">
              Demo tip: send to{" "}
              <span className="text-[#7ec8d8]">{FRIEND_CREDENTIALS.email}</span>,
              then sign in with that account (same password) to accept.
            </p>
          ) : null}
        </div>

        <section className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <h2
              className="text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Send
            </h2>
            <SendP2PForm
              sources={sources}
              defaultRecipient={isDemo ? FRIEND_CREDENTIALS.email : undefined}
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2
                className="text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                To accept
              </h2>
              <IncomingP2PList items={incomingItems} />
            </div>

            <div className="space-y-4">
              <h2
                className="text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Pending sent
              </h2>
              {outgoing.length === 0 ? (
                <p className="text-sm text-[#6a8894]">No pending sends.</p>
              ) : (
                <ul className="flex flex-col">
                  {outgoing.map((p2p) => (
                    <li
                      key={p2p.id}
                      className="border-b border-[#1e4a58] py-3 text-sm"
                    >
                      <p className="text-[#e8f4f8]">
                        {formatMoney(p2p.amountCents)} → {p2p.recipientEmail}
                      </p>
                      <p className="text-[#6a8894]">
                        Expires {formatDateTime(p2p.expiresAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

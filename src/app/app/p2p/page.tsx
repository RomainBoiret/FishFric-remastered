import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { ACCOUNT_TYPE_LABELS, formatDateTime } from "@/domain/labels";
import { formatMoney } from "@/domain/money";
import { IncomingP2PList } from "@/features/p2p/IncomingP2PList";
import { FRIEND_CREDENTIALS } from "@/features/p2p/schemas";
import { SendP2PForm } from "@/features/p2p/SendP2PForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "P2P transfer",
  description:
    "Send a Fish&Fric P2P transfer locked behind a security question.",
  alternates: { canonical: "/app/p2p" },
};

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
          <h1 className="ff-display text-2xl">P2P transfer</h1>
          <p className="max-w-lg text-sm text-[var(--ff-muted)]">
            Send funds with a security question (bottle drop). The recipient
            answers to claim the transfer.
          </p>
          {isDemo ? (
            <p className="text-sm text-[var(--ff-muted)]">
              Demo tip: send to{" "}
              <span className="font-bold text-[var(--ff-gold)]">
                {FRIEND_CREDENTIALS.email}
              </span>
              , then sign in with that account (same password) to accept.
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="ff-surface space-y-4 p-5 sm:p-6"
            aria-labelledby="p2p-send-heading"
          >
            <h2 id="p2p-send-heading" className="ff-display text-lg">
              Send
            </h2>
            <SendP2PForm
              sources={sources}
              defaultRecipient={isDemo ? FRIEND_CREDENTIALS.email : undefined}
            />
          </section>

          <div className="space-y-6">
            <section
              className="ff-surface space-y-4 p-5 sm:p-6"
              aria-labelledby="p2p-incoming-heading"
            >
              <h2 id="p2p-incoming-heading" className="ff-display text-lg">
                Incoming
              </h2>
              <IncomingP2PList items={incomingItems} />
            </section>

            <section
              className="ff-surface space-y-4 p-5 sm:p-6"
              aria-labelledby="p2p-pending-heading"
            >
              <h2 id="p2p-pending-heading" className="ff-display text-lg">
                Pending sent
              </h2>
              {outgoing.length === 0 ? (
                <p className="text-sm text-[var(--ff-muted)]" role="status">
                  No pending sends.
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {outgoing.map((p2p) => (
                    <li
                      key={p2p.id}
                      className="border-b-2 border-black py-3 text-sm last:border-b-0"
                    >
                      <p className="font-bold text-white">
                        {formatMoney(p2p.amountCents)} → {p2p.recipientEmail}
                      </p>
                      <p className="text-[var(--ff-muted)]">
                        Expires {formatDateTime(p2p.expiresAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader, AppShell } from "@/components/brand/AppShell";
import { NotificationList } from "@/features/notifications/NotificationList";
import { getNotificationsForUser } from "@/features/notifications/queries";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Alerts for P2P transfers and account activity on Fish&Fric.",
  alternates: { canonical: "/app/notifications" },
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await getNotificationsForUser(session.user.id);
  const items = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    href: row.p2pTransferId ? "/app/p2p" : null,
  }));

  const unread = items.filter((item) => item.readAt == null).length;

  return (
    <AppShell>
      <AppHeader />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6"
      >
        <div className="space-y-2">
          <Link
            href="/app"
            className="inline-block text-sm font-bold uppercase tracking-wide text-[var(--ff-muted)] hover:text-[var(--ff-gold)]"
          >
            <span aria-hidden="true">← </span>
            My accounts
          </Link>
          <h1 className="ff-display text-2xl">Notifications</h1>
          <p className="text-sm text-[var(--ff-muted)]">
            {unread === 0
              ? "You are up to date."
              : unread === 1
                ? "1 unread alert."
                : `${unread} unread alerts.`}
          </p>
        </div>

        <section aria-label="Notification list">
          <NotificationList items={items} />
        </section>
      </main>
    </AppShell>
  );
}

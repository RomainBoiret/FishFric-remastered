"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useActionToast } from "@/components/ui/toast";
import { formatDateTime } from "@/domain/labels";
import {
  clearAllNotificationsAction,
  markNotificationReadAction,
  type NotificationActionState,
} from "@/features/notifications/actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  href: string | null;
};

const initial: NotificationActionState = {};

function DismissButton({ notificationId }: { notificationId: string }) {
  const [, formAction, pending] = useActionState(
    markNotificationReadAction,
    initial,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)] hover:text-[var(--ff-gold-hi)] disabled:opacity-60"
        aria-busy={pending}
      >
        {pending ? "…" : "Dismiss"}
      </button>
    </form>
  );
}

function ClearAllButton({ hasItems }: { hasItems: boolean }) {
  const [state, formAction, pending] = useActionState(
    clearAllNotificationsAction,
    initial,
  );
  useActionToast(state, pending);

  if (!hasItems) return null;

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="ff-btn ff-btn-sm ff-btn-ghost"
        aria-busy={pending}
      >
        {pending ? "Clearing…" : "Clear all"}
      </button>
    </form>
  );
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ff-muted)]" role="status">
        No notifications yet. Activity alerts show up here (max 8 kept).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ClearAllButton hasItems={items.length > 0} />
      </div>

      <ul className="ff-surface m-0 list-none overflow-hidden p-0">
        {items.map((item, index) => {
          const unread = item.readAt == null;

          return (
            <li
              key={item.id}
              className={[
                index < items.length - 1 ? "border-b-2 border-black" : "",
                unread ? "bg-black/20" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <article className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <h2 className="m-0 text-base font-bold text-white">
                    {unread ? (
                      <span
                        className="mr-2 inline-block h-2 w-2 bg-[var(--ff-gold)] align-middle"
                        aria-hidden="true"
                      />
                    ) : null}
                    {item.title}
                    {unread ? (
                      <span className="ff-sr-only"> (unread)</span>
                    ) : null}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    {item.body}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-[var(--ff-muted)]">
                    {formatDateTime(new Date(item.createdAt))}
                  </p>
                  {item.href ? (
                    <p className="mt-2">
                      <Link
                        href={item.href}
                        className="text-sm font-bold text-[var(--ff-gold)] hover:text-[var(--ff-gold-hi)]"
                      >
                        Open related transfer
                        <span aria-hidden="true"> ›</span>
                      </Link>
                    </p>
                  ) : null}
                </div>
                <DismissButton notificationId={item.id} />
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

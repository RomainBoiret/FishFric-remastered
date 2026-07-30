import Link from "next/link";
import { auth } from "@/lib/auth";
import { countUnreadNotifications } from "@/features/notifications/queries";

function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2 5h20v14H2V5zm2 2.2V17h16V7.2l-8 5.3-8-5.3zM4.8 7 12 11.8 19.2 7H4.8z"
      />
    </svg>
  );
}

export async function NotificationBell() {
  const session = await auth();
  if (!session?.user) return null;

  const unread = await countUnreadNotifications(session.user.id);
  const label =
    unread === 0
      ? "Notifications"
      : unread === 1
        ? "Notifications, 1 unread"
        : `Notifications, ${unread} unread`;

  return (
    <Link
      href="/app/notifications"
      className="ff-btn ff-btn-icon relative shrink-0"
      aria-label={label}
      title={label}
    >
      <EnvelopeIcon />
      {unread > 0 ? (
        <span
          className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.15rem] items-center justify-center border-2 border-black bg-[var(--ff-ink)] px-1 py-0.5 text-[0.6rem] font-extrabold leading-none text-[var(--ff-gold)]"
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

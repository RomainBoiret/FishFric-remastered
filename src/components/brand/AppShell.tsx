import Link from "next/link";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { BrandMark } from "@/components/brand/BrandMark";
import { GitHubHeaderLink } from "@/components/brand/GitHubLink";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { logoutAction } from "@/features/auth/actions";
import { SITE_NAME } from "@/lib/site";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col text-[var(--ff-ink)]">
      <Atmosphere variant="app" />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        {children}
        <SiteFooter compact />
      </div>
    </div>
  );
}

export function AppHeader({ showLogout = true }: { showLogout?: boolean }) {
  return (
    <header className="ff-nav relative z-20">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/app"
          className="ff-brand inline-flex items-center gap-2 text-base sm:text-lg"
        >
          <BrandMark size={28} className="text-[var(--ff-gold)]" />
          <span>{SITE_NAME}</span>
          <span className="ff-sr-only"> - home</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <GitHubHeaderLink />
          {showLogout ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="ff-btn ff-btn-sm ff-btn-ghost"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

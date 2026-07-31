import Link from "next/link";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { BrandMark } from "@/components/brand/BrandMark";
import { EggBrandLink } from "@/components/brand/EasterEggs";
import { GitHubHeaderLink } from "@/components/brand/GitHubLink";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SoundToggle } from "@/components/brand/SoundToggle";
import { logoutAction } from "@/features/auth/actions";
import { SITE_NAME } from "@/lib/site";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col text-[var(--ff-ink)]">
      <Atmosphere variant="app" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      {/* Sibling of Atmosphere so z-20 beats the chest (z-15); padding stays click-through. */}
      <SiteFooter compact />
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="ff-nav ff-nav-deep relative z-20">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <EggBrandLink
          href="/app"
          className="ff-brand inline-flex min-w-0 items-center gap-2 text-base sm:text-lg"
        >
          <BrandMark size={28} className="shrink-0 text-[var(--ff-gold)]" />
          <span className="truncate">{SITE_NAME}</span>
          <span className="ff-sr-only"> - home</span>
        </EggBrandLink>
        <nav
          aria-label="Account"
          className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2"
        >
          <SoundToggle />
          <Link href="/docs" className="ff-nav-link">
            Docs
          </Link>
          <GitHubHeaderLink />
          <form action={logoutAction}>
            <button type="submit" className="ff-btn ff-btn-sm">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { EggBrandLink } from "@/components/brand/EasterEggs";
import { GitHubHeaderLink } from "@/components/brand/GitHubLink";
import { SoundToggle } from "@/components/brand/SoundToggle";
import { auth } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

type SiteHeaderProps = {
  current?: "home" | "docs";
};

export async function SiteHeader({ current = "home" }: SiteHeaderProps) {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <header className="ff-nav ff-nav-sky relative z-20">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <EggBrandLink
          href={signedIn ? "/app" : "/"}
          className="ff-brand inline-flex min-w-0 items-center gap-2 text-sm sm:text-base"
          aria-current={current === "home" ? "page" : undefined}
        >
          <BrandMark
            size={26}
            className="shrink-0 text-[var(--ff-gold)]"
          />
          <span className="truncate">{SITE_NAME}</span>
        </EggBrandLink>
        <nav aria-label="Primary">
          <ul className="m-0 flex list-none flex-wrap items-center justify-end gap-1.5 p-0 sm:gap-2">
            <li>
              <SoundToggle />
            </li>
            <li>
              {current === "docs" ? (
                <span className="ff-nav-link" aria-current="page">
                  Docs
                </span>
              ) : (
                <Link href="/docs" className="ff-nav-link">
                  Docs
                </Link>
              )}
            </li>
            <li>
              <GitHubHeaderLink />
            </li>
            {signedIn ? (
              <li>
                <Link href="/app" className="ff-btn ff-btn-sm">
                  My accounts
                  <span aria-hidden="true"> ›</span>
                </Link>
              </li>
            ) : (
              <>
                <li className="hidden sm:block">
                  <Link
                    href="/signup"
                    className="ff-btn ff-btn-sm ff-btn-prismarine"
                  >
                    Create account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="ff-btn ff-btn-sm">
                    Sign in
                    <span aria-hidden="true"> ›</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

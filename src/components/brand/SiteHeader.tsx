import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { GitHubHeaderLink } from "@/components/brand/GitHubLink";
import { SITE_NAME } from "@/lib/site";

type SiteHeaderProps = {
  current?: "home" | "docs";
};

export function SiteHeader({ current = "home" }: SiteHeaderProps) {
  return (
    <header className="ff-nav relative z-20">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="ff-brand inline-flex min-w-0 items-center gap-2 text-sm sm:text-base"
          aria-current={current === "home" ? "page" : undefined}
        >
          <BrandMark
            size={26}
            className="shrink-0 text-[var(--ff-gold)]"
          />
          <span className="truncate">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="m-0 flex list-none flex-wrap items-center justify-end gap-1.5 p-0 sm:gap-2">
            <li>
              {current === "docs" ? (
                <span
                  className="inline-block px-2 py-2 text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)]"
                  aria-current="page"
                >
                  Docs
                </span>
              ) : (
                <Link
                  href="/docs"
                  className="inline-block px-2 py-2 text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)] hover:text-[var(--ff-gold)]"
                >
                  Docs
                </Link>
              )}
            </li>
            <li>
              <GitHubHeaderLink />
            </li>
            {current === "home" ? (
              <li className="hidden sm:block">
                <Link
                  href="/signup"
                  className="ff-btn ff-btn-sm ff-btn-prismarine"
                >
                  Create account
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/login" className="ff-btn ff-btn-sm">
                Sign in
                <span aria-hidden="true"> ›</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

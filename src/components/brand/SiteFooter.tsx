import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { SITE_AUTHOR, SITE_NAME } from "@/lib/site";

const YEAR = new Date().getFullYear();

export function SiteFooter({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <footer
      className="relative z-10 mt-auto border-t-2 border-black bg-black/50 px-4 py-6 sm:px-8"
      role="contentinfo"
    >
      <div
        className={`mx-auto flex w-full max-w-5xl flex-col gap-4 ${
          compact
            ? "items-center text-center"
            : "sm:flex-row sm:items-center sm:justify-between"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href="/"
            className="ff-brand inline-flex items-center justify-center gap-2 text-sm sm:justify-start"
          >
            <BrandMark size={20} className="text-[var(--ff-gold)]" />
            {SITE_NAME}
          </Link>
          <p className="text-xs text-[var(--ff-muted)]">
            Ocean-themed banking demo by {SITE_AUTHOR}
          </p>
        </div>

        <nav
          aria-label="Footer"
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-wide ${
            compact ? "justify-center" : ""
          }`}
        >
          <p className="font-normal normal-case tracking-normal text-[var(--ff-muted)]">
            <span aria-hidden="true">© </span>
            <span className="ff-sr-only">Copyright </span>
            {YEAR} {SITE_NAME}. Made by {SITE_AUTHOR}.
          </p>
        </nav>
      </div>
    </footer>
  );
}

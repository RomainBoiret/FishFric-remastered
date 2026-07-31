import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { SITE_AUTHOR, SITE_NAME } from "@/lib/site";

const YEAR = new Date().getFullYear();

function CopyrightLine() {
  return (
    <p className="ff-footer-copy text-xs font-semibold">
      <span aria-hidden="true">© </span>
      <span className="ff-sr-only">Copyright </span>
      {YEAR} {SITE_NAME}. Made by {SITE_AUTHOR}.
    </p>
  );
}

export function SiteFooter({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <footer
      className={`pointer-events-none relative z-20 mt-auto px-4 sm:px-8 ${
        compact
          ? "pt-4 pb-[5.75rem] sm:pt-3 sm:pb-[5.5rem]"
          : "pt-8 pb-[7.5rem] sm:pt-7 sm:pb-[6.75rem]"
      }`}
      role="contentinfo"
    >
      {compact ? (
        <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-col items-center gap-1 text-center">
          <Link
            href="/"
            className="ff-brand ff-footer-copy inline-flex items-center justify-center gap-2 text-sm"
          >
            <BrandMark
              size={18}
              className="text-[var(--ff-gold)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            />
            {SITE_NAME}
          </Link>
          <CopyrightLine />
        </div>
      ) : (
        <div className="pointer-events-auto mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/"
              className="ff-brand ff-footer-copy inline-flex items-center justify-start gap-2 text-sm"
            >
              <BrandMark
                size={20}
                className="text-[var(--ff-gold)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              />
              {SITE_NAME}
            </Link>
            <p className="ff-footer-copy text-xs font-semibold">
              Ocean-themed banking demo by {SITE_AUTHOR}
            </p>
          </div>
          <CopyrightLine />
        </div>
      )}
    </footer>
  );
}

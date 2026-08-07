import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { CraneCable } from "@/components/brand/CraneCable";
import { CraneHook } from "@/components/brand/CraneHook";
import { PixelFish } from "@/components/brand/PixelFish";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SiteHeader } from "@/components/brand/SiteHeader";
import {
  buildDemoChequeSvg,
  chequeSvgDataUri,
} from "@/domain/cheque-svg";
import { DemoButton } from "@/features/auth/DemoButton";
import {
  DEMO_CREDENTIALS,
  SITE_AUTHOR,
  SITE_GITHUB,
  SITE_GITHUB_ORIGINAL,
  SITE_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs",
  description: `The story of ${SITE_NAME}: from an ÉTS team integrator project to a solo remaster with signed cheque deposits.`,
  alternates: { canonical: "/docs" },
};

const TIMELINE = [
  {
    year: "2024",
    depth: "Surface",
    title: "ÉTS team integrator",
    body: "Fish&Fric began as a school banking demo built with a team: ocean theme, accounts, and the first clickable ledger.",
    accent: "#5ec8e8",
    fish: { color: "#5ec8e8", fin: "#2f6f9f" },
  },
  {
    year: "2026",
    depth: "Mid reef",
    title: "Solo remaster",
    body: "Rebuilt from scratch: Next.js, Prisma, Auth.js, and a stricter domain layer you can audit.",
    accent: "#2d8f83",
    fish: { color: "#7ed957", fin: "#2d6b1a" },
  },
  {
    year: "Now",
    depth: "Deep water",
    title: "Live demo reef",
    body: "Recruiters can sign in, move money, deposit signed cheques, and watch every cent land on an append-only ledger.",
    accent: "#e0aa2c",
    fish: { color: "#f2a63a", fin: "#c87820" },
  },
] as const;

const CHEQUE_FLOW = [
  {
    title: "Cast",
    body: "The server issues a unique instrument bound to your payee, amount, and expiry.",
    accent: "#7ec8e8",
  },
  {
    title: "Seal",
    body: "An HMAC seals the cheque. Tampering the SVG breaks the signature check.",
    accent: "#f0c040",
  },
  {
    title: "Catch once",
    body: "Pending becomes credited on the ledger. The same file cannot be cashed twice.",
    accent: "#ff8f8f",
  },
] as const;

const REEF = [
  {
    title: "Immutable tide log",
    subtitle: "Source of truth",
    body: "Transfers, bills, P2P, and deposits write signed cent entries. The on-screen balance is a cache we can prove against the log.",
    accent: "#3db8a8",
    bullets: [
      "Double-entry cent writes",
      "Balance = Σ ledger entries",
      "Auditable history",
    ],
  },
  {
    title: "P2P bottle drops",
    subtitle: "Locked send",
    body: "Send money locked behind a security question. Accept unlocks the flow; decline returns funds on the ledger.",
    accent: "#7ec8e8",
    bullets: [
      "Question-gated transfer",
      "Accept or decline",
      "Funds held until clear",
    ],
  },
  {
    title: "Alerts & tidy history",
    subtitle: "Keep the deck clear",
    body: "Notifications and histories share one management model. Clearing never rewrites balances.",
    accent: "#d4c08a",
    bullets: [
      "Dismiss one or clear all",
      "Auto-capped lists",
      "Balances stay put",
    ],
  },
] as const;

export default function DocsPage() {
  const chequeSrc = chequeSvgDataUri(
    buildDemoChequeSvg({
      amountCents: 12_000,
      payeeName: "Aqua Recruiter",
      memo: "Ocean demo cheque",
      chequeId: "cdocsstorycheque01",
      payeeUserId: "docs-preview",
      signature: "a1b2c3d4e5f6789012345678abcdef01",
      expiresAtMs: 1_893_456_000_000,
      dateLabel: "Jul 29, 2026",
    }),
  );

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Atmosphere variant="hero" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-full min-h-full overflow-visible"
        aria-hidden
      >
        <CraneCable />
      </div>

      <SiteHeader current="docs" />

      <main id="main-content" className="relative z-10 flex flex-1 flex-col">
        {/* Hero - left-aligned like home, boat space on the right */}
        <section
          className="mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-8 lg:px-12"
          aria-labelledby="docs-heading"
        >
          <div
            className="ff-hero-sky ff-in relative z-[6] grid items-center gap-4 pb-8 pt-14 md:grid-cols-[minmax(0,1fr)_minmax(12rem,34%)] md:gap-10 md:pb-10 md:pt-16"
            style={{ minHeight: "calc(var(--ff-waterline) - 4rem)" }}
          >
            <div className="ff-px-title flex max-w-xl flex-col justify-center gap-4">
              <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
                {SITE_NAME} · remastered by {SITE_AUTHOR}
              </p>
              <h1
                id="docs-heading"
                className="ff-display text-4xl leading-tight text-white sm:text-5xl"
                style={{ textShadow: "0 2px 0 rgba(15,48,68,0.4)" }}
              >
                Captain&apos;s log
              </h1>
              <p className="ff-docs-lead [text-shadow:0_1px_2px_rgba(15,48,68,0.5)]">
                How this ocean-pixel bank grew from a team school project, plus
                the signed cheque catch and the rest of the reef.
              </p>
              <nav
                aria-label="Log sections"
                className="flex flex-wrap gap-x-1 gap-y-2 pt-1 text-base font-bold"
              >
                {[
                  { href: "#history-heading", label: "History" },
                  { href: "#cheque-heading", label: "Cheque catch" },
                  { href: "#reef-heading", label: "Reef notes" },
                  { href: "#dive-heading", label: "Dive in" },
                ].map((link, i) => (
                  <span key={link.href} className="inline-flex items-center">
                    {i > 0 ? (
                      <span className="mx-2 text-white/40" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <a
                      href={link.href}
                      className={
                        i === 0
                          ? "text-[var(--ff-gold)] hover:text-[var(--ff-gold-hi)]"
                          : "text-white hover:text-[var(--ff-gold-hi)]"
                      }
                    >
                      {link.label}
                    </a>
                  </span>
                ))}
              </nav>
            </div>

            {/* Desktop: reserves right column so copy never sits under the boat */}
            <div
              className="pointer-events-none relative hidden md:block"
              aria-hidden
            />
          </div>
        </section>

        {/* History timeline */}
        <section
          className="px-4 pb-12 pt-16 sm:px-8 sm:pt-20 lg:px-12"
          aria-labelledby="history-heading"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
                  01 · Descent
                </p>
                <h2
                  id="history-heading"
                  className="ff-display text-3xl text-white sm:text-4xl"
                >
                  Project history
                </h2>
                <p className="ff-docs-copy">
                  Three depths from the first ÉTS build to the reef online now.
                  All balances and users stay fictional.
                </p>
              </div>

              <aside className="ff-docs-panel space-y-3 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--ff-gold)]">
                  Original team repo
                </p>
                <p className="ff-docs-copy text-base">
                  The first Fish&amp;Fric was an{" "}
                  <strong className="font-bold text-white">
                    ÉTS integrator team project
                  </strong>{" "}
                  (2024). This remaster keeps the ocean spirit.
                </p>
                <a
                  href={SITE_GITHUB_ORIGINAL}
                  className="inline-flex text-base font-bold text-[var(--ff-gold)] hover:text-[var(--ff-gold-hi)]"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open FishFric-Bank
                  <span aria-hidden="true"> ›</span>
                </a>
              </aside>
            </div>

            <ol className="relative m-0 list-none space-y-5 p-0">
              <div
                className="absolute bottom-6 left-[1.15rem] top-6 w-0.5 bg-gradient-to-b from-[#5ec8e8] via-[#2d8f83] to-[#e0aa2c]"
                aria-hidden
              />
              {TIMELINE.map((item, index) => (
                <li key={item.year} className="relative flex gap-4">
                  <div className="relative z-10 flex w-9 shrink-0 justify-center pt-4">
                    <span
                      className="flex h-9 w-9 items-center justify-center border-2 border-black text-sm font-extrabold text-black shadow-[2px_2px_0_#000]"
                      style={{ background: item.accent }}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                  </div>
                  <article className="ff-docs-panel min-w-0 flex-1 p-5 sm:p-6">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p
                        className="text-xs font-extrabold uppercase tracking-[0.14em]"
                        style={{ color: item.accent }}
                      >
                        {item.depth}
                      </p>
                      <span className="ff-display text-base text-[var(--ff-gold)]">
                        {item.year}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <h3 className="text-lg font-bold text-white sm:text-xl">
                          {item.title}
                        </h3>
                        <p className="ff-docs-copy">{item.body}</p>
                      </div>
                      <div
                        className="ff-bob hidden shrink-0 sm:block"
                        style={{ animationDelay: `${index * 0.35}s` }}
                        aria-hidden
                      >
                        <PixelFish
                          size={24}
                          color={item.fish.color}
                          fin={item.fish.fin}
                          facing={index % 2 === 0 ? "right" : "left"}
                        />
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Cheque */}
        <section
          className="px-4 py-14 sm:px-8 sm:py-16 lg:px-12"
          aria-labelledby="cheque-heading"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className="ff-display text-xs uppercase tracking-widest text-[#ff8f8f]">
                02 · Trophy catch
              </p>
              <h2
                id="cheque-heading"
                className="ff-display text-3xl text-white sm:text-4xl"
              >
                Signed cheque deposit
              </h2>
              <p className="ff-docs-copy">
                The remaster&apos;s showpiece: issue a demo cheque, deposit it,
                and let anti-fraud rules fire underwater.
              </p>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
              <figure className="relative m-0">
                <div
                  className="absolute -inset-1 border-2 border-[var(--ff-gold)]/50"
                  aria-hidden
                />
                <div className="relative overflow-hidden border-2 border-black bg-[#d7e4ea] shadow-[6px_6px_0_#000]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={chequeSrc}
                    alt="Sample Fish&Fric demo cheque for $120.00 payable to Aqua Recruiter"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="ff-docs-copy mt-3 flex flex-wrap justify-between gap-2 text-sm">
                  <span>Unique ID · payee · HMAC metadata</span>
                  <span className="font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                    One-time clear
                  </span>
                </figcaption>
              </figure>

              <div className="flex flex-col gap-4">
                <ol className="ff-docs-panel m-0 list-none space-y-0 p-2 sm:p-3">
                  {CHEQUE_FLOW.map((step, index) => (
                    <li
                      key={step.title}
                      className="flex gap-4 border-b border-white/15 px-3 py-5 last:border-b-0 sm:px-4"
                    >
                      <span
                        className="ff-display w-9 shrink-0 text-base"
                        style={{ color: step.accent }}
                      >
                        0{index + 1}
                      </span>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-white">
                          {step.title}
                        </h3>
                        <p className="ff-docs-copy text-base">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/login"
                  className="ff-btn ff-btn-danger inline-flex w-full justify-center sm:w-auto"
                >
                  Try cheque deposit
                  <span aria-hidden="true"> ›</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Reef notes */}
        <section
          className="px-4 py-14 sm:px-8 sm:py-16 lg:px-12"
          aria-labelledby="reef-heading"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
                03 · Reef notes
              </p>
              <h2
                id="reef-heading"
                className="ff-display text-3xl text-white sm:text-4xl"
              >
                What else is swimming
              </h2>
              <p className="ff-docs-copy">
                A few more pieces worth knowing before you open the demo.
              </p>
            </div>

            <ul className="m-0 grid list-none gap-5 p-0 lg:grid-cols-3">
              {REEF.map((item) => (
                <li
                  key={item.title}
                  className="ff-docs-panel flex flex-col gap-4 p-5 sm:p-6"
                >
                  <div
                    className="h-2 w-10"
                    style={{ background: item.accent }}
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                      {item.subtitle}
                    </p>
                  </div>
                  <p className="ff-docs-copy text-base">{item.body}</p>
                  <ul className="m-0 mt-auto space-y-2.5 border-t border-white/15 pt-4 pl-0">
                    {item.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex list-none items-start gap-2.5 text-base text-[#e4eef2]"
                      >
                        <span
                          className="mt-2 h-2 w-2 shrink-0"
                          style={{ background: item.accent }}
                          aria-hidden
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Dive in - hung from the boat crane */}
        <section
          className="px-4 pb-20 pt-8 sm:px-8 sm:pb-24 lg:px-12"
          aria-labelledby="dive-heading"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 border-t-2 border-white/15 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:gap-10">
            <div className="ff-docs-panel ff-crane-cargo relative space-y-5 p-6 sm:p-8">
              <div className="ff-crane-hook-wrap" aria-hidden>
                <CraneHook />
              </div>
              <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
                04 · Dive in
              </p>
              <h2
                id="dive-heading"
                className="ff-display text-3xl text-white sm:text-4xl"
              >
                The reef is open
              </h2>
              <p className="ff-docs-copy max-w-lg">
                One click loads the seeded demo. Prefer source? Open the remaster
                or the original team project.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <DemoButton className="ff-btn" label="Try the demo" />
                <a
                  href={SITE_GITHUB}
                  className="ff-btn ff-btn-prismarine inline-flex justify-center"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Remaster repo
                  <span aria-hidden="true"> ›</span>
                </a>
                <a
                  href={SITE_GITHUB_ORIGINAL}
                  className="ff-btn ff-btn-stone inline-flex justify-center"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Original repo
                  <span aria-hidden="true"> ›</span>
                </a>
              </div>
              <p className="text-base">
                <Link
                  href="/"
                  className="font-bold text-white hover:text-[var(--ff-gold-hi)]"
                >
                  ← Back to home
                </Link>
              </p>
            </div>

            <aside className="ff-docs-panel-soft space-y-4 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--ff-gold)]">
                Demo credentials
              </p>
              <ul className="m-0 space-y-5 p-0">
                {DEMO_CREDENTIALS.map((account) => (
                  <li
                    key={account.email}
                    className="list-none border-l-2 border-[var(--ff-gold)] pl-3"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                      {account.label}
                    </p>
                    <p className="mt-1.5 break-all font-mono text-sm text-white">
                      {account.email}
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-[#d5e4ea]">
                      {account.password}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-[#d5e4ea]">
                Fictional accounts only. Never reuse real banking passwords.
              </p>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

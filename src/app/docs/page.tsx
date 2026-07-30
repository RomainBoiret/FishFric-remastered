import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { BrandMark } from "@/components/brand/BrandMark";
import { GitHubHeaderLink } from "@/components/brand/GitHubLink";
import { PixelFish } from "@/components/brand/PixelFish";
import { SiteFooter } from "@/components/brand/SiteFooter";
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
  description: `The story of ${SITE_NAME} - from an ÉTS team integrator project to a solo remaster with signed cheque deposits.`,
  alternates: { canonical: "/docs" },
};

const TIMELINE = [
  {
    year: "2024",
    title: "ÉTS team integrator",
    body: "Fish&Fric began as a school banking demo built with a team - ocean theme, accounts, and the first clickable ledger.",
    accent: "#2f6f9f",
  },
  {
    year: "2026",
    title: "Solo remaster",
    body: "Rebuilt from scratch for portfolio review: Next.js, Prisma, Auth.js, and a stricter domain layer you can audit.",
    accent: "#2d8f83",
  },
  {
    year: "Now",
    title: "Live demo reef",
    body: "Recruiters can sign in, move money, deposit signed cheques, and watch every cent hit an immutable ledger.",
    accent: "#e0aa2c",
  },
];

const CHEQUE_FLOW = [
  {
    title: "Issue",
    body: "The server creates a unique instrument bound to your payee, amount, and expiry.",
  },
  {
    title: "Sign",
    body: "An HMAC seals the cheque. Tampering the SVG breaks the signature check.",
  },
  {
    title: "Deposit once",
    body: "Pending → credited on the ledger. The same file cannot be cashed twice.",
  },
];

function LedgerIllustration() {
  return (
    <div
      className="relative overflow-hidden border-2 border-black bg-gradient-to-b from-[#164554] to-[#0d2832] p-5"
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--ff-gold)]"
        aria-hidden="true"
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
            Tide log
          </p>
          <p className="ff-display text-base text-white">Ledger entries</p>
        </div>
        <span className="border-2 border-black bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ff-muted)]">
          cents
        </span>
      </div>
      <ul className="m-0 space-y-2 p-0">
        {[
          { label: "Transfer out", amount: "−4,500", ok: false },
          { label: "P2P received", amount: "+12,000", ok: true },
          { label: "Cheque deposit", amount: "+12,000", ok: true },
          { label: "Bill · TideNet", amount: "−3,299", ok: false },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 border-2 border-black bg-black/35 px-3 py-2.5 text-xs"
          >
            <span className="text-[var(--ff-muted)]">{row.label}</span>
            <span
              className={`ff-display tabular-nums ${
                row.ok ? "text-[var(--ff-ok)]" : "text-white"
              }`}
            >
              {row.amount}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t-2 border-black/50 pt-3 text-center text-[10px] uppercase tracking-wide text-[var(--ff-gold)]">
        balanceCents = Σ entries
      </p>
    </div>
  );
}

function P2PIllustration() {
  return (
    <div
      className="relative flex min-h-48 flex-col justify-between overflow-hidden border-2 border-black bg-gradient-to-br from-[#1a4a58] to-[#0f2c36] p-5"
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--ff-prismarine)]/20"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
            Bottle drop
          </p>
          <p className="ff-display text-lg text-white">Security question</p>
          <p className="max-w-[14rem] text-sm text-[var(--ff-muted)]">
            Favorite reef fish?
          </p>
        </div>
        <div className="border-2 border-black bg-black/30 p-2">
          <PixelFish size={32} color="#5ec8e8" fin="#2f6f9f" />
        </div>
      </div>
      <div className="relative mt-5 border-2 border-[var(--ff-prismarine)] bg-[var(--ff-prismarine)]/15 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-white">
        Funds held until the answer clears
      </div>
    </div>
  );
}

function AlertsIllustration() {
  return (
    <div
      className="relative overflow-hidden border-2 border-black bg-gradient-to-b from-[#164554] to-[#0d2832] p-5"
      aria-hidden="true"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
            Inbox
          </p>
          <p className="ff-display text-base text-white">Alerts</p>
        </div>
        <span className="border-2 border-[var(--ff-gold)] bg-black/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ff-gold)]">
          Clear all
        </span>
      </div>
      <ul className="m-0 space-y-2 p-0">
        {[
          { title: "Mobile deposit credited", unread: true },
          { title: "P2P transfer received", unread: false },
          { title: "Bill payment sent", unread: false },
        ].map((item) => (
          <li
            key={item.title}
            className={`flex items-start gap-3 border-2 border-black px-3 py-2.5 ${
              item.unread ? "bg-black/45" : "bg-black/25"
            }`}
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${
                item.unread ? "bg-[var(--ff-gold)]" : "bg-[var(--ff-muted)]/40"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {item.title}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                Dismiss
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DocsPage() {
  const chequeSrc = chequeSvgDataUri(
    buildDemoChequeSvg({
      amountCents: 12_000,
      payeeName: "Aqua Recruiter",
      memo: "Portfolio demo cheque",
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

      <header className="ff-nav relative z-20">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="ff-brand inline-flex items-center gap-2 text-sm sm:text-base"
          >
            <BrandMark size={26} className="text-[var(--ff-gold)]" />
            <span>{SITE_NAME}</span>
          </Link>
          <nav aria-label="Primary">
            <ul className="m-0 flex list-none items-center gap-2 p-0">
              <li>
                <span
                  className="px-2 text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)]"
                  aria-current="page"
                >
                  Docs
                </span>
              </li>
              <li>
                <GitHubHeaderLink />
              </li>
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

      <main id="main-content" className="relative z-10 flex flex-1 flex-col">
        <section
          className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="docs-heading"
        >
          <div className="ff-in max-w-2xl space-y-5">
            <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
              Story · features · illustrations
            </p>
            <h1
              id="docs-heading"
              className="ff-brand text-4xl leading-tight sm:text-5xl md:text-6xl"
            >
              {SITE_NAME}
            </h1>
            <p className="text-base leading-relaxed text-white/90 sm:text-lg">
              From a team school project to a solo remaster you can click
              through - with a real ledger and a few favorite tricks.
            </p>
          </div>
        </section>

        <section
          className="border-t-4 border-black bg-[#0a222c] px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="history-heading"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="space-y-5">
              <div className="space-y-3">
                <h2
                  id="history-heading"
                  className="ff-display text-2xl text-white sm:text-3xl"
                >
                  A short history
                </h2>
                <p className="text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
                  Remastered by {SITE_AUTHOR}. All balances and users are
                  fictional - this is a portfolio demo, not a bank.
                </p>
              </div>

              <aside className="ff-surface ff-surface-accent space-y-3 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
                  Original team repo
                </p>
                <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                  The first Fish&amp;Fric was an{" "}
                  <strong className="font-bold text-white">
                    ÉTS integrator team project
                  </strong>{" "}
                  (2024). This remastered app is a solo rebuild for portfolio
                  review - same spirit, new stack.
                </p>
                <a
                  href={SITE_GITHUB_ORIGINAL}
                  className="ff-btn ff-btn-sm ff-btn-stone inline-flex"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open FishFric-Bank
                  <span aria-hidden="true"> ›</span>
                </a>
              </aside>
            </div>

            <ol className="relative m-0 space-y-0 p-0">
              <div
                className="absolute bottom-4 left-[1.15rem] top-4 w-0.5 bg-[var(--ff-gold)]/40"
                aria-hidden="true"
              />
              {TIMELINE.map((item, index) => (
                <li key={item.year} className="relative flex gap-4 pb-4 last:pb-0">
                  <span
                    className="relative z-10 mt-4 flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black text-[10px] font-extrabold text-black"
                    style={{ background: item.accent }}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="ff-surface min-w-0 flex-1 space-y-2 p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="ff-display text-sm text-[var(--ff-gold)]">
                        {item.year}
                      </span>
                      <h3 className="font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="border-t-4 border-black bg-[#071218] px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="cheque-heading"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div className="max-w-2xl space-y-3">
              <p className="inline-block border-2 border-[var(--ff-danger)] bg-[var(--ff-danger)]/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#ff8f8f]">
                Favorite feature
              </p>
              <h2
                id="cheque-heading"
                className="ff-display text-2xl text-white sm:text-3xl"
              >
                Signed cheque deposit
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
                The remaster&apos;s showpiece: issue a demo cheque to your PC,
                then deposit it like a mobile capture - with anti-fraud rules
                that actually fire.
              </p>
            </div>

            <figure className="ff-in relative m-0">
              <div
                className="absolute -inset-1 border-2 border-[var(--ff-gold)]/50"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden border-2 border-black bg-[#d7e4ea] shadow-[8px_8px_0_#000]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chequeSrc}
                  alt="Sample Fish&Fric demo cheque for $120.00 payable to Aqua Recruiter"
                  className="h-auto w-full"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-black bg-[#0b1a22] px-4 py-3 text-xs text-[var(--ff-muted)]">
                  <span>
                    Server-issued preview - unique ID, payee line, HMAC metadata.
                  </span>
                  <span className="font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                    One-time clear
                  </span>
                </figcaption>
              </div>
            </figure>

            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
              {CHEQUE_FLOW.map((step, index) => (
                <li
                  key={step.title}
                  className="ff-surface relative space-y-3 overflow-hidden p-5"
                >
                  <div
                    className="absolute left-0 top-0 h-full w-1 bg-[var(--ff-danger)]"
                    aria-hidden="true"
                  />
                  <p className="ff-display text-3xl text-[var(--ff-gold)]/35">
                    0{index + 1}
                  </p>
                  <div className="space-y-1">
                    <p className="ff-display text-base text-white">
                      {step.title}
                    </p>
                    <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div>
              <Link href="/login" className="ff-btn ff-btn-danger inline-flex">
                Try cheque deposit
                <span aria-hidden="true"> ›</span>
              </Link>
            </div>
          </div>
        </section>

        <section
          className="border-t-4 border-black bg-[#0a222c] px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="more-heading"
        >
          <div className="mx-auto w-full max-w-5xl space-y-12">
            <div className="max-w-xl space-y-2">
              <h2
                id="more-heading"
                className="ff-display text-2xl text-white sm:text-3xl"
              >
                Other highlights
              </h2>
              <p className="text-sm text-[var(--ff-muted)] sm:text-base">
                Same ocean vibe - a few more pieces worth clicking.
              </p>
            </div>

            <article className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
              <LedgerIllustration />
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
                  Source of truth
                </p>
                <h3 className="ff-display text-xl text-white sm:text-2xl">
                  Immutable ledger
                </h3>
                <p className="text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
                  Transfers, bills, P2P, and deposits all write signed cent
                  entries. The on-screen balance is a cache - we can prove it
                  still matches the sum of the tide log.
                </p>
              </div>
            </article>

            <article className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
              <div className="order-2 space-y-3 lg:order-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-prismarine)]">
                  Locked send
                </p>
                <h3 className="ff-display text-xl text-white sm:text-2xl">
                  P2P bottle drops
                </h3>
                <p className="text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
                  Send money locked behind a security question. Accept or
                  decline unlocks the flow - decline returns the funds on the
                  ledger.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <P2PIllustration />
              </div>
            </article>

            <article className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
              <AlertsIllustration />
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-sand)]">
                  Keep it tidy
                </p>
                <h3 className="ff-display text-xl text-white sm:text-2xl">
                  Alerts & tidy history
                </h3>
                <p className="text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
                  Notifications, deposit history, and account history share the
                  same management model: dismiss one, clear all, auto-cap.
                  Clearing never rewrites balances.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section
          className="border-t-4 border-black bg-[#071218] px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="try-heading"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="relative overflow-hidden border-2 border-black bg-[#12323c]">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-[var(--ff-gold)]"
                aria-hidden="true"
              />
              <div className="space-y-6 p-6 sm:p-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
                    Ready when you are
                  </p>
                  <h2
                    id="try-heading"
                    className="ff-display text-2xl text-white sm:text-3xl"
                  >
                    Dive in
                  </h2>
                  <p className="max-w-lg text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
                    Jump into the pre-loaded demo reef - no signup needed. Prefer
                    the source? Grab the remaster or the original team project.
                  </p>
                </div>

                <DemoButton className="ff-btn w-full" label="Try the demo" />

                <div className="space-y-3 border-t-2 border-black/50 pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-gold)]">
                    Demo credentials
                  </p>
                  <p className="text-xs text-[var(--ff-muted)]">
                    Fictional accounts only - never use real banking passwords.
                  </p>
                  <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                    {DEMO_CREDENTIALS.map((account) => (
                      <li
                        key={account.email}
                        className="border-2 border-black bg-black/30 px-3 py-3"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                          {account.label}
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-white">
                          {account.email}
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-[var(--ff-muted)]">
                          {account.password}
                        </p>
                        <p className="mt-2 text-[10px] text-[var(--ff-muted)]">
                          {account.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-3 border-t-2 border-black/50 pt-5 sm:grid-cols-2">
                  <a
                    href={SITE_GITHUB}
                    className="ff-btn ff-btn-prismarine inline-flex w-full justify-center"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Remaster repo
                    <span aria-hidden="true"> ›</span>
                  </a>
                  <a
                    href={SITE_GITHUB_ORIGINAL}
                    className="ff-btn ff-btn-stone inline-flex w-full justify-center"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Original team repo
                    <span aria-hidden="true"> ›</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

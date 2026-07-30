import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { BrandMark } from "@/components/brand/BrandMark";
import { GitHubHeaderLink } from "@/components/brand/GitHubLink";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { DemoButton } from "@/features/auth/DemoButton";
import { auth } from "@/lib/auth";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} - Ocean banking demo` },
  description: SITE_TAGLINE,
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    title: "Accounts",
    subtitle: "Your chests",
    body: "Checking, savings, and a Shark Card - balances you can open and inspect.",
    accent: "#2d8f83",
  },
  {
    title: "Transfers",
    subtitle: "Swim between pockets",
    body: "Move money between your own accounts in a few clicks.",
    accent: "#e0aa2c",
  },
  {
    title: "P2P",
    subtitle: "Bottle drops",
    body: "Send funds locked behind a security question the recipient must answer.",
    accent: "#5ec8e8",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Open the demo",
    body: "One click loads a seeded account with sample money.",
  },
  {
    n: "2",
    title: "Browse your accounts",
    body: "Check balances and the transaction history (tide log).",
  },
  {
    n: "3",
    title: "Try a transfer",
    body: "Move funds internally, or send a P2P transfer with a riddle.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Atmosphere variant="hero" />

      <header className="ff-nav relative z-20">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="ff-brand inline-flex items-center gap-2 text-sm sm:text-base"
            aria-current="page"
          >
            <BrandMark size={26} className="text-[var(--ff-gold)]" />
            <span>{SITE_NAME}</span>
          </Link>
          <nav aria-label="Primary">
            <ul className="m-0 flex list-none items-center gap-2 p-0">
              <li>
                <GitHubHeaderLink />
              </li>
              <li>
                <Link
                  href="/signup"
                  className="ff-btn ff-btn-sm ff-btn-sand"
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
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" className="relative z-10 flex flex-1 flex-col">
        <section
          className="flex min-h-[calc(100svh-56px)] flex-col"
          aria-labelledby="home-heading"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-12 sm:px-8 lg:px-12">
            <div className="ff-in max-w-2xl space-y-4">
              <p className="ff-display text-xs uppercase tracking-widest text-[var(--ff-gold)]">
                Portfolio demo · ocean bank
              </p>
              <h1
                id="home-heading"
                className="ff-brand text-4xl leading-tight sm:text-5xl md:text-6xl"
              >
                {SITE_NAME}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
                A ocean-pixel-style banking demo you can click through - accounts,
                transfers, and P2P on a real ledger.
              </p>
            </div>

            <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
              <div className="ff-in ff-in-1 ff-surface ff-surface-step ff-surface-accent w-full space-y-4 p-5 sm:p-6">
                <h2 className="ff-display text-xl text-white sm:text-2xl">
                  Start exploring
                </h2>
                <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                  Use the demo reef (pre-loaded data) or create your own
                  account.
                </p>
                <div className="flex flex-col gap-3">
                  <DemoButton className="ff-btn w-full" label="Try the demo" />
                  <Link href="/signup" className="ff-btn ff-btn-stone w-full">
                    Create an account
                    <span aria-hidden="true"> ›</span>
                  </Link>
                </div>
              </div>

              <ul className="ff-in ff-in-2 m-0 grid list-none gap-3 p-0 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {FEATURES.map((item, index) => (
                  <li
                    key={`hero-${item.title}`}
                    className="ff-surface ff-in flex flex-col justify-between gap-3 bg-[var(--ff-bg-panel)]/95 p-4"
                    style={{ animationDelay: `${0.22 + index * 0.08}s` }}
                  >
                    <div
                      className="h-2 w-10"
                      style={{ background: item.accent }}
                      aria-hidden="true"
                    />
                    <div className="space-y-1">
                      <h3 className="ff-display text-base text-white">
                        {item.title}
                      </h3>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                        {item.subtitle}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--ff-muted)] sm:text-sm">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          className="border-t-4 border-black bg-[#0a222c] px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="max-w-xl space-y-2">
              <h2
                id="features-heading"
                className="ff-display text-2xl text-white sm:text-3xl"
              >
                What you can do
              </h2>
              <p className="text-sm text-[var(--ff-muted)] sm:text-base">
                Three clear features - same ocean vibe, plain banking actions.
              </p>
            </div>

            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
              {FEATURES.map((item) => (
                <li key={item.title} className="ff-surface space-y-3 p-5">
                  <div
                    className="h-2 w-10"
                    style={{ background: item.accent }}
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <h3 className="ff-display text-lg text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-gold)]">
                      {item.subtitle}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="border-t-4 border-black bg-[#071218] px-4 py-14 sm:px-8 lg:px-12"
          aria-labelledby="howto-heading"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2
                  id="howto-heading"
                  className="ff-display text-2xl text-white sm:text-3xl"
                >
                  How it works
                </h2>
                <p className="text-sm text-[var(--ff-muted)] sm:text-base">
                  Built for recruiters who want to click around quickly.
                </p>
              </div>
              <ol className="m-0 space-y-4 p-0">
                {STEPS.map((step) => (
                  <li key={step.n} className="ff-surface flex gap-4 p-4">
                    <span
                      className="ff-display shrink-0 text-lg text-[var(--ff-gold)]"
                      aria-hidden="true"
                    >
                      {step.n}
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-bold text-white">
                        <span className="ff-sr-only">Step {step.n}: </span>
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside
              className="ff-surface space-y-5 p-5 sm:p-6"
              aria-labelledby="try-now-heading"
            >
              <h2
                id="try-now-heading"
                className="ff-display text-xl text-white"
              >
                Try it now
              </h2>
              <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                The demo opens a ready-made account so you can explore transfers
                and P2P without signing up.
              </p>
              <ul className="m-0 space-y-2 border-y-2 border-black/40 py-4 pl-5 text-sm text-[var(--ff-muted)]">
                <li>Real ledger (amounts stored in cents)</li>
                <li>Internal transfers between your accounts</li>
                <li>P2P transfers with a security question</li>
              </ul>
              <DemoButton className="ff-btn w-full" label="Try the demo" />
              <Link
                href="/login"
                className="block text-center text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)] hover:text-white"
              >
                Already have an account? Sign in
                <span aria-hidden="true"> →</span>
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

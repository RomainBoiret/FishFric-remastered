import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/features/auth/DemoButton";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            className="ff-drift object-cover object-center"
            sizes="100vw"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,16,24,0.55)_0%,rgba(4,22,31,0.72)_45%,rgba(4,22,31,0.92)_100%)]"
          />
          <div
            aria-hidden
            className="ff-shimmer absolute inset-0 bg-[radial-gradient(ellipse_at_30%_15%,rgba(126,200,216,0.22),transparent_50%)]"
          />
        </div>

        <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-6 px-6 pb-20 pt-28 sm:justify-center sm:pb-24">
          <p
            className="ff-rise text-6xl tracking-tight text-[#7ec8d8] sm:text-7xl md:text-8xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Fish&Fric
          </p>
          <h1
            className="ff-rise ff-rise-delay-1 max-w-xl text-2xl font-medium leading-snug text-[#e8f4f8] sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The bank that swims with you.
          </h1>
          <p className="ff-rise ff-rise-delay-2 max-w-md text-lg leading-relaxed text-[#c5dbe3]">
            Accounts, transfers, and a real ledger — an ocean-themed banking
            demo for curious recruiters.
          </p>
          <div className="ff-rise ff-rise-delay-3 flex flex-wrap items-start gap-3 pt-2">
            <DemoButton className="rounded-md bg-[#7ec8d8] px-5 py-2.5 text-sm font-semibold text-[#04161f] transition hover:bg-[#9ad7e4] disabled:opacity-60" />
            <Link
              href="/login"
              className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-medium text-[#e8f4f8] transition hover:border-[#7ec8d8] hover:text-[#7ec8d8]"
            >
              Sign in
            </Link>
          </div>
        </main>
      </section>

      <section className="relative border-t border-[#1e4a58] bg-[#04161f] px-6 py-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h2
            className="text-2xl text-[#e8f4f8] sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Explore the demo in a minute.
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-[#9bb8c4]">
            Open three accounts, move funds, send a P2P transfer with a security
            question. Everything runs on a real PostgreSQL ledger.
          </p>
          <Link
            href="/signup"
            className="mt-2 w-fit text-sm font-medium text-[#7ec8d8] underline-offset-4 transition hover:underline"
          >
            Or create your own account →
          </Link>
        </div>
      </section>
    </div>
  );
}

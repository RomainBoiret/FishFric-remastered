import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/features/auth/DemoButton";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#0a4a5c_0%,transparent_55%),radial-gradient(ellipse_at_80%_70%,#063040_0%,transparent_50%)]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-24">
        <p
          className="text-5xl tracking-tight text-[#7ec8d8] sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fish&Fric
        </p>
        <h1
          className="max-w-xl text-2xl font-medium leading-snug text-[#e8f4f8] sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          La banque qui nage avec toi.
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-[#9bb8c4]">
          Remaster full-stack — comptes, transferts, ledger et mode démo pour
          les recruteurs curieux.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/inscription"
            className="rounded-md bg-[#7ec8d8] px-5 py-2.5 text-sm font-semibold text-[#04161f] transition hover:bg-[#9ad7e4]"
          >
            Ouvrir un compte
          </Link>
          <Link
            href="/connexion"
            className="rounded-md border border-[#1e4a58] px-5 py-2.5 text-sm font-medium text-[#e8f4f8] transition hover:border-[#7ec8d8]"
          >
            Connexion
          </Link>
          <DemoButton />
        </div>
      </main>
    </div>
  );
}

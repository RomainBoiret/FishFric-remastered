import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/features/auth/SignupForm";
import { auth } from "@/lib/auth";

export default async function InscriptionPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,#0a4a5c_0%,transparent_50%)]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-2">
          <Link
            href="/"
            className="text-2xl tracking-tight text-[#7ec8d8]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Fish&Fric
          </Link>
          <h1
            className="text-3xl text-[#e8f4f8]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Créer un compte
          </h1>
          <p className="text-[#9bb8c4]">
            Un compte chèque t&apos;est ouvert automatiquement.
          </p>
        </div>

        <SignupForm />
      </main>
    </div>
  );
}

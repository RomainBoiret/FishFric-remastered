import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/LoginForm";
import { DemoButton } from "@/features/auth/DemoButton";
import { auth } from "@/lib/auth";

export default async function ConnexionPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,#0a4a5c_0%,transparent_50%)]"
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
            Connexion
          </h1>
          <p className="text-[#9bb8c4]">Accède à tes comptes océaniques.</p>
        </div>

        <LoginForm />

        <div className="border-t border-[#1e4a58] pt-6">
          <p className="mb-3 text-sm text-[#6a8894]">Recruteur curieux ?</p>
          <DemoButton />
        </div>
      </main>
    </div>
  );
}

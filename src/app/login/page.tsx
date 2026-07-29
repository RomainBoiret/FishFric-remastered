import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { LoginForm } from "@/features/auth/LoginForm";
import { DemoButton } from "@/features/auth/DemoButton";
import { auth } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${SITE_NAME} accounts or try the demo reef.`,
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Atmosphere variant="app" />
      <main
        id="main-content"
        className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6"
      >
        <div className="ff-in space-y-3">
          <Link
            href="/"
            className="ff-brand inline-flex items-center gap-2 text-base"
          >
            <BrandMark size={24} className="text-[var(--ff-gold)]" />
            {SITE_NAME}
          </Link>
          <h1 className="ff-display text-2xl text-white">Sign in</h1>
          <p className="text-sm text-[var(--ff-muted)]">
            Access your ocean bank accounts.
          </p>
        </div>

        <section
          className="ff-in ff-in-1 ff-surface p-5 sm:p-6"
          aria-label="Sign in form"
        >
          <LoginForm />
        </section>

        <section
          className="ff-in ff-in-2 space-y-3 border-t-2 border-[#1a3a44] pt-6"
          aria-label="Demo access"
        >
          <p className="text-sm text-[var(--ff-muted)]">Just browsing?</p>
          <DemoButton className="ff-btn w-full" label="Try the demo" />
        </section>
      </main>
      <SiteFooter compact />
    </div>
  );
}

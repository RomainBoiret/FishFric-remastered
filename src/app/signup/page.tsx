import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Atmosphere } from "@/components/brand/Atmosphere";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SignupForm } from "@/features/auth/SignupForm";
import { auth } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create an account",
  description: `Create a ${SITE_NAME} account and open a checking account automatically.`,
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
};

export default async function SignupPage() {
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
          <h1 className="ff-display text-2xl text-white">Create an account</h1>
          <p className="text-sm text-[var(--ff-muted)]">
            A checking account is opened for you automatically.
          </p>
        </div>

        <section
          className="ff-in ff-in-1 ff-surface p-5 sm:p-6"
          aria-label="Create account form"
        >
          <SignupForm />
        </section>
      </main>
      <SiteFooter compact />
    </div>
  );
}

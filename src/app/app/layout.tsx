import type { Metadata } from "next";

/**
 * Authenticated app shell - indexable for the public demo, with
 * per-page self-canonicals (never inherit the homepage canonical).
 */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

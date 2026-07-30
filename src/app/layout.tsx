import type { Metadata } from "next";
import { Noto_Sans, Pixelify_Sans } from "next/font/google";
import { SkipLink } from "@/components/a11y/SkipLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_AUTHOR, SITE_NAME, SITE_TAGLINE, getSiteUrl } from "@/lib/site";
import "./globals.css";

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} - Ocean banking demo`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  keywords: [
    "Fish&Fric",
    "banking demo",
    "portfolio",
    "Next.js",
    "ledger",
    "P2P transfer",
    "ocean bank",
  ],
  authors: [{ name: SITE_AUTHOR }],
  creator: SITE_AUTHOR,
  publisher: SITE_NAME,
  category: "finance",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Ocean banking demo`,
    description: SITE_TAGLINE,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} - Ocean banking demo`,
    description: SITE_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ToastProvider>
          <SkipLink />
          <JsonLd />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

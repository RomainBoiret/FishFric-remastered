/**
 * Canonical site URL for metadata, sitemap, and JSON-LD.
 * Prefer NEXT_PUBLIC_SITE_URL in production (e.g. https://fish-fric-remastered-8ag2.vercel.app).
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const SITE_NAME = "Fish&Fric";
export const SITE_AUTHOR = "Romain Boiret";
export const SITE_GITHUB =
  "https://github.com/RomainBoiret/FishFric-remastered";
/** Original ÉTS team integrator project (2024). */
export const SITE_GITHUB_ORIGINAL =
  "https://github.com/RomainBoiret/FishFric-Bank";
export const SITE_TAGLINE =
  "An ocean-themed banking demo: accounts, transfers, P2P, bills, and signed cheque deposits on a real ledger.";

/** Seeded accounts for recruiters (fictional only). */
export const DEMO_CREDENTIALS = [
  {
    label: "Demo",
    email: "demo@fishfric.app",
    password: "Demo-FishFric-2026!",
    note: "Main reef to explore",
  },
  {
    label: "Friend (P2P)",
    email: "ami@fishfric.app",
    password: "Demo-FishFric-2026!",
    note: "Second account for P2P tests",
  },
] as const;

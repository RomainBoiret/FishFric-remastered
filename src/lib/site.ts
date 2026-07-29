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
export const SITE_TAGLINE =
  "An ocean-themed banking demo - accounts, transfers, and P2P on a real ledger.";

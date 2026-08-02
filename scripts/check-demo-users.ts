/**
 * Quick check: does the demo reef exist on DATABASE_URL?
 * Usage:
 *   $env:DATABASE_URL="postgresql://..."
 *   npx tsx scripts/check-demo-users.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { withPgSslCompat } from "../src/lib/pg-url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const host = new URL(url).hostname;
console.log(`Checking host: ${host}`);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: withPgSslCompat(url) }),
});

async function main() {
  const [demo, ami, userCount] = await Promise.all([
    prisma.user.findUnique({
      where: { email: "demo@fishfric.app" },
      select: { id: true, email: true, isDemo: true },
    }),
    prisma.user.findUnique({
      where: { email: "ami@fishfric.app" },
      select: { id: true, email: true, isDemo: true },
    }),
    prisma.user.count(),
  ]);

  console.log(`userCount=${userCount}`);
  console.log(`demo=${demo ? "FOUND" : "MISSING"}`);
  console.log(`ami=${ami ? "FOUND" : "MISSING"}`);

  if (!demo || !ami) {
    console.error("Reef incomplete on this DATABASE_URL. Re-run npm run db:seed against the SAME URL as Vercel Production.");
    process.exit(2);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

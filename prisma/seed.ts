/**
 * Recruiter demo seed CLI entrypoint.
 * Demo:   demo@fishfric.app / Demo-FishFric-2026!
 * Friend: ami@fishfric.app / Demo-FishFric-2026!
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resetDemoData } from "../src/features/demo/reset-demo-data";
import { DEMO_CREDENTIALS } from "../src/features/auth/schemas";
import { FRIEND_CREDENTIALS } from "../src/features/p2p/schemas";
import { withPgSslCompat } from "../src/lib/pg-url";

const adapter = new PrismaPg({
  connectionString: withPgSslCompat(process.env.DATABASE_URL!),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await resetDemoData(prisma);

  console.log("Seed OK (ledger-balanced)");
  console.log(`  Demo:   ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`);
  console.log(`  Friend: ${FRIEND_CREDENTIALS.email} / ${FRIEND_CREDENTIALS.password}`);
  console.log("  Pending P2P → demo, answer: shark");
  console.log(
    `  Balances: checking=${result.balances.checking} savings=${result.balances.savings} credit=${result.balances.credit} friend=${result.balances.friend}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

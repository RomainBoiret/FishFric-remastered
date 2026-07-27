/**
 * Seed démo recruteur — à brancher après `prisma migrate`.
 * Compte démo + 3 produits + ledger + 1 P2P pending.
 */
import "dotenv/config";

async function main() {
  console.log("Seed Fish&Fric — stub prêt.");
  console.log("Brancher DATABASE_URL puis implémenter le seed (User démo, comptes, ledger, P2P).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

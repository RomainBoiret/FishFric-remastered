import { redirect } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";
import { formatMoney } from "@/domain/money";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const typeLabels = {
  CHECKING: "Compte chèque",
  SAVINGS: "Compte épargne",
  CREDIT: "Carte requin",
} as const;

export default async function AppHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { openedAt: "asc" },
  });

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#04161f] text-[#e8f4f8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#0a4a5c_0%,transparent_45%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <p
          className="text-xl text-[#7ec8d8]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Fish&Fric
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-[#9bb8c4] transition hover:text-[#e8f4f8]"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-16">
        <div className="space-y-2">
          <h1
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bonjour, {session.user.name?.split(" ")[0] ?? "Fisher"}
          </h1>
          <p className="text-[#9bb8c4]">
            Voici tes comptes.
            {session.user.isDemo
              ? " Mode démo — données fictives pour recruteurs."
              : null}
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between border-b border-[#1e4a58] py-4"
            >
              <div>
                <p className="font-medium text-[#e8f4f8]">
                  {account.label ?? typeLabels[account.type]}
                </p>
                <p className="text-sm text-[#6a8894]">
                  {typeLabels[account.type]}
                </p>
              </div>
              <p
                className="text-xl tabular-nums text-[#7ec8d8]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {formatMoney(account.balanceCents)}
              </p>
            </li>
          ))}
          {accounts.length === 0 ? (
            <li className="py-8 text-[#9bb8c4]">Aucun compte actif.</li>
          ) : null}
        </ul>
      </main>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initial: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Courriel
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>

      {state.error ? (
        <p className="text-sm text-[#f0a8a8]" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-[#7ec8d8] px-4 py-2.5 text-sm font-semibold text-[#04161f] transition hover:bg-[#9ad7e4] disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-[#9bb8c4]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-[#7ec8d8] underline-offset-2 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

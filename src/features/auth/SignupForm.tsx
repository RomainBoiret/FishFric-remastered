"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signupAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initial: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
          First name
          <input
            name="firstName"
            required
            autoComplete="given-name"
            className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
          Last name
          <input
            name="lastName"
            required
            autoComplete="family-name"
            className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-[#9bb8c4]">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="rounded-md border border-[#1e4a58] bg-[#0a2833] px-3 py-2.5 text-[#e8f4f8] outline-none focus:border-[#7ec8d8]"
        />
        <span className="text-xs text-[#6a8894]">
          8+ characters, 1 uppercase, 1 number
        </span>
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
        {pending ? "Creating…" : "Create my account"}
      </button>

      <p className="text-center text-sm text-[#9bb8c4]">
        Already a customer?{" "}
        <Link
          href="/login"
          className="text-[#7ec8d8] underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

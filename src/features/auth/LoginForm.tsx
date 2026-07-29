"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import {
  loginAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initial: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4"
      noValidate={false}
      aria-busy={pending}
    >
      <label className="ff-label" htmlFor={emailId}>
        Email
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className="ff-input"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
      </label>
      <label className="ff-label" htmlFor={passwordId}>
        Password
        <input
          id={passwordId}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="ff-input"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
      </label>

      {state.error ? (
        <p id={errorId} className="text-sm text-[var(--ff-danger)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ff-btn mt-1 w-full"
        aria-busy={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>

      <p className="text-center text-sm normal-case tracking-normal text-[var(--ff-muted)]">
        No account yet?{" "}
        <Link href="/signup" className="ff-link">
          Create an account
        </Link>
      </p>
    </form>
  );
}

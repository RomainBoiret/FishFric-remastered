"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import {
  signupAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initial: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initial);
  const firstId = useId();
  const lastId = useId();
  const emailId = useId();
  const passwordId = useId();
  const hintId = useId();
  const errorId = useId();

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4"
      aria-busy={pending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="ff-label" htmlFor={firstId}>
          First name
          <input
            id={firstId}
            name="firstName"
            required
            autoComplete="given-name"
            className="ff-input"
          />
        </label>
        <label className="ff-label" htmlFor={lastId}>
          Last name
          <input
            id={lastId}
            name="lastName"
            required
            autoComplete="family-name"
            className="ff-input"
          />
        </label>
      </div>

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
          autoComplete="new-password"
          className="ff-input"
          aria-describedby={`${hintId}${state.error ? ` ${errorId}` : ""}`}
          aria-invalid={state.error ? true : undefined}
        />
        <span
          id={hintId}
          className="text-xs font-normal normal-case tracking-normal text-[var(--ff-muted)]"
        >
          8+ characters, 1 uppercase, 1 number
        </span>
      </label>

      {state.error ? (
        <p
          id={errorId}
          className="text-sm normal-case tracking-normal text-[var(--ff-danger)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ff-btn mt-1 w-full"
        aria-busy={pending}
      >
        {pending ? "Creating…" : "Create my account"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>

      <p className="text-center text-sm normal-case tracking-normal text-[var(--ff-muted)]">
        Already registered?{" "}
        <Link href="/login" className="ff-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}

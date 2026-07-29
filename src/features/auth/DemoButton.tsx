"use client";

import { useActionState } from "react";
import {
  loginDemoAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initial: AuthActionState = {};

export function DemoButton({
  className,
  label = "Try the demo",
}: {
  className?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(loginDemoAction, initial);

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className={className ?? "ff-btn ff-btn-ghost"}
        aria-busy={pending}
        aria-label={pending ? "Opening demo account" : label}
      >
        {pending ? "Loading…" : label}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>
      {state.error ? (
        <p
          className="text-sm normal-case tracking-normal text-[var(--ff-danger)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

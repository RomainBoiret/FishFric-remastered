"use client";

import { useActionState } from "react";
import {
  loginDemoAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initial: AuthActionState = {};

export function DemoButton({ className }: { className?: string }) {
  const [state, formAction, pending] = useActionState(loginDemoAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className={
          className ??
          "rounded-md border border-[#7ec8d8] px-5 py-2.5 text-sm font-medium text-[#7ec8d8] transition hover:bg-[#0a2833] disabled:opacity-60"
        }
      >
        {pending ? "Opening demo…" : "Try the demo"}
      </button>
      {state.error ? (
        <p className="text-sm text-[#f0a8a8]" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

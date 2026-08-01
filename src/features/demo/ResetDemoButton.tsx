"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/ui/toast";
import {
  resetDemoAction,
  type ResetDemoActionState,
} from "@/features/demo/actions";

const initial: ResetDemoActionState = {};

/** Visible only on the demo hub — rebuilds the shared recruiter reef. */
export function ResetDemoButton() {
  const [state, formAction, pending] = useActionState(resetDemoAction, initial);
  useActionToast(state, pending);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Reset the shared demo reef for everyone? Balances, history, and the pending P2P will be restored to the sample state.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="inline"
    >
      <button
        type="submit"
        disabled={pending}
        className="ff-btn ff-btn-sm ff-btn-ghost"
        aria-busy={pending}
      >
        {pending ? "Resetting…" : "Reset demo reef"}
      </button>
    </form>
  );
}

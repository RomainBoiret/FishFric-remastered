"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import type { AccountType } from "@/domain/accounts";
import { ACCOUNT_TYPE_LABELS } from "@/domain/labels";
import { ACCOUNT_RULES, formatMoney } from "@/domain/money";
import { openAccountAction } from "@/features/accounts/actions";
import type { OpenAccountActionState } from "@/features/accounts/schemas";
import { useActionToast } from "@/components/ui/toast";

const initial: OpenAccountActionState = {};

const TYPE_HINTS: Record<AccountType, string> = {
  CHECKING: "Everyday spending account.",
  SAVINGS: `Earn ${ACCOUNT_RULES.interestBps.SAVINGS / 100}% interest (demo rate). Up to ${ACCOUNT_RULES.maxSavingsAccounts} allowed.`,
  CREDIT: `Shark Card with a ${formatMoney(Math.abs(ACCOUNT_RULES.defaultCreditLimitCents))} limit.`,
};

export function OpenAccountForm({
  openableTypes,
}: {
  openableTypes: AccountType[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    openAccountAction,
    initial,
  );
  useActionToast(state, pending);
  const typeId = useId();
  const labelId = useId();
  const statusId = useId();

  useEffect(() => {
    if (state.accountId) {
      router.push(`/app/accounts/${state.accountId}`);
      router.refresh();
    }
  }, [state.accountId, router]);

  if (openableTypes.length === 0) {
    return (
      <p className="text-[var(--ff-muted)]" role="status">
        You already have every account type available (1 checking, up to{" "}
        {ACCOUNT_RULES.maxSavingsAccounts} savings, 1 Shark Card).
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4"
      aria-busy={pending}
    >
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="ff-label mb-1">Account type</legend>
        {openableTypes.map((type, index) => {
          const optionId = `${typeId}-${type}`;
          return (
            <label
              key={type}
              htmlFor={optionId}
              className="flex cursor-pointer items-start gap-3 border-2 border-black bg-black/20 px-3 py-3 hover:bg-black/35"
            >
              <input
                id={optionId}
                type="radio"
                name="type"
                value={type}
                required
                defaultChecked={index === 0}
                className="mt-1"
              />
              <span>
                <span className="block font-bold text-white">
                  {ACCOUNT_TYPE_LABELS[type]}
                </span>
                <span className="block text-sm text-[var(--ff-muted)]">
                  {TYPE_HINTS[type]}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <label className="ff-label" htmlFor={labelId}>
        Nickname (optional)
        <input
          id={labelId}
          name="label"
          maxLength={40}
          placeholder="e.g. Reef savings"
          className="ff-input"
          aria-describedby={state.error ? statusId : undefined}
          aria-invalid={state.error ? true : undefined}
        />
      </label>

      {state.error ? (
        <p
          id={statusId}
          className="text-sm text-[var(--ff-danger)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ff-btn mt-2 w-full"
        aria-busy={pending}
      >
        {pending ? "Opening…" : "Open account"}
        {!pending ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

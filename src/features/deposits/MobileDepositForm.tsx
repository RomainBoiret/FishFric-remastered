"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useActionToast } from "@/components/ui/toast";
import {
  buildDemoChequeSvg,
  chequeSvgDataUri,
  extractChequeSecurityFromSvg,
  resolveChequeFaceAmountCents,
} from "@/domain/cheque-svg";
import { MOBILE_DEPOSIT_RULES } from "@/domain/deposits";
import { formatMoney } from "@/domain/money";
import { parseAmountToCents } from "@/domain/transfers";
import {
  creditMobileDepositAction,
  issueDemoChequeAction,
  submitMobileDepositAction,
} from "@/features/deposits/actions";
import type {
  DepositActionState,
  IssueChequeActionState,
} from "@/features/deposits/schemas";

export type DepositAccountOption = {
  id: string;
  label: string;
  balanceCents: number;
};

type LockedCheque = {
  chequeId: string;
  amountCents: number;
  fileName: string;
  svg: string;
};

const initial: DepositActionState = {};
const issueInitial: IssueChequeActionState = {};

function downloadSvgToDevice(svg: string, fileName: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function MobileDepositForm({
  accounts,
  defaultAccountId,
  payeeName,
}: {
  accounts: DepositAccountOption[];
  defaultAccountId?: string;
  payeeName: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitMobileDepositAction,
    initial,
  );
  const [creditState, creditAction, creditPending] = useActionState(
    creditMobileDepositAction,
    initial,
  );
  const [issueState, issueAction, issuePending] = useActionState(
    issueDemoChequeAction,
    issueInitial,
  );
  useActionToast(state, pending);
  useActionToast(creditState, creditPending);
  useActionToast(issueState, issuePending);

  const queuedDepositId = useRef<string | null>(null);
  const lastIssuedId = useRef<string | null>(null);
  const [mode, setMode] = useState<"generated" | "upload">("generated");
  const [amountInput, setAmountInput] = useState("12.00");
  const [lockedCheque, setLockedCheque] = useState<LockedCheque | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFaceCents, setUploadFaceCents] = useState<number | null>(null);
  const [uploadChequeId, setUploadChequeId] = useState<string | null>(null);
  const [hideSubmitError, setHideSubmitError] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const accountFieldId = useId();
  const amountId = useId();
  const fileId = useId();
  const statusId = useId();
  const generatedModeId = useId();
  const uploadModeId = useId();

  const amountCents = parseAmountToCents(amountInput);
  const amountMatchesLocked =
    lockedCheque != null &&
    amountCents != null &&
    lockedCheque.amountCents === amountCents;

  const draftSvg = useMemo(() => {
    if (amountCents == null) return null;
    return buildDemoChequeSvg({
      amountCents,
      payeeName,
      memo: "Mobile deposit - fictional",
    });
  }, [amountCents, payeeName]);

  /** Show the locked (issued) face when present so mismatches are visible. */
  const previewSvg = lockedCheque?.svg ?? draftSvg;
  const previewCents = lockedCheque?.amountCents ?? amountCents;
  const previewSrc =
    previewSvg != null ? chequeSvgDataUri(previewSvg) : null;

  const defaultAccount =
    defaultAccountId && accounts.some((a) => a.id === defaultAccountId)
      ? defaultAccountId
      : accounts[0]?.id;

  useEffect(() => {
    if (!state.pendingReview || !state.depositId) return;
    if (queuedDepositId.current === state.depositId) return;

    queuedDepositId.current = state.depositId;
    setReviewing(true);

    const timer = setTimeout(() => {
      const formData = new FormData();
      formData.set("depositId", state.depositId!);
      startTransition(() => {
        creditAction(formData);
      });
      setReviewing(false);
    }, MOBILE_DEPOSIT_RULES.reviewDelayMs);

    return () => clearTimeout(timer);
  }, [state.depositId, state.pendingReview, creditAction]);

  useEffect(() => {
    if (
      !issueState.chequeId ||
      !issueState.svg ||
      !issueState.fileName ||
      issueState.amountCents == null
    ) {
      return;
    }
    if (lastIssuedId.current === issueState.chequeId) return;
    lastIssuedId.current = issueState.chequeId;

    downloadSvgToDevice(issueState.svg, issueState.fileName);
    setLockedCheque({
      chequeId: issueState.chequeId,
      amountCents: issueState.amountCents,
      fileName: issueState.fileName,
      svg: issueState.svg,
    });
  }, [issueState]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  function noteFormEdit() {
    setHideSubmitError(true);
  }

  if (accounts.length === 0) {
    return (
      <p className="text-[var(--ff-muted)]" role="status">
        Open a checking or savings account to deposit a cheque.
      </p>
    );
  }

  const busy = pending || reviewing || creditPending || issuePending;

  function handleIssueCheque() {
    if (amountCents == null) return;
    const formData = new FormData();
    formData.set("amount", amountInput);
    startTransition(() => {
      issueAction(formData);
    });
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setHideSubmitError(false)}
      className="flex w-full flex-col gap-4"
      aria-busy={busy}
    >
      <input type="hidden" name="depositMode" value={mode} />
      {mode === "generated" && lockedCheque ? (
        <>
          <input type="hidden" name="chequeId" value={lockedCheque.chequeId} />
          <input
            type="hidden"
            name="chequeAmount"
            value={(lockedCheque.amountCents / 100).toFixed(2)}
          />
          <input
            type="hidden"
            name="chequeFileName"
            value={lockedCheque.fileName}
          />
        </>
      ) : null}

      <label className="ff-label" htmlFor={accountFieldId}>
        Deposit to
        <select
          id={accountFieldId}
          name="accountId"
          required
          defaultValue={defaultAccount}
          className="ff-input"
          disabled={busy}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} - {formatMoney(account.balanceCents)}
            </option>
          ))}
        </select>
      </label>

      <label className="ff-label" htmlFor={amountId}>
        Amount (CAD)
        <input
          id={amountId}
          name="amount"
          inputMode="decimal"
          placeholder="12.00"
          required
          value={amountInput}
          onChange={(event) => {
            setAmountInput(event.target.value);
            noteFormEdit();
          }}
          className="ff-input"
          disabled={busy}
          aria-describedby={
            state.error && !hideSubmitError ? statusId : undefined
          }
          aria-invalid={
            state.error && !hideSubmitError ? true : undefined
          }
        />
      </label>

      {lockedCheque && !amountMatchesLocked && amountCents != null ? (
        <p className="text-sm text-[var(--ff-gold)]" role="status">
          Form amount ({formatMoney(amountCents)}) differs from issued cheque (
          {formatMoney(lockedCheque.amountCents)}). Submit will be rejected.
        </p>
      ) : null}

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="ff-label mb-1">Cheque source</legend>
        <label
          htmlFor={generatedModeId}
          className="flex cursor-pointer items-start gap-3 border-2 border-black bg-black/20 px-3 py-3 hover:bg-black/35"
        >
          <input
            id={generatedModeId}
            type="radio"
            name="depositModeUi"
            checked={mode === "generated"}
            onChange={() => {
              setMode("generated");
              noteFormEdit();
            }}
            className="mt-1"
            disabled={busy}
          />
          <span>
            <span className="block font-bold text-white">
              Issue signed demo cheque
            </span>
            <span className="block text-sm text-[var(--ff-muted)]">
              Server-signed, payee-bound, one-time. Re-uploading the same file
              after cashing is rejected.
            </span>
          </span>
        </label>
        <label
          htmlFor={uploadModeId}
          className="flex cursor-pointer items-start gap-3 border-2 border-black bg-black/20 px-3 py-3 hover:bg-black/35"
        >
          <input
            id={uploadModeId}
            type="radio"
            name="depositModeUi"
            checked={mode === "upload"}
            onChange={() => {
              setMode("upload");
              setLockedCheque(null);
              noteFormEdit();
            }}
            className="mt-1"
            disabled={busy}
          />
          <span>
            <span className="block font-bold text-white">Upload a photo</span>
            <span className="block text-sm text-[var(--ff-muted)]">
              Fish&amp;Fric SVGs are verified (ID + signature + payee). Plain
              photos skip instrument checks.
            </span>
          </span>
        </label>
      </fieldset>

      {mode === "generated" ? (
        <div className="space-y-3">
          {previewSrc && previewCents != null ? (
            <figure className="m-0 overflow-hidden border-2 border-black bg-[#e4eef2]">
              <img
                src={previewSrc}
                alt={`Demo cheque for ${formatMoney(previewCents)}`}
                className="h-auto w-full"
              />
              <figcaption className="space-y-1 border-t-2 border-black px-3 py-2 text-xs text-[var(--ff-muted)]">
                {lockedCheque ? (
                  <>
                    <p className="m-0">
                      Issued · {formatMoney(lockedCheque.amountCents)} · …
                      {lockedCheque.chequeId.slice(-8)}
                    </p>
                    <p className="m-0 truncate" title={lockedCheque.fileName}>
                      {lockedCheque.fileName}
                    </p>
                  </>
                ) : (
                  <p className="m-0">
                    Preview only (not cashable) ·{" "}
                    {formatMoney(previewCents)}
                  </p>
                )}
              </figcaption>
            </figure>
          ) : (
            <p className="text-sm text-[var(--ff-muted)]" role="status">
              Enter a valid amount to preview the cheque.
            </p>
          )}

          <button
            type="button"
            className="ff-btn ff-btn-sm ff-btn-stone w-full"
            disabled={busy || amountCents == null}
            onClick={handleIssueCheque}
          >
            {issuePending
              ? "Issuing…"
              : amountMatchesLocked
                ? "Issue & download again"
                : lockedCheque
                  ? "Issue new cheque for form amount"
                  : "Issue & download signed cheque"}
            <span aria-hidden="true"> ›</span>
          </button>

          <p className="text-xs text-[var(--ff-muted)]" role="status">
            {amountMatchesLocked
              ? "Signed cheque matches the form - ready to submit (one-time)."
              : "Issuing creates a unique HMAC-signed cheque bound to your account. Double-cash attempts are rejected."}
          </p>
        </div>
      ) : (
        <>
          <label className="ff-label" htmlFor={fileId}>
            Cheque photo
            <input
              id={fileId}
              ref={uploadInputRef}
              name="chequeImage"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="ff-input file:mr-3 file:border-0 file:bg-transparent file:font-bold file:text-[var(--ff-gold)]"
              disabled={busy}
              onChange={async (event) => {
                noteFormEdit();
                const file = event.target.files?.[0];
                if (uploadPreview) URL.revokeObjectURL(uploadPreview);
                const isPreviewableRaster =
                  !!file &&
                  (file.type === "image/jpeg" ||
                    file.type === "image/png" ||
                    file.type === "image/webp");
                setUploadPreview(
                  isPreviewableRaster ? URL.createObjectURL(file) : null,
                );
                setUploadFaceCents(null);
                setUploadChequeId(null);

                if (!file) return;

                const isSvg =
                  file.type === "image/svg+xml" ||
                  file.name.toLowerCase().endsWith(".svg");
                const svgText = isSvg ? await file.text() : null;
                const face = resolveChequeFaceAmountCents({
                  fileName: file.name,
                  svgText,
                });
                setUploadFaceCents(face);
                if (svgText) {
                  const security = extractChequeSecurityFromSvg(svgText);
                  setUploadChequeId(security?.chequeId ?? null);
                }
              }}
            />
          </label>
          {uploadFaceCents != null ? (
            <p className="text-xs text-[var(--ff-muted)]" role="status">
              Cheque face detected: {formatMoney(uploadFaceCents)}
              {uploadChequeId
                ? ` · ID …${uploadChequeId.slice(-8)}`
                : ""}
              {amountCents != null && uploadFaceCents !== amountCents
                ? " - does not match the form amount; submit will be rejected."
                : uploadChequeId
                  ? ". Signature and payee will be verified on submit."
                  : ". Deposit amount must match."}
            </p>
          ) : null}
          {uploadPreview ? (
            <figure className="m-0 overflow-hidden border-2 border-black bg-black/30">
              <img
                src={uploadPreview}
                alt="Uploaded cheque preview"
                className="max-h-48 w-full object-contain"
              />
            </figure>
          ) : null}
        </>
      )}

      {state.error && !hideSubmitError ? (
        <p
          id={statusId}
          className="text-sm text-[var(--ff-danger)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {creditState.error ? (
        <p className="text-sm text-[var(--ff-danger)]" role="alert">
          {creditState.error}
        </p>
      ) : null}

      {issueState.error ? (
        <p className="text-sm text-[var(--ff-danger)]" role="alert">
          {issueState.error}
        </p>
      ) : null}

      {reviewing ? (
        <p className="text-sm text-[var(--ff-gold)]" role="status">
          Bank review in progress…
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="ff-btn mt-2 w-full"
        aria-busy={busy}
      >
        {pending
          ? "Submitting…"
          : reviewing
            ? "Reviewing…"
            : creditPending
              ? "Crediting…"
              : "Submit deposit"}
        {!busy ? <span aria-hidden="true"> ›</span> : null}
      </button>
    </form>
  );
}

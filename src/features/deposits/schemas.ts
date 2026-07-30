import { z } from "zod";

export const submitMobileDepositSchema = z.object({
  accountId: z.string().min(1),
  amount: z.string().min(1, "Amount required"),
  depositMode: z.enum(["generated", "upload"]),
  chequeAmount: z.string().optional(),
  chequeFileName: z.string().optional(),
  chequeId: z.string().optional(),
});

export const issueDemoChequeSchema = z.object({
  amount: z.string().min(1, "Amount required"),
});

export const creditMobileDepositSchema = z.object({
  depositId: z.string().min(1),
});

export type DepositActionState = {
  error?: string;
  success?: string;
  depositId?: string;
  /** Hint for the client to run the simulated review */
  pendingReview?: boolean;
};

export type IssueChequeActionState = {
  error?: string;
  success?: string;
  chequeId?: string;
  amountCents?: number;
  fileName?: string;
  svg?: string;
};

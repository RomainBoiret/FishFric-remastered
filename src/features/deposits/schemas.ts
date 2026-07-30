import { z } from "zod";

export const submitMobileDepositSchema = z.object({
  accountId: z.string().min(1),
  amount: z.string().min(1, "Amount required"),
  useSampleCheck: z
    .union([z.literal("on"), z.literal("true"), z.literal("1"), z.null()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === "1"),
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

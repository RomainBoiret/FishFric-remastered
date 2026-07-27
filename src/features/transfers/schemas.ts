import { z } from "zod";

export const internalTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.string().min(1, "Amount required"),
});

export type TransferActionState = {
  error?: string;
  success?: string;
};

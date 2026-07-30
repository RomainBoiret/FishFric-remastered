import { z } from "zod";

export const billPaymentSchema = z.object({
  fromAccountId: z.string().min(1),
  payeeId: z.enum([
    "ocean-hydro",
    "reef-mobile",
    "wave-insurance",
    "coralville",
  ]),
  amount: z.string().min(1, "Amount required"),
  memo: z
    .string()
    .trim()
    .max(60, "Memo is too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type BillPayActionState = {
  error?: string;
  success?: string;
};

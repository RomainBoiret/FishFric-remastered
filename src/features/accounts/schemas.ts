import { z } from "zod";

export const openAccountSchema = z.object({
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT"]),
  label: z
    .string()
    .trim()
    .max(40, "Label is too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type OpenAccountActionState = {
  error?: string;
  success?: string;
};

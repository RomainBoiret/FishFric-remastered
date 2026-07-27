import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Invalid email").transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/[0-9]/, "At least one number"),
  firstName: z.string().trim().min(1, "First name required").max(60),
  lastName: z.string().trim().min(1, "Last name required").max(60),
});

export const loginSchema = z.object({
  email: z.email("Invalid email").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password required"),
});

export const DEMO_CREDENTIALS = {
  email: "demo@fishfric.app",
  password: "Demo-FishFric-2026!",
} as const;

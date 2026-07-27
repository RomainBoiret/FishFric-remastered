import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Courriel invalide").transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  firstName: z.string().trim().min(1, "Prénom requis").max(60),
  lastName: z.string().trim().min(1, "Nom requis").max(60),
});

export const loginSchema = z.object({
  email: z.email("Courriel invalide").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Mot de passe requis"),
});

export const DEMO_CREDENTIALS = {
  email: "demo@fishfric.app",
  password: "Demo-FishFric-2026!",
} as const;

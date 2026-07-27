import { z } from "zod";

export const createP2PSchema = z.object({
  sourceAccountId: z.string().min(1),
  recipientEmail: z.email("Courriel invalide").transform((v) => v.trim().toLowerCase()),
  amount: z.string().min(1),
  question: z.string().trim().min(3, "Question trop courte").max(120),
  answer: z.string().trim().min(1, "Réponse requise").max(80),
});

export const acceptP2PSchema = z.object({
  p2pId: z.string().min(1),
  answer: z.string().min(1),
});

export const rejectP2PSchema = z.object({
  p2pId: z.string().min(1),
});

export type P2PActionState = {
  error?: string;
  success?: string;
};

export const FRIEND_CREDENTIALS = {
  email: "ami@fishfric.app",
  password: "Demo-FishFric-2026!",
} as const;

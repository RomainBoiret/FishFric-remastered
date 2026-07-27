"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { ACCOUNT_RULES } from "@/domain/money";
import {
  DEMO_CREDENTIALS,
  loginSchema,
  signupSchema,
} from "@/features/auth/schemas";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  if (!parsed.success) {
    return {
      error: "Vérifie les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, firstName, lastName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec ce courriel." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    await tx.bankAccount.create({
      data: {
        userId: user.id,
        type: "CHECKING",
        label: "Compte chèque",
        balanceCents: 0,
        interestBps: ACCOUNT_RULES.interestBps.CHECKING,
      },
    });
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Compte créé, mais la connexion a échoué." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Courriel ou mot de passe invalide.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Courriel ou mot de passe incorrect." };
    }
    throw error;
  }

  return {};
}

export async function loginDemoAction(): Promise<AuthActionState> {
  try {
    await signIn("credentials", {
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Compte démo introuvable. Lance `npm run db:seed` puis réessaie.",
      };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

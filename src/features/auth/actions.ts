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
      error: "Please check the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, firstName, lastName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account already exists with this email." };
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
        label: "Checking account",
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
      return { error: "Account created, but sign-in failed." };
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
      error: "Invalid email or password.",
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
      return { error: "Incorrect email or password." };
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
        error: "Demo account not found. Run `npm run db:seed` and try again.",
      };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

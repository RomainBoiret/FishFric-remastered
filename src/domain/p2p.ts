import { P2P_RULES } from "@/domain/money";
import type { AccountType } from "@/domain/accounts";

export function canSendP2PFrom(type: AccountType): boolean {
  return type === "CHECKING" || type === "SAVINGS";
}

export function p2pExpiresAt(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + P2P_RULES.expiryDays);
  return d;
}

export function isP2PExpired(expiresAt: Date, now = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function normalizeP2PAnswer(answer: string): string {
  return answer.trim();
}

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resetDemoData } from "@/features/demo/reset-demo-data";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorized(request: Request): boolean {
  const provided = readBearer(request);
  if (!provided) return false;

  const cronSecret = process.env.CRON_SECRET?.trim();
  const demoSecret = process.env.DEMO_RESET_SECRET?.trim();

  if (cronSecret && secretsMatch(provided, cronSecret)) return true;
  if (demoSecret && secretsMatch(provided, demoSecret)) return true;
  return false;
}

/**
 * Rebuild the shared demo reef (demo + friend accounts).
 * Auth: `Authorization: Bearer <CRON_SECRET|DEMO_RESET_SECRET>`
 * Vercel Cron injects `CRON_SECRET` automatically when configured.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resetDemoData(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("demo reset failed", error);
    return NextResponse.json(
      { error: "Demo reset failed." },
      { status: 500 },
    );
  }
}

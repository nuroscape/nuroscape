import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { computeScoresWithContext } from "@/data/questions";

const isDev = process.env.NODE_ENV === "development";

// In-memory rate limit: 3 requests per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  let body: { responses?: Record<string, number> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const responses = body.responses ?? {};

  if (Object.keys(responses).length === 0) {
    return NextResponse.json({ error: "Réponses manquantes" }, { status: 400 });
  }

  const ctx = computeScoresWithContext(responses);

  let data: { session_id: string } | null = null;
  try {
    const supabase = await createAdminClient();
    const result = await supabase
      .from("assessments")
      .insert({
        responses,
        scores: ctx.scores,
        report: null,
        paid: false,
      })
      .select("session_id")
      .single();

    if (result.error || !result.data) {
      throw new Error(result.error?.message ?? "No data returned");
    }
    data = result.data as { session_id: string };
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      {
        error: "Erreur base de données",
        ...(isDev && { detail: err.message }),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ session_id: data.session_id });
}

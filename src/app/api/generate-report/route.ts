import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { generateReport, DISCLAIMER } from "@/lib/openai/generate-report";
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
  console.log("[generate-report] POST start");
  console.log("[generate-report] OPENAI_API_KEY defined:", !!process.env.OPENAI_API_KEY);
  console.log("[generate-report] NEXT_PUBLIC_SUPABASE_URL defined:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("[generate-report] NEXT_PUBLIC_SUPABASE_ANON_KEY defined:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("[generate-report] SUPABASE_SERVICE_ROLE_KEY defined:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  let body: { responses?: Record<string, number> };
  try {
    body = await request.json();
  } catch (e) {
    console.error("[generate-report] Failed to parse request body:", e);
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    console.log("[generate-report] Rate limit hit for IP:", ip);
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const responses = body.responses ?? {};
  console.log("[generate-report] Response count:", Object.keys(responses).length);

  if (Object.keys(responses).length === 0) {
    return NextResponse.json({ error: "Réponses manquantes" }, { status: 400 });
  }

  const ctx = computeScoresWithContext(responses);
  console.log("[generate-report] Scores computed. Global:", ctx.scores.global);

  let report;
  try {
    console.log("[generate-report] Calling OpenAI model: gpt-4o-mini");
    report = await generateReport(ctx);
    console.log(
      "[generate-report] OpenAI response received. intro length:",
      report.intro?.length ?? 0,
      "sections count:",
      report.sections?.length ?? 0
    );
  } catch (e) {
    const err = e as Error;
    console.error("[generate-report] OpenAI error:", err.message, err.stack);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du rapport",
        ...(isDev && { detail: err.message, stack: err.stack }),
      },
      { status: 500 }
    );
  }

  const reportWithDisclaimer = { ...report, disclaimer: DISCLAIMER };

  console.log("[generate-report] Inserting into Supabase assessments...");
  let data: { session_id: string } | null = null;
  try {
    const supabase = await createAdminClient();
    const result = await supabase
      .from("assessments")
      .insert({
        responses,
        scores: ctx.scores,
        report: reportWithDisclaimer,
      })
      .select("session_id")
      .single();

    console.log("[generate-report] Supabase insert result — error:", result.error?.message ?? "none");

    if (result.error || !result.data) {
      throw new Error(result.error?.message ?? "No data returned from insert");
    }
    data = result.data as { session_id: string };
  } catch (e) {
    const err = e as Error;
    console.error("[generate-report] Supabase error:", err.message, err.stack);
    return NextResponse.json(
      {
        error: "Erreur base de données",
        ...(isDev && { detail: err.message, stack: err.stack }),
      },
      { status: 500 }
    );
  }

  console.log("[generate-report] Success. session_id:", data.session_id);
  return NextResponse.json({ session_id: data.session_id });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateReport, DISCLAIMER } from "@/lib/openai/generate-report";
import { computeScoresWithContext } from "@/data/questions";
import type { Tables } from "@/types/database";

const isDev = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  // Internal-only: callable from Stripe webhook server-to-server
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { session_id } = body;
  if (!session_id) {
    return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const fetchResult = await supabase
    .from("assessments")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle();

  const assessment = fetchResult.data as Tables<"assessments"> | null;
  if (!assessment) {
    return NextResponse.json({ error: "Assessment non trouvé" }, { status: 404 });
  }

  // Idempotent: safe on Stripe webhook retries
  if (assessment.report !== null) {
    return NextResponse.json({ ok: true, already_generated: true });
  }

  const responses = assessment.responses as Record<string, number>;
  const ctx = computeScoresWithContext(responses);

  let report;
  try {
    report = await generateReport(ctx);
  } catch (e) {
    const err = e as Error;
    console.error("[generate-report] OpenAI error:", err.message);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du rapport",
        ...(isDev && { detail: err.message }),
      },
      { status: 500 }
    );
  }

  const reportWithDisclaimer = { ...report, disclaimer: DISCLAIMER };

  const updateResult = await supabase
    .from("assessments")
    .update({ report: reportWithDisclaimer })
    .eq("session_id", session_id);

  if (updateResult.error) {
    console.error("[generate-report] Supabase update error:", updateResult.error.message);
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  console.log("[generate-report] Report generated for session:", session_id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReport } from "@/lib/openai/generate-report";
import type { Tables } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessmentId } = (await request.json()) as { assessmentId: string };

  const assessmentResult = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .eq("user_id", user.id)
    .maybeSingle();
  const assessment = assessmentResult.data as Tables<"assessments"> | null;

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.report_html) {
    return NextResponse.json({ reportHtml: assessment.report_html });
  }

  const responses = assessment.responses as Array<{
    questionId: string;
    questionText: string;
    value: number;
    category: "inattention" | "hyperactivity";
  }>;

  try {
    const reportHtml = await generateReport({
      responses,
      scoreInattention: assessment.score_inattention ?? 0,
      scoreHyperactivity: assessment.score_hyperactivity ?? 0,
      scoreTotal: assessment.score_total ?? 0,
      userFirstName: user.user_metadata?.full_name?.split(" ")[0],
    });

    await supabase
      .from("assessments")
      .update({
        report_html: reportHtml,
        report_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", assessmentId);

    return NextResponse.json({ reportHtml });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

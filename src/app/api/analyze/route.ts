import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWebsite, estimateScores } from "@/lib/website-analyzer";

async function analyze(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const url = body?.url as string | undefined;
  const clientId = body?.clientId as string | undefined;
  const projectId = body?.projectId as string | undefined;

  if (!url) return NextResponse.json({ error: "Falta la URL a analizar." }, { status: 400 });

  const result = await analyzeWebsite(url);
  const score = estimateScores(result);

  let auditId: string | null = null;
  if (clientId) {
    const { data } = await supabase
      .from("website_audits")
      .insert({
        client_id: clientId,
        project_id: projectId ?? null,
        url: result.finalUrl,
        result,
        score,
        created_by: user.id,
      })
      .select("id")
      .single();
    auditId = data?.id ?? null;
  }

  return NextResponse.json({ result, score, auditId });
}

export async function POST(request: NextRequest) {
  try { return await analyze(request); }
  catch (error) {
    console.error("website_analysis_failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "No pudimos completar el análisis. Revisá la URL e intentá nuevamente." }, { status: 500 });
  }
}

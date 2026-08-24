import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function logHistory(params: {
  clientId?: string | null;
  projectId?: string | null;
  event: string;
  meta?: Record<string, unknown>;
  visibility?: "internal" | "client";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("project_history").insert({
    client_id: params.clientId ?? null,
    project_id: params.projectId ?? null,
    event: params.event,
    meta: params.meta ?? {},
    visibility: params.visibility ?? "internal",
    created_by: user?.id ?? null,
  });
}

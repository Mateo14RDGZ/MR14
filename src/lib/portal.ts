import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_CLIENT_COOKIE = "mr14_active_client";

export async function getPortalContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/dashboard");

  const { data: memberships } = await supabase
    .from("client_members")
    .select("*, clients(*)")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) redirect("/login?error=" + encodeURIComponent("Tu cuenta no tiene ningún negocio asociado todavía."));

  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value;
  const match = memberships.find((m) => m.client_id === cookieClientId) ?? memberships[0];

  return {
    user,
    profile,
    memberships,
    activeClientId: match.client_id,
    activeClient: match.clients,
  };
}

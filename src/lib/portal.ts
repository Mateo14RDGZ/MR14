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

  const { data: allMemberships } = await supabase
    .from("client_members")
    .select("*, clients(*)")
    .eq("user_id", user.id);

  const memberships = (allMemberships ?? []).filter((m) => m.status === "active");

  if (memberships.length === 0) {
    const pending = (allMemberships ?? []).some((m) => m.status === "invited");
    redirect(
      "/login?error=" +
        encodeURIComponent(
          pending
            ? "Tu solicitud de acceso todavía está pendiente de aprobación por MR14."
            : "Tu cuenta no tiene ningún negocio asociado todavía."
        )
    );
  }

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

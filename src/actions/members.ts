"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logHistory } from "@/lib/history";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/portal";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Acción restringida a administradores de MR14.");
  return { supabase, user };
}

export async function inviteClientMemberAction(clientId: string, formData: FormData) {
  const { user } = await assertAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const roleInClient = String(formData.get("role_in_client") || "colaborador");

  if (!email) return { error: "El email es obligatorio." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/set-password`,
    data: { full_name: name },
  });

  if (inviteError || !invited?.user) {
    return { error: inviteError?.message ?? "No se pudo enviar la invitación." };
  }

  const { error: memberError } = await admin.from("client_members").insert({
    client_id: clientId,
    user_id: invited.user.id,
    email,
    name,
    role_in_client: roleInClient,
    status: "invited",
    invited_by: user.id,
  });

  if (memberError) return { error: memberError.message };

  await logHistory({ clientId, event: `Usuario invitado: ${email}` });
  revalidatePath(`/clients/${clientId}`);
}

/** Llamada por el propio usuario cliente tras activar su cuenta (definir contraseña). */
export async function activateMembershipAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("client_members").update({ status: "active" }).eq("user_id", user.id).eq("status", "invited");
}

export async function removeClientMemberAction(memberId: string, clientId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("client_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: "Usuario removido del acceso al portal" });
  revalidatePath(`/clients/${clientId}`);
}

export async function setActiveOrganizationAction(formData: FormData) {
  const clientId = String(formData.get("client_id") || "");
  if (!clientId) return;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CLIENT_COOKIE, clientId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/portal");
}

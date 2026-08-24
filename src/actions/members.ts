"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logHistory } from "@/lib/history";
import { sendPushToUsers } from "@/lib/push";
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

/**
 * Genera un link único de invitación (sin crear todavía ninguna cuenta). El
 * cliente lo abre, completa sus propios datos + contraseña en /invitacion/[token]
 * y ahí recién se crea el usuario automáticamente.
 */
export async function createInvitationLinkAction(clientId: string, formData: FormData) {
  const { user } = await assertAdmin();
  const admin = createAdminClient();

  const roleInClient = String(formData.get("role_in_client") || "colaborador");
  const token = crypto.randomBytes(24).toString("base64url");

  const { error } = await admin.from("client_invitations").insert({
    client_id: clientId,
    token,
    role_in_client: roleInClient,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { link: `${appUrl}/invitacion/${token}` };
}

/**
 * Genera un link "abierto" (sin cliente todavía) para que un prospecto se
 * registre solo: completa los datos de su negocio + su contraseña, y se
 * crean la ficha del cliente y su usuario del portal en un solo paso,
 * pendientes de aprobación del admin.
 */
export async function createClientRegistrationLinkAction() {
  const { user } = await assertAdmin();
  const admin = createAdminClient();

  const token = crypto.randomBytes(24).toString("base64url");

  const { error } = await admin.from("client_invitations").insert({
    client_id: null,
    token,
    role_in_client: "owner",
    created_by: user.id,
  });

  if (error) return { error: error.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { link: `${appUrl}/invitacion/${token}` };
}

/** Lee una invitación (usada o no) para que la página pública decida qué mostrar. */
export async function getInvitationByToken(token: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_invitations")
    .select("*, clients(business_name)")
    .eq("token", token)
    .single();
  return data;
}

/**
 * Llamada desde el formulario público de invitación. Crea la cuenta del
 * cliente con los datos que él mismo completó, lo deja activo de una y
 * logueado directo en su portal. Se notifica a los admins para que sepan
 * que hay un cliente nuevo.
 */
export async function completeInvitationAction(token: string, formData: FormData) {
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("client_invitations")
    .select("*, clients(business_name)")
    .eq("token", token)
    .single();

  if (!invite) return { error: "Este link de invitación no existe." };

  // Doble envío / re-apertura del mismo link: ya se registró, no es un error.
  if (invite.used_at) {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    if (email && password) {
      const supabase = await createClient();
      await supabase.auth.signInWithPassword({ email, password });
    }
    redirect("/portal");
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: "Este link de invitación venció. Pedile a MR14 que te genere uno nuevo." };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!name || !email || !password) return { error: "Completá nombre, email y contraseña." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "Las contraseñas no coinciden." };

  let clientId = invite.client_id as string | null;
  let businessName = (invite.clients as { business_name?: string } | null)?.business_name ?? "";

  // Invitación "abierta": todavía no existe el cliente, lo crea el prospecto acá mismo.
  if (!clientId) {
    businessName = String(formData.get("business_name") || "").trim();
    const city = String(formData.get("city") || "").trim();

    if (!businessName) return { error: "Completá el nombre de tu negocio." };

    const { data: newClient, error: clientError } = await admin
      .from("clients")
      .insert({
        business_name: businessName,
        contact_name: name,
        phone: phone || null,
        whatsapp: phone || null,
        email,
        city: city || null,
        status: "prospecto",
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      return { error: clientError?.message ?? "No se pudo registrar tu negocio." };
    }
    clientId = newClient.id;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createError || !created?.user) {
    const msg = /already been registered|already exists/i.test(createError?.message ?? "")
      ? "Ya existe una cuenta con ese email. Iniciá sesión normalmente o pedile a MR14 que la revise."
      : (createError?.message ?? "No se pudo crear la cuenta.");
    return { error: msg };
  }

  const { error: memberError } = await admin.from("client_members").insert({
    client_id: clientId,
    user_id: created.user.id,
    email,
    name,
    phone: phone || null,
    role_in_client: invite.role_in_client,
    status: "active",
    invited_by: invite.created_by,
  });

  if (memberError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: memberError.message };
  }

  await admin.from("client_invitations").delete().eq("id", invite.id);

  await admin.from("project_history").insert({
    client_id: clientId,
    event: `${name} completó su registro (${email})`,
    visibility: "internal",
  });

  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins && admins.length > 0) {
    const adminIds = admins.map((a) => a.id);
    const notifTitle = "Nuevo cliente registrado";
    const notifBody = `${name} (${businessName || "cliente nuevo"}) completó su registro y ya tiene acceso a su portal.`;
    await admin.from("notifications").insert(
      adminIds.map((user_id) => ({
        user_id,
        type: "member_pending_approval",
        title: notifTitle,
        body: notifBody,
      }))
    );
    await sendPushToUsers(adminIds, { title: notifTitle, body: notifBody, url: `/clients/${clientId}` });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  redirect("/portal");
}

/** Llamada por el propio usuario cliente tras activar su cuenta vía un link genérico de Supabase (ej. recuperación). */
export async function activateMembershipAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("client_members").update({ status: "active" }).eq("user_id", user.id).eq("status", "invited");
}

/** El admin aprueba una solicitud de acceso: recién ahí el cliente puede entrar al portal. */
export async function approveClientMemberAction(memberId: string, clientId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("client_members").update({ status: "active" }).eq("id", memberId);
  if (error) return { error: error.message };
  await logHistory({ clientId, event: "Acceso al portal aprobado" });
  revalidatePath(`/clients/${clientId}`);
}

export async function removeClientMemberAction(memberId: string, clientId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("client_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: "Usuario removido del acceso al portal" });
  revalidatePath(`/clients/${clientId}`);
}

/** El admin edita los datos de un miembro ya creado desde el panel. */
export async function updateClientMemberAction(memberId: string, clientId: string, formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const roleInClient = String(formData.get("role_in_client") || "colaborador");

  const { error } = await admin
    .from("client_members")
    .update({ name, phone: phone || null, role_in_client: roleInClient })
    .eq("id", memberId);

  if (error) return { error: error.message };

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

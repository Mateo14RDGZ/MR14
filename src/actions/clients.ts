"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logHistory } from "@/lib/history";
import type { ClientStatus } from "@/lib/types";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function buildClientPayload(formData: FormData) {
  const social_links: Record<string, string> = {};
  for (const key of ["instagram", "facebook", "tiktok", "linkedin", "x"]) {
    const v = str(formData, `social_${key}`);
    if (v) social_links[key] = v;
  }

  return {
    business_name: str(formData, "business_name") ?? "Sin nombre",
    contact_name: str(formData, "contact_name"),
    ci: str(formData, "ci"),
    rut: str(formData, "rut"),
    phone: str(formData, "phone"),
    whatsapp: str(formData, "whatsapp"),
    email: str(formData, "email"),
    address: str(formData, "address"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    country: str(formData, "country") ?? "Uruguay",
    social_links,
    website: str(formData, "website"),
    notes: str(formData, "notes"),
    status: (str(formData, "status") ?? "prospecto") as ClientStatus,
    start_date: str(formData, "start_date"),
    delivery_date: str(formData, "delivery_date"),
  };
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = buildClientPayload(formData);
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...payload, created_by: user?.id ?? null })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear el cliente." };
  }

  await logHistory({ clientId: data.id, event: "Cliente creado" });
  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const payload = buildClientPayload(formData);

  const { data: prev } = await supabase
    .from("clients")
    .select("status")
    .eq("id", clientId)
    .single();

  const { error } = await supabase.from("clients").update(payload).eq("id", clientId);
  if (error) return { error: error.message };

  if (prev && prev.status !== payload.status) {
    await logHistory({
      clientId,
      event: `Estado cambiado a "${payload.status}"`,
    });
  } else {
    await logHistory({ clientId, event: "Ficha del cliente actualizada" });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function updateClientStatusAction(clientId: string, status: ClientStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ status }).eq("id", clientId);
  if (error) throw new Error(error.message);
  await logHistory({ clientId, event: `Estado cambiado a "${status}"` });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

const LOGO_BUCKET = "client-logos";

export async function uploadClientLogoAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Seleccioná una imagen." };
  if (!file.type.startsWith("image/")) return { error: "El archivo debe ser una imagen." };
  if (file.size > 5 * 1024 * 1024) return { error: "La imagen no puede pesar más de 5MB." };

  // Path fijo por cliente (sin extensión, el content-type ya viaja en los
  // metadatos): un re-upload sobreescribe el mismo objeto en vez de dejar
  // archivos viejos sueltos en el bucket.
  const path = `${clientId}/logo`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  // Cache-bust: mismo path público, así que sin esto el navegador podría
  // seguir mostrando el logo anterior tras reemplazarlo.
  const logo_url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase.from("clients").update({ logo_url }).eq("id", clientId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true, logo_url };
}

/**
 * Borra al cliente por completo: la ficha, todo lo que cuelga de ella
 * (proyectos, credenciales, documentos, pagos, tickets, historial, etc. —
 * vía "on delete cascade" en la base) y además lo que el cascade de la base
 * NO cubre: los archivos en Storage y las cuentas de Supabase Auth de los
 * usuarios del portal de ese cliente (para que no quede ni el email dando
 * vueltas).
 */
export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id ?? "").single();
  if (profile?.role !== "admin") throw new Error("Acción restringida a administradores de MR14.");

  const admin = createAdminClient();

  const [{ data: members }, { data: documents }, { data: attachments }] = await Promise.all([
    admin.from("client_members").select("user_id, email").eq("client_id", clientId),
    admin.from("documents").select("storage_path").eq("client_id", clientId),
    admin.from("ticket_attachments").select("storage_path, tickets!inner(client_id)").eq("tickets.client_id", clientId),
  ]);

  if (documents && documents.length > 0) {
    await admin.storage.from("documents").remove(documents.map((d) => d.storage_path));
  }
  if (attachments && attachments.length > 0) {
    await admin.storage.from("ticket-attachments").remove(attachments.map((a) => a.storage_path));
  }
  // Path fijo (ver uploadClientLogoAction): no hace falta consultar si existe.
  await admin.storage.from("client-logos").remove([`${clientId}/logo`]);

  // Borrar primero la fila del cliente: todo lo que cuelga de client_id (o
  // de sus proyectos) tiene "on delete cascade" en la base, así que se lleva
  // puesto proyectos, pagos, credenciales, documentos, tickets, solicitudes,
  // historial, todo. Recién ahí quedan libres las cuentas de Auth de los
  // usuarios del portal — columnas como tickets.created_by o
  // requests.created_by referencian auth.users SIN cascade, así que borrar
  // esas cuentas ANTES fallaba (violación de FK) apenas el usuario había
  // creado algún ticket o solicitud, que es el caso normal.
  const { error } = await admin.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);

  if (members && members.length > 0) {
    const failedEmails: string[] = [];
    for (const m of members) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(m.user_id);
      if (deleteUserError) failedEmails.push(m.email);
    }
    if (failedEmails.length > 0) {
      // El cliente y todos sus datos ya se borraron en este punto — esto es
      // solo la cuenta de Auth suelta, no bloquea ni revierte lo anterior.
      console.error(
        `Cliente ${clientId} eliminado, pero no se pudieron borrar estas cuentas de Auth: ${failedEmails.join(", ")}`
      );
    }
  }

  revalidatePath("/clients");
  redirect("/clients");
}

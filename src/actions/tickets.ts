"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import { notifyUsers, getAdminUserIds, getClientMemberUserIds } from "@/lib/notifications";
import { slugify } from "@/lib/utils";
import { CLIENT_TICKET_STATUS_LABEL, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, type TicketCategory, type TicketPriority, type TicketStatus } from "@/lib/types";

const ATTACHMENTS_BUCKET = "ticket-attachments";
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];

function validateFiles(formData: FormData) {
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 5) return "Podés adjuntar hasta 5 archivos.";
  if (files.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_BYTES) return "Los adjuntos superan los 3 MB. Elegí menos archivos o una foto más pequeña.";
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) return `"${file.name}" supera los 3 MB.`;
    if (!ALLOWED_MIME.includes(file.type)) return "Usá fotos JPG, PNG, WEBP, GIF o documentos PDF.";
  }
  return null;
}

function refreshTicket(ticketId: string) {
  revalidatePath("/support");
  revalidatePath("/portal");
  revalidatePath("/portal/solicitudes");
  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/portal/solicitudes/${ticketId}`);
}

async function getCurrentUserAndRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as "admin" | "client" | null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, role: (profile?.role ?? "client") as "admin" | "client" };
}

async function assertAdmin() {
  const { supabase, user, role } = await getCurrentUserAndRole();
  if (!user || role !== "admin") throw new Error("Acción restringida a administradores de MR14.");
  return { supabase, user };
}

async function uploadAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  ticketId: string,
  userId: string,
  files: File[],
  messageId?: string
) {
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`"${file.name}" supera el límite de 3 MB.`);
    }
    if (file.type && !ALLOWED_MIME.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.name}`);
    }
    const path = `${clientId}/${ticketId}/${Date.now()}-${slugify(file.name)}`;
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, buffer, { contentType: file.type || "application/octet-stream" });
    if (uploadError) throw new Error(uploadError.message);

    const { error: attachmentError } = await supabase.from("ticket_attachments").insert({
      ticket_id: ticketId,
      message_id: messageId ?? null,
      uploaded_by: userId,
      name: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
    if (attachmentError) {
      await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path]);
      throw new Error("No se pudo guardar el adjunto.");
    }
  }
}

// ---------------- CREATE ----------------
// Rol-agnóstico a propósito: lo usa tanto el cliente (desde el portal, con
// su client_id fijo) como el admin (desde Soporte o la ficha de un cliente,
// eligiendo cliente/proyecto/prioridad a mano). El origen queda determinado
// por created_by + el rol de ese usuario — no hace falta una columna nueva.
export async function createTicketAction(clientId: string, formData: FormData) {
  const { supabase, user, role } = await getCurrentUserAndRole();
  if (!user) return { error: "No autenticado." };

  const projectId = String(formData.get("project_id") || "");
  const category = (String(formData.get("category") || "other")) as TicketCategory;
  const subject = String(formData.get("subject") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const requestedPriority = String(formData.get("priority") || "") as TicketPriority | "";

  if (!projectId || !subject || !description) {
    return { error: "Completá proyecto, asunto y descripción." };
  }
  if (subject.length > 160 || description.length > 10000) return { error: "Usá un asunto de hasta 160 caracteres y un mensaje de hasta 10.000." };
  if (!TICKET_CATEGORIES.some(item => item.value === category)) return { error: "Elegí un tipo de consulta válido." };
  if (requestedPriority && !TICKET_PRIORITIES.some(item => item.value === requestedPriority)) return { error: "Prioridad no válida." };
  const fileError = validateFiles(formData);
  if (fileError) return { error: fileError };
  const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("client_id", clientId).maybeSingle();
  if (!project) return { error: "No encontramos esa web en tu cuenta." };

  // El cliente elige la prioridad; si no manda nada (o es admin creando sin
  // tocar el campo) se infiere de la categoría como antes.
  const priority: TicketPriority = requestedPriority || (category === "site_down" ? "high" : "normal");

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      client_id: clientId,
      project_id: projectId,
      created_by: user.id,
      category,
      subject,
      description,
      priority,
    })
    .select("id, number")
    .single();

  if (error || !ticket) return { error: error?.message ?? "No se pudo crear la solicitud." };

  await supabase.from("ticket_events").insert({
    ticket_id: ticket.id,
    actor_id: user.id,
    event_type: "created",
    meta: { subject },
  });

  const files = formData.getAll("files") as File[];
  let attachmentWarning = false;
  try {
    await uploadAttachments(supabase, clientId, ticket.id, user.id, files);
  } catch (e) {
    // El ticket ya se creó; el adjunto fallido no debe perderlo, solo se informa.
    attachmentWarning = true;
    console.error("ticket_attachment_failed", e instanceof Error ? e.name : "upload");
  }

  await logHistory({
    clientId,
    projectId,
    event: `Solicitud de soporte creada: ${ticket.number}`,
    visibility: "internal",
  });

  // Si lo creó el cliente, avisar a MR14. Si lo creó MR14 mismo, no hay a
  // quién avisar internamente — evita notificarse a sí mismo sin motivo.
  if (role === "client") {
    const adminIds = await getAdminUserIds();
    await notifyUsers({
      userIds: adminIds,
      type: "ticket_created",
      title: `Nuevo ticket ${ticket.number}`,
      body: subject,
      ticketId: ticket.id,
      url: `/support/${ticket.id}`,
    });
  } else {
    await notifyUsers({
      userIds: (await getClientMemberUserIds(clientId)).filter(id => id !== user.id),
      type: "ticket_created", title: "Mateo abrió una consulta para vos",
      body: subject, ticketId: ticket.id, url: `/portal/solicitudes/${ticket.id}`,
    });
  }

  revalidatePath("/portal/solicitudes");
  revalidatePath("/support");
  const destination = role === "admin" ? `/support/${ticket.id}` : `/portal/solicitudes/${ticket.id}`;
  redirect(`${destination}?created=1${attachmentWarning ? "&attachmentWarning=1" : ""}`);
}

// ---------------- MESSAGES ----------------
export async function addTicketMessageAction(ticketId: string, formData: FormData) {
  const { supabase, user, role } = await getCurrentUserAndRole();
  if (!user || !role) return { error: "No autenticado." };

  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Escribí un mensaje." };
  const fileError = validateFiles(formData);
  if (fileError) return { error: fileError };
  if (body.length > 10000) return { error: "El mensaje puede tener hasta 10.000 caracteres." };
  const resolve = role === "admin" && formData.get("intent") === "resolve";

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, client_id, project_id, number, status")
    .eq("id", ticketId)
    .single();
  if (!ticket) return { error: "Ticket no encontrado." };

  if (ticket.status === "closed") return { error: "Retomá la consulta para poder responder." };
  const { data: messageId, error } = await supabase.rpc("send_ticket_reply", {
    p_ticket_id: ticketId, p_body: body, p_resolve: resolve,
  });
  if (error || !messageId) return { error: error?.message ?? "No se pudo enviar el mensaje." };

  const files = formData.getAll("files") as File[];
  let warning: string | undefined;
  try {
    await uploadAttachments(supabase, ticket.client_id, ticketId, user.id, files, messageId);
  } catch (e) {
    warning = "El mensaje se envió, pero faltó un adjunto. Podés enviarlo en otro mensaje.";
    console.error("reply_attachment_failed", e instanceof Error ? e.name : "upload");
  }

  if (role === "admin") {
    const clientMemberIds = await getClientMemberUserIds(ticket.client_id);
    await notifyUsers({
      userIds: clientMemberIds,
      type: "ticket_message",
      title: resolve ? "Mateo resolvió tu consulta" : "Mateo te respondió",
      body,
      ticketId,
      url: `/portal/solicitudes/${ticketId}`,
    });
  } else {
    const adminIds = await getAdminUserIds();
    await notifyUsers({
      userIds: adminIds,
      type: "ticket_message",
      title: `${ticket.number}: nueva respuesta del cliente`,
      body,
      ticketId,
      url: `/support/${ticketId}`,
    });
  }

  refreshTicket(ticketId);
  return { success: true, warning };
}

// ---------------- STATUS / PRIORITY (admin) ----------------
export async function updateTicketStatusAction(ticketId: string, status: TicketStatus) {
  const { supabase, user } = await assertAdmin();
  if (!TICKET_STATUSES.some(item => item.value === status)) throw new Error("Estado no válido.");

  const { data: ticket } = await supabase
    .from("tickets")
    .select("client_id, project_id, number")
    .eq("id", ticketId)
    .single();
  if (!ticket) throw new Error("Ticket no encontrado.");

  const patch: Record<string, unknown> = { status };
  if (status === "resolved") {
    patch.resolved_at = new Date().toISOString();
    patch.reopen_deadline = null;
    patch.closed_at = null;
  }
  if (status === "closed") {
    patch.closed_at = new Date().toISOString();
  }
  if (!["closed", "resolved"].includes(status)) {
    patch.closed_at = null;
    patch.resolved_at = null;
    patch.reopen_deadline = null;
  }

  const { error } = await supabase.from("tickets").update(patch).eq("id", ticketId);
  if (error) throw new Error(error.message);

  await supabase.from("ticket_events").insert({
    ticket_id: ticketId,
    actor_id: user.id,
    event_type: status === "closed" ? "closed" : "status_changed",
    meta: { status },
  });

  // visibility "client": lo ve el cliente en su historial — nombre y estado
  // en su idioma (Solicitudes/CLIENT_TICKET_STATUS_LABEL), no el enum interno.
  await logHistory({
    clientId: ticket.client_id,
    projectId: ticket.project_id,
    event: `Solicitud ${ticket.number}: ${CLIENT_TICKET_STATUS_LABEL[status]}`,
    visibility: "client",
  });

  // Solo se avisa al cliente en los dos momentos que le importan: cuando
  // necesitamos algo de él, o cuando su ticket queda resuelto. El resto de
  // los estados (reviewing, in_progress, approved, closed...) son gestión
  // interna y no ameritan una notificación.
  if (status === "waiting_client" || status === "resolved" || status === "closed") {
    const clientMemberIds = await getClientMemberUserIds(ticket.client_id);
    await notifyUsers({
      userIds: clientMemberIds,
      type: status === "waiting_client" ? "ticket_needs_client_reply" : "ticket_resolved",
      title: status === "waiting_client" ? "Mateo necesita tu respuesta" : "Tu consulta fue resuelta",
      body: status === "waiting_client" ? "Abrí la consulta para responderle." : "Podés revisar la respuesta o avisar si todavía necesitás ayuda.",
      ticketId,
      url: status === "waiting_client" ? `/portal/solicitudes/${ticketId}#responder` : `/portal/solicitudes/${ticketId}`,
    });
  }

  refreshTicket(ticketId);
}

export async function updateTicketPriorityAction(ticketId: string, priority: TicketPriority) {
  const { supabase } = await assertAdmin();
  if (!TICKET_PRIORITIES.some(item => item.value === priority)) throw new Error("Prioridad no válida.");
  const { error } = await supabase.from("tickets").update({ priority }).eq("id", ticketId);
  if (error) throw new Error(error.message);
  await supabase.from("ticket_events").insert({ ticket_id: ticketId, event_type: "priority_changed", meta: { priority } });
  revalidatePath(`/support/${ticketId}`);
}

// ---------------- CLIENT: CLOSE / REOPEN ----------------
async function changeConversationState(ticketId: string, reopen: boolean) {
  const { supabase, user, role } = await getCurrentUserAndRole();
  if (!user) throw new Error("Iniciá sesión para continuar.");
  const { data: ticket } = await supabase.from("tickets").select("id, client_id, status, number, subject").eq("id", ticketId).maybeSingle();
  if (!ticket) throw new Error("Consulta no encontrada.");
  const status = reopen ? "reviewing" : "closed";
  if (ticket.status === status) return;
  if (reopen && !["closed", "resolved"].includes(ticket.status)) throw new Error("La consulta ya está abierta.");
  const { data: updated, error } = await supabase.from("tickets").update({
    status, closed_at: reopen ? null : new Date().toISOString(),
    ...(reopen ? { resolved_at: null, reopen_deadline: null } : {}),
  }).eq("id", ticketId).eq("status", ticket.status).select("status").maybeSingle();
  if (error || updated?.status !== status) throw new Error("No pudimos cambiar el estado. Actualizá la consulta e intentá de nuevo.");
  await supabase.from("ticket_events").insert({ ticket_id: ticketId, actor_id: user.id, event_type: reopen ? "reopened" : "closed" });
  await notifyUsers({
    userIds: (role === "admin" ? await getClientMemberUserIds(ticket.client_id) : await getAdminUserIds()).filter(id => id !== user.id),
    type: "ticket_status_changed",
    title: role === "admin"
      ? (reopen ? "Mateo retomó tu consulta" : "Mateo cerró tu consulta")
      : `${ticket.number}: el cliente ${reopen ? "retomó" : "cerró"} la consulta`,
    body: ticket.subject, ticketId,
    url: role === "admin" ? `/portal/solicitudes/${ticketId}` : `/support/${ticketId}`,
  });
  refreshTicket(ticketId);
}

export async function closeTicketAction(ticketId: string) {
  return changeConversationState(ticketId, false);
}

export async function reopenTicketAction(ticketId: string) {
  return changeConversationState(ticketId, true);
}

// ---------------- QUOTES (admin crea, cliente decide) ----------------
export async function createQuoteAction(ticketId: string, formData: FormData) {
  const { supabase } = await assertAdmin();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("client_id, project_id, number")
    .eq("id", ticketId)
    .single();
  if (!ticket) throw new Error("Ticket no encontrado.");

  const description = String(formData.get("description") || "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "UYU");
  const estimatedDays = formData.get("estimated_days") ? Number(formData.get("estimated_days")) : null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const validUntil = String(formData.get("valid_until") || "") || null;

  if (!description || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Completá descripción y un monto válido." };
  }

  const { data: existingQuote } = await supabase.from("ticket_quotes").select("*").eq("ticket_id", ticketId).maybeSingle();

  let quote = existingQuote;
  let version: number;

  if (!quote) {
    const { data: newQuote, error } = await supabase
      .from("ticket_quotes")
      .insert({ ticket_id: ticketId })
      .select("*")
      .single();
    if (error || !newQuote) return { error: error?.message ?? "No se pudo crear el presupuesto." };
    quote = newQuote;
    version = quote.current_version;
  } else {
    // Nueva versión: la anterior (aceptada, rechazada o no) queda superada,
    // nunca se edita directamente. Este es el número real de la versión
    // que se está por insertar, no el que ya tenía la fila antes del update.
    version = quote.current_version + 1;
    await supabase.from("ticket_quotes").update({ status: "pending", current_version: version }).eq("id", quote.id);
  }
  const { error: versionError } = await supabase.from("ticket_quote_versions").insert({
    quote_id: quote.id,
    version,
    description,
    amount,
    currency,
    estimated_days: estimatedDays,
    notes,
    valid_until: validUntil,
  });
  if (versionError) return { error: versionError.message };

  await supabase.from("tickets").update({ status: "requires_quote" }).eq("id", ticketId);
  await supabase.from("ticket_events").insert({
    ticket_id: ticketId,
    event_type: "quote_created",
    meta: { amount, currency, version },
  });

  const clientMemberIds = await getClientMemberUserIds(ticket.client_id);
  await notifyUsers({
    userIds: clientMemberIds,
    type: "quote_received",
    title: "Tenés un presupuesto para revisar",
    body: description,
    ticketId,
    url: `/portal/solicitudes/${ticketId}`,
  });

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/portal/solicitudes/${ticketId}`);
}

export async function decideQuoteAction(
  quoteVersionId: string,
  ticketId: string,
  decision: "accepted" | "rejected",
  reason?: string
) {
  const { supabase, user } = await getCurrentUserAndRole();
  if (!user) throw new Error("No autenticado.");

  const { error } = await supabase.rpc("decide_ticket_quote", {
    p_ticket_id: ticketId, p_version_id: quoteVersionId,
    p_decision: decision, p_reason: reason?.trim().slice(0, 500) || null,
  });
  if (error) throw new Error(error.message);

  const { data: ticket } = await supabase.from("tickets").select("client_id, project_id, number").eq("id", ticketId).single();
  if (ticket) {
    await logHistory({
      clientId: ticket.client_id,
      projectId: ticket.project_id,
      event: `Presupuesto de ${ticket.number} ${decision === "accepted" ? "aceptado" : "rechazado"}`,
      visibility: "client",
    });
    const adminIds = await getAdminUserIds();
    await notifyUsers({
      userIds: adminIds,
      type: decision === "accepted" ? "quote_accepted" : "quote_rejected",
      title: `Presupuesto ${decision === "accepted" ? "aceptado" : "rechazado"}: ${ticket.number}`,
      ticketId,
      url: `/support/${ticketId}`,
    });
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/portal/solicitudes/${ticketId}`);
}

export async function getTicketAttachmentUrlAction(storagePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data) throw new Error("No se pudo generar el enlace del archivo.");
  return data.signedUrl;
}

export async function assignTicketAction(ticketId: string, assigneeId: string | null) {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("tickets").update({ assigned_to: assigneeId }).eq("id", ticketId);
  if (error) throw new Error(error.message);
  await supabase.from("ticket_events").insert({ ticket_id: ticketId, event_type: "assigned", meta: { assigneeId } });
  revalidatePath(`/support/${ticketId}`);
}

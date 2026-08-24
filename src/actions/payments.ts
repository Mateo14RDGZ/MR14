"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logHistory } from "@/lib/history";
import { formatCurrency } from "@/lib/utils";

export async function createPaymentAction(clientId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Ingresá un monto válido." };

  const payload = {
    client_id: clientId,
    project_id: projectId,
    amount,
    method: String(formData.get("method") || "").trim() || null,
    paid_at: String(formData.get("paid_at") || new Date().toISOString().slice(0, 10)),
    notes: String(formData.get("notes") || "").trim() || null,
    created_by: user?.id ?? null,
  };

  const { error } = await supabase.from("payments").insert(payload);
  if (error) return { error: error.message };

  const { data: project } = await supabase.from("projects").select("price,amount_paid").eq("id", projectId).single();
  if (project) {
    const newPaid = Number(project.amount_paid);
    const status = newPaid >= Number(project.price) ? "pagado" : newPaid > 0 ? "parcial" : "pendiente";
    await supabase.from("projects").update({ payment_status: status }).eq("id", projectId);
  }

  await logHistory({
    clientId,
    projectId,
    event: `Pago registrado (${formatCurrency(amount)})`,
    visibility: "client",
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function deletePaymentAction(id: string, clientId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/projects/${projectId}`);
}

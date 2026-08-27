"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function buildPayload(formData: FormData) {
  return {
    label: str(formData, "label") ?? "Cuenta",
    bank: str(formData, "bank"),
    account_holder: str(formData, "account_holder"),
    account_number: str(formData, "account_number"),
    account_type: str(formData, "account_type"),
    currency: str(formData, "currency") ?? "UYU",
    notes: str(formData, "notes"),
  };
}

export async function createPaymentMethodAction(formData: FormData) {
  const supabase = await createClient();
  const payload = buildPayload(formData);

  const { count } = await supabase.from("payment_methods").select("id", { count: "exact", head: true });

  const { error } = await supabase.from("payment_methods").insert({ ...payload, position: count ?? 0 });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/portal/pagos");
}

export async function updatePaymentMethodAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const payload = buildPayload(formData);

  const { error } = await supabase.from("payment_methods").update(payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/portal/pagos");
}

export async function togglePaymentMethodActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/portal/pagos");
}

export async function deletePaymentMethodAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/portal/pagos");
}

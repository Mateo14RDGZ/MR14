import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientEditForm } from "@/components/clients/ClientEditForm";
import { ArrowLeft } from "lucide-react";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link href={`/clients/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> {client.business_name}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Editar cliente</h1>
      <ClientEditForm client={client} />
    </div>
  );
}

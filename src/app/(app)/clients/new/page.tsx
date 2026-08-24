"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientForm } from "@/components/clients/ClientForm";
import { createClientAction } from "@/actions/clients";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();

  async function action(_prev: { error?: string } | undefined, formData: FormData) {
    const result = await createClientAction(formData);
    if (result?.error) return result;
    router.refresh();
    return undefined;
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Clientes
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
      <ClientForm action={action} />
    </div>
  );
}

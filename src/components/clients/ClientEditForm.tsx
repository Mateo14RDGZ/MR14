"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "./ClientForm";
import { updateClientAction } from "@/actions/clients";
import type { Client } from "@/lib/types";

export function ClientEditForm({ client }: { client: Client }) {
  const router = useRouter();

  async function action(_prev: { error?: string } | undefined, formData: FormData) {
    const result = await updateClientAction(client.id, formData);
    if (result?.error) return result;
    router.refresh();
    return undefined;
  }

  return <ClientForm client={client} action={action} />;
}

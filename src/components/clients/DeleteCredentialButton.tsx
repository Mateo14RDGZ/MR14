"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteCredentialAction } from "@/actions/credentials";
import { Trash2 } from "lucide-react";

export function DeleteCredentialButton({ id, clientId }: { id: string; clientId: string }) {
  return (
    <ConfirmButton
      action={() => deleteCredentialAction(id, clientId)}
      label={<Trash2 size={14} />}
      variant="ghost"
      size="icon"
      confirmTitle="¿Eliminar credencial?"
      confirmDescription="Esta acción no se puede deshacer."
    />
  );
}

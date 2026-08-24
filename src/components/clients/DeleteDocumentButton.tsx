"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteDocumentAction } from "@/actions/documents";
import { Trash2 } from "lucide-react";

export function DeleteDocumentButton({
  id,
  storagePath,
  clientId,
}: {
  id: string;
  storagePath: string;
  clientId: string;
}) {
  return (
    <ConfirmButton
      action={() => deleteDocumentAction(id, storagePath, clientId)}
      label={<Trash2 size={14} />}
      variant="ghost"
      size="icon"
      confirmTitle="¿Eliminar documento?"
      confirmDescription="Se eliminará también el archivo del almacenamiento."
    />
  );
}

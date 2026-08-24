"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteClientAction } from "@/actions/clients";
import { Trash2 } from "lucide-react";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  return (
    <ConfirmButton
      action={() => deleteClientAction(clientId)}
      label={
        <>
          <Trash2 size={14} /> Eliminar
        </>
      }
      confirmTitle="¿Eliminar cliente?"
      confirmDescription="Se eliminarán también sus proyectos, credenciales, documentos e historial. Esta acción no se puede deshacer."
    />
  );
}

"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteProjectAction } from "@/actions/projects";
import { Trash2 } from "lucide-react";

export function DeleteProjectButton({ projectId, clientId }: { projectId: string; clientId: string }) {
  return (
    <ConfirmButton
      action={() => deleteProjectAction(projectId, clientId)}
      label={
        <>
          <Trash2 size={14} /> Eliminar
        </>
      }
      confirmTitle="¿Eliminar proyecto?"
      confirmDescription="Se eliminará también su infraestructura, checklist e historial asociados."
    />
  );
}

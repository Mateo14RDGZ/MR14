"use client";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { removeClientMemberAction } from "@/actions/members";
import { UserMinus } from "lucide-react";

export function RemoveMemberButton({ id, clientId }: { id: string; clientId: string }) {
  return (
    <ConfirmButton
      action={() => removeClientMemberAction(id, clientId)}
      label={<UserMinus size={14} />}
      variant="ghost"
      size="icon"
      confirmTitle="¿Quitar acceso al portal?"
      confirmDescription="El usuario dejará de poder acceder a la información de este cliente."
    />
  );
}

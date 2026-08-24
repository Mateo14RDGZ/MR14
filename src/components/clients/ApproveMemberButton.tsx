"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { approveClientMemberAction } from "@/actions/members";
import { Check } from "lucide-react";

export function ApproveMemberButton({ memberId, clientId }: { memberId: string; clientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await approveClientMemberAction(memberId, clientId);
          if (result?.error) toast.error(result.error);
          else toast.success("Acceso aprobado. Ya puede entrar al portal.");
        })
      }
    >
      <Check size={13} /> {pending ? "Aprobando…" : "Aprobar"}
    </Button>
  );
}

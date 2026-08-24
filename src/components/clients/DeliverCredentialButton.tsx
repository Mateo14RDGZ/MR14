"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { deliverCredentialAction } from "@/actions/credentials";
import { Send } from "lucide-react";

export function DeliverCredentialButton({ id, clientId }: { id: string; clientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deliverCredentialAction(id, clientId);
          if (result?.error) toast.error(result.error);
          else toast.success("Acceso marcado como entregado.");
        })
      }
    >
      <Send size={13} /> Entregar acceso
    </Button>
  );
}

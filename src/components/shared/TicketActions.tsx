"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, RotateCcw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { closeTicketAction, reopenTicketAction, updateTicketStatusAction } from "@/actions/tickets";

export function TicketActions({ ticketId, status, role }: { ticketId: string; status: string; role: "admin" | "client" }) {
  const [pending, startTransition] = useTransition();
  const finished = status === "closed" || status === "resolved";
  function change(action: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      try { await action(); toast.success(message); }
      catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar. Intentá nuevamente."); }
    });
  }
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">
        {finished ? "La consulta está terminada. Podés retomarla si necesitás seguir hablando."
          : role === "client" ? (status === "waiting_client" ? "Mateo te respondió. Leé el mensaje y contale cómo seguir." : "Podés agregar un mensaje o cerrar la consulta si ya no necesitás ayuda.")
          : status === "waiting_client" ? "Esperando al cliente. La consulta volverá a tu bandeja cuando responda."
          : "Respondé al cliente o marcá la consulta como terminada."}
      </p>
      <div className="flex flex-wrap gap-2 [&>button]:min-h-11">
        {!finished && <Button onClick={() => {
          const field = document.getElementById("ticket-reply");
          field?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
          field?.focus({ preventScroll: true });
        }}><MessageSquare size={16} /> Responder</Button>}
        {finished
          ? <Button disabled={pending} onClick={() => change(() => reopenTicketAction(ticketId), "Consulta retomada. Ya podés responder.")}>
              <RotateCcw size={16} /> {pending ? "Abriendo…" : "Retomar consulta"}
            </Button>
          : <Button variant="secondary" disabled={pending} onClick={() => change(() => closeTicketAction(ticketId), "Consulta cerrada. Podés retomarla cuando necesites.")}>
              <Check size={16} /> {pending ? "Cerrando…" : role === "client" ? "Cerrar consulta" : "Cerrar ticket"}
            </Button>}
        {role === "admin" && !finished && status !== "in_progress" && <Button variant="ghost" disabled={pending} onClick={() => change(() => updateTicketStatusAction(ticketId, "in_progress"), "Marcado en proceso.")}>Estoy trabajando</Button>}
      </div>
    </div>
  );
}

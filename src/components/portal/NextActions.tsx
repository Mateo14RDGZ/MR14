import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { formatCurrency, daysUntil } from "@/lib/utils";
import type { Project } from "@/lib/types";

export interface NextAction {
  text: string;
  href: string;
  cta: string;
}

const AWAITING_CLIENT_STAGES = new Set(["primera_version", "revision", "ajustes"]);

/**
 * Deriva del estado real del proyecto/pagos/dominio/tickets qué necesita
 * hacer el cliente ahora mismo, sin depender de un campo nuevo en la base.
 */
export function computeNextActions({
  project,
  domainExpiryDate,
  ticketsWaitingReply,
}: {
  project: Project | null;
  domainExpiryDate: string | null | undefined;
  ticketsWaitingReply: number;
}): NextAction[] {
  const actions: NextAction[] = [];

  if (project && AWAITING_CLIENT_STAGES.has(project.stage)) {
    actions.push({
      text: "Esperamos tu aprobación sobre el avance del proyecto.",
      href: "/portal/mi-web",
      cta: "Ver proyecto",
    });
  }

  if (project && project.balance > 0) {
    actions.push({
      text: `Tenés un saldo pendiente de ${formatCurrency(project.balance, project.currency)}.`,
      href: "/portal/pagos",
      cta: "Ver pagos",
    });
  }

  const domainDays = daysUntil(domainExpiryDate);
  if (domainDays !== null && domainDays >= 0 && domainDays <= 30) {
    actions.push({
      text: `Tu dominio vence en ${domainDays} día${domainDays === 1 ? "" : "s"}.`,
      href: "/portal/renovaciones",
      cta: "Ver renovaciones",
    });
  }

  if (ticketsWaitingReply > 0) {
    actions.push({
      text: `Tenés ${ticketsWaitingReply === 1 ? "un ticket esperando" : `${ticketsWaitingReply} tickets esperando`} tu respuesta.`,
      href: "/portal/solicitudes",
      cta: "Responder",
    });
  }

  return actions;
}

export function NextActionsPanel({ actions }: { actions: NextAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/25 bg-success-soft px-4 py-3.5">
        <CheckCircle2 size={18} className="shrink-0 text-success" />
        <p className="text-sm font-medium text-success">Todo al día. No tenés ninguna acción pendiente.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <p className="border-b border-border px-4 py-2.5 text-label">Qué necesito de vos ahora</p>
      <div className="divide-y divide-border">
        {actions.map((a, i) => (
          <Link
            key={i}
            href={a.href}
            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <p className="text-sm">{a.text}</p>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent">
              {a.cta} <ArrowRight size={13} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

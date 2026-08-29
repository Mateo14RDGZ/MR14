import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
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
      text: "Revisá el avance de tu web.",
      href: "/portal/mi-web",
      cta: "Revisar",
    });
  }

  if (project && project.balance > 0) {
    actions.push({
      text: `Tenés un pago pendiente de ${formatCurrency(project.balance, project.currency)}.`,
      href: "/portal/pagos",
      cta: "Ver pago",
    });
  }

  const domainDays = daysUntil(domainExpiryDate);
  if (domainDays !== null && domainDays >= 0 && domainDays <= 30) {
    actions.push({
      text: `Tu dominio vence en ${domainDays} día${domainDays === 1 ? "" : "s"}.`,
      href: "/portal/renovaciones",
      cta: "Ver",
    });
  }

  if (ticketsWaitingReply > 0) {
    actions.push({
      text:
        ticketsWaitingReply === 1
          ? "Tenés una solicitud esperando tu respuesta."
          : `Tenés ${ticketsWaitingReply} solicitudes esperando tu respuesta.`,
      href: "/portal/solicitudes",
      cta: "Responder",
    });
  }

  return actions;
}

export function NextActionsPanel({ actions }: { actions: NextAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success-soft/70 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p className="font-semibold text-success">No tenés nada pendiente</p>
          <p className="mt-0.5 text-xs text-muted">Nosotros te avisamos cuando necesitemos algo.</p>
        </div>
      </div>
    );
  }

  const [primary, ...secondary] = actions;

  return (
    <section className="overflow-hidden rounded-2xl border border-accent/25 bg-surface shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Sparkles size={15} className="text-accent" />
        <h2 className="text-sm font-semibold">Tu próximo paso</h2>
      </div>
      <Link href={primary.href} className="group flex items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-surface-2">
        <p className="max-w-xl text-base font-medium leading-relaxed">{primary.text}</p>
        <span className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-transform group-active:scale-[0.98]">
          {primary.cta} <ArrowRight size={15} />
        </span>
      </Link>
      {secondary.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
        {secondary.map((a, i) => (
          <Link
            key={i}
            href={a.href}
            className="flex min-h-12 items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
          >
            <p className="text-sm text-muted">{a.text}</p>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent">
              {a.cta} <ArrowRight size={13} />
            </span>
          </Link>
        ))}
        </div>
      )}
    </section>
  );
}

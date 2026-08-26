import Link from "next/link";
import { Suspense } from "react";
import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardCore, getPortalTicketSummary } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { NextActionsPanel, computeNextActions } from "@/components/portal/NextActions";
import { PortalSecondarySection } from "@/components/portal/PortalSecondarySection";
import { EmptyState } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { STAGE_META } from "@/lib/types";
import { FolderKanban, LifeBuoy, ExternalLink, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function PortalDashboardPage() {
  const { activeClientId, activeClient } = await getPortalContext();
  const [data, ticketSummary] = await Promise.all([
    getPortalDashboardCore(activeClientId),
    getPortalTicketSummary(activeClientId),
  ]);
  const { project } = data;
  const isOnline = Boolean(data.hosting?.production_url);

  const statusLine = !project
    ? "Tu proyecto está por comenzar."
    : project.stage === "material"
      ? "Necesitamos información tuya para continuar."
      : project.stage === "primera_version"
        ? "Tu web está pronta para revisar."
        : "Tu web está en desarrollo.";

  const nextActions = computeNextActions({
    project,
    domainExpiryDate: data.domain?.expiry_date,
    ticketsWaitingReply: ticketSummary.waitingReply,
  });

  const stageLabel = project ? (STAGE_META[project.stage as keyof typeof STAGE_META]?.clientLabel ?? project.stage) : null;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-display">Hola, {activeClient?.contact_name || activeClient?.business_name}</p>
        <p className="text-sm text-muted-2">{activeClient?.business_name}</p>
      </div>

      {/* Una sola card de estado: online ya no muestra progreso/etapa (eso
          fue el camino, no el destino) — solo "está online" + abrirla. */}
      {!project ? (
        <EmptyState icon={FolderKanban} title="Todavía no hay un proyecto activo" description="MR14 lo verá cargado en breve." />
      ) : isOnline ? (
        <Card className="p-5">
          <p className="text-lg font-semibold">Tu web está online.</p>
          {data.domain?.domain && <p className="mt-1 text-sm text-muted">{data.domain.domain}</p>}
          <a href={data.hosting!.production_url!} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="mt-4 w-full">
              <ExternalLink size={16} /> Abrir mi web
            </Button>
          </a>
        </Card>
      ) : (
        <Link href="/portal/mi-web">
          <Card className="p-5 transition-colors hover:border-muted-2">
            <p className="text-lg font-semibold">{statusLine}</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-sm text-muted-2">{stageLabel}</span>
              <span className="text-sm font-medium tabular-nums">{project.progress_percent}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, Math.max(0, project.progress_percent))}%` }}
              />
            </div>
            {project.next_step && (
              <p className="mt-3 text-sm text-muted">
                <span className="text-muted-2">Próximo paso: </span>
                {project.next_step}
              </p>
            )}
          </Card>
        </Link>
      )}

      <NextActionsPanel actions={nextActions} />

      {project && (
        <div className="space-y-2">
          {/* Pagos: discreto si no hay nada que resolver, en vez de una card grande. */}
          {project.balance > 0 ? (
            <Link
              href="/portal/pagos"
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-muted-2"
            >
              <div>
                <p className="text-sm font-medium">Pagos</p>
                <p className="text-xs text-muted-2">Pendiente: {formatCurrency(project.balance, project.currency)}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-accent">Ver pagos</span>
            </Link>
          ) : (
            <Link href="/portal/pagos" className="flex items-center gap-1.5 px-1 text-sm text-success">
              <CircleCheck size={14} /> Todo pago
            </Link>
          )}

          {/* Solicitudes: prominente solo si hay algo esperando tu respuesta. */}
          {ticketSummary.waitingReply > 0 ? (
            <Link
              href="/portal/solicitudes"
              className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft/20 px-4 py-3 transition-colors hover:border-warning/50"
            >
              <p className="text-sm font-medium text-warning">Necesitamos tu respuesta</p>
              <span className="shrink-0 text-xs font-medium text-warning">Responder</span>
            </Link>
          ) : ticketSummary.open > 0 ? (
            <Link
              href="/portal/solicitudes"
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-muted-2"
            >
              <p className="text-sm">
                {ticketSummary.open} solicitud{ticketSummary.open === 1 ? "" : "es"} en proceso
              </p>
              <span className="shrink-0 text-xs font-medium text-accent">Ver solicitudes</span>
            </Link>
          ) : (
            <Link
              href="/portal/solicitudes/nueva"
              className="flex items-center justify-between gap-3 px-1 text-sm text-muted"
            >
              <span className="flex items-center gap-1.5">
                <LifeBuoy size={14} /> Sin solicitudes abiertas
              </span>
              <span className="shrink-0 text-xs font-medium text-accent">Crear solicitud</span>
            </Link>
          )}
        </div>
      )}

      {/* Contenido secundario: se streamea aparte, no bloquea el resto del dashboard. */}
      <Suspense fallback={<PortalSecondaryFallback />}>
        <PortalSecondarySection clientId={activeClientId} />
      </Suspense>
    </div>
  );
}

function PortalSecondaryFallback() {
  return <Skeleton className="h-11 w-full rounded-lg" />;
}

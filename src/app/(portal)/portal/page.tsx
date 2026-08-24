import Link from "next/link";
import { Suspense } from "react";
import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardCore, getPortalTicketSummary } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StageProgress } from "@/components/portal/StageProgress";
import { NextActionsPanel, computeNextActions } from "@/components/portal/NextActions";
import { PortalSecondarySection } from "@/components/portal/PortalSecondarySection";
import { EmptyState } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { Globe, ExternalLink, Wallet, FolderKanban, MessageCircle, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DELIVERED_STATUSES = ["entregado", "publicado", "mantenimiento"];

export default async function PortalDashboardPage() {
  const { activeClientId, activeClient } = await getPortalContext();
  const [data, ticketSummary] = await Promise.all([
    getPortalDashboardCore(activeClientId),
    getPortalTicketSummary(activeClientId),
  ]);
  const { project } = data;
  const isDelivered = project ? DELIVERED_STATUSES.includes(project.status) : false;

  const whatsappHref = "https://wa.me/59899000000?text=" + encodeURIComponent(`Hola MR14, soy ${activeClient?.business_name}, necesito ayuda con mi proyecto.`);

  const isOnline = Boolean(data.hosting?.production_url);
  const statusLine = !project
    ? "Tu proyecto está por comenzar."
    : isOnline
      ? "Tu web está online."
      : isDelivered
        ? "Tu proyecto fue entregado."
        : "Tu proyecto está en desarrollo.";

  const nextActions = computeNextActions({
    project,
    domainExpiryDate: data.domain?.expiry_date,
    ticketsWaitingReply: ticketSummary.waitingReply,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-display">Hola, {activeClient?.business_name}</p>
        <p className="mt-1.5 text-sm text-muted">{statusLine}</p>
      </div>

      {data.hosting?.production_url && (
        <a href={data.hosting.production_url} target="_blank" rel="noopener noreferrer">
          <Button size="lg">
            <ExternalLink size={16} /> Abrir sitio
          </Button>
        </a>
      )}

      <NextActionsPanel actions={nextActions} />

      {isDelivered && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LifeBuoy size={16} className="shrink-0 text-muted" />
            <p className="text-sm text-muted">
              Tu proyecto está entregado. Desde ahora podés gestionar cambios, consultas técnicas y nuevas funcionalidades mediante Tickets.
            </p>
          </div>
          <Link href="/portal/solicitudes/nueva">
            <Button size="sm" className="w-full sm:w-auto shrink-0">
              Solicitar soporte
            </Button>
          </Link>
        </div>
      )}

      {!project ? (
        <EmptyState icon={FolderKanban} title="Todavía no hay un proyecto activo" description="MR14 lo verá cargado en breve." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/portal/mi-web">
            <Card className="h-full p-4 transition-colors hover:border-muted-2">
              <div className="flex items-center gap-2 text-muted">
                <Globe size={15} />
                <p className="text-label">Mi web</p>
              </div>
              <div className="mt-2.5">
                <Badge tone={isOnline ? "success" : "muted"}>{isOnline ? "Online" : "Sin publicar"}</Badge>
              </div>
              <p className="mt-2 truncate text-xs text-muted-2">{data.domain?.domain ?? "Sin dominio asociado"}</p>
            </Card>
          </Link>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted">
              <FolderKanban size={15} />
              <p className="text-label">Proyecto</p>
            </div>
            <div className="mt-3">
              <StageProgress stage={project.stage} progress={project.progress_percent} nextStep={project.next_step} />
            </div>
          </Card>

          <Link href="/portal/pagos">
            <Card className="h-full p-4 transition-colors hover:border-muted-2">
              <div className="flex items-center gap-2 text-muted">
                <Wallet size={15} />
                <p className="text-label">Pagos</p>
              </div>
              <p className="mt-2 text-metric text-warning">{formatCurrency(project.balance, project.currency)}</p>
              <p className="text-caption mt-0.5">
                {project.balance > 0 ? "saldo pendiente" : "sin saldo pendiente"}
              </p>
            </Card>
          </Link>

          <Link href="/portal/solicitudes">
            <Card className="h-full p-4 transition-colors hover:border-muted-2">
              <div className="flex items-center gap-2 text-muted">
                <LifeBuoy size={15} />
                <p className="text-label">Tickets</p>
              </div>
              <p className="mt-2 text-metric">{ticketSummary.open}</p>
              <p className="text-caption mt-0.5">
                {ticketSummary.waitingReply > 0 ? `${ticketSummary.waitingReply} esperan tu respuesta` : "tickets abiertos"}
              </p>
            </Card>
          </Link>
        </div>
      )}

      {/* Contenido secundario: se streamea aparte, no bloquea el resto del dashboard. */}
      <Suspense fallback={<PortalSecondaryFallback />}>
        <PortalSecondarySection clientId={activeClientId} />
      </Suspense>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-muted" />
          <p className="text-card-title">¿Necesitás ayuda?</p>
        </div>
        <p className="mt-2 text-sm text-muted">
          {isDelivered
            ? "Tu proyecto está entregado. Desde ahora podés gestionar cambios, consultas técnicas y nuevas funcionalidades mediante Tickets."
            : "Escribinos por WhatsApp o enviá una solicitud desde el portal."}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link href="/portal/solicitudes/nueva" className="flex-1">
            <Button className="w-full">{isDelivered ? "Solicitar soporte" : "Crear ticket"}</Button>
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="secondary" className="w-full">Contacto general</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function PortalSecondaryFallback() {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </>
  );
}

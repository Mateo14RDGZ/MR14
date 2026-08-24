import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardData, getPortalTicketSummary } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StageProgress } from "@/components/portal/StageProgress";
import { EmptyState } from "@/components/ui/Empty";
import { formatCurrency, formatDateTime, daysUntil } from "@/lib/utils";
import { Globe, ExternalLink, ShieldCheck, Wallet, FolderKanban, Activity, MessageCircle, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DELIVERED_STATUSES = ["entregado", "publicado", "mantenimiento"];

export default async function PortalDashboardPage() {
  const { activeClientId, activeClient } = await getPortalContext();
  const [data, ticketSummary] = await Promise.all([
    getPortalDashboardData(activeClientId),
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

  const hasUpcomingRenewal = data.renewals.some((r) => {
    const d = daysUntil(r.due_date);
    return d !== null && d <= 30 && d >= 0 && r.status !== "renovado";
  });

  return (
    <div className="animate-fade-in space-y-8">
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

      {isDelivered && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LifeBuoy size={16} className="shrink-0 text-muted" />
            <p className="text-sm text-muted">
              ¿Necesitás un cambio o tenés un problema? Gestionalo con una solicitud de soporte.
            </p>
          </div>
          <Link href="/portal/solicitudes/nueva">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto shrink-0">
              Crear solicitud
            </Button>
          </Link>
        </div>
      )}

      {hasUpcomingRenewal && (
        <Link
          href="/portal/renovaciones"
          className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          <span className="flex-1">Tenés renovaciones próximas a vencer.</span>
          <span className="shrink-0 underline">Ver renovaciones</span>
        </Link>
      )}

      {!project ? (
        <EmptyState icon={FolderKanban} title="Todavía no hay un proyecto activo" description="MR14 lo verá cargado en breve." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

          <Link href="/portal/documentos">
            <Card className="h-full p-4 transition-colors hover:border-muted-2">
              <div className="flex items-center gap-2 text-muted">
                <ShieldCheck size={15} />
                <p className="text-label">Documentos</p>
              </div>
              <p className="mt-2 text-sm text-muted">Ver documentación entregada</p>
            </Card>
          </Link>

          <Link href="/portal/renovaciones">
            <Card className="h-full p-4 transition-colors hover:border-muted-2">
              <div className="flex items-center gap-2 text-muted">
                <Activity size={15} />
                <p className="text-label">Renovaciones</p>
              </div>
              <p className="mt-2 text-sm text-muted">
                {hasUpcomingRenewal ? "Hay vencimientos próximos" : "Todo al día"}
              </p>
            </Card>
          </Link>
        </div>
      )}

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Activity size={15} className="text-muted" />
          <h2 className="text-card-title">Historial reciente</h2>
        </CardHeader>
        <CardBody>
          {data.recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="Sin novedades todavía" />
          ) : (
            <ul className="space-y-4">
              {data.recentActivity.slice(0, 5).map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-2" />
                  <div>
                    <p>{h.event}</p>
                    <p className="text-xs text-muted-2">{formatDateTime(h.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-muted" />
          <p className="text-card-title">¿Necesitás ayuda?</p>
        </div>
        <p className="mt-2 text-sm text-muted">Escribinos por WhatsApp o enviá una solicitud desde el portal.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="secondary" className="w-full">Contactar a MR14</Button>
          </a>
          <Link href="/portal/solicitudes/nueva" className="flex-1">
            <Button variant="secondary" className="w-full">Enviar solicitud</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

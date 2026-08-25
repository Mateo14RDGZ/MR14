import Link from "next/link";
import { Suspense } from "react";
import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardCore, getPortalTicketSummary } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NextActionsPanel, computeNextActions } from "@/components/portal/NextActions";
import { PortalSecondarySection } from "@/components/portal/PortalSecondarySection";
import { EmptyState } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { installmentsWithStatus } from "@/lib/installments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { STAGE_META } from "@/lib/types";
import { Globe, ExternalLink, Wallet, FolderKanban, MessageCircle, LifeBuoy, ChevronRight, CircleCheck } from "lucide-react";
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

  // Cuotas: si hay un plan armado, mostrar "X de Y pagas" en vez de un
  // saldo pelado — es lo que el cliente realmente quiere saber de un
  // vistazo. Sin plan (proyecto de pago único), cae al resumen simple.
  const installmentRows = project ? installmentsWithStatus(data.installments, project.amount_paid) : [];
  const paidInstallments = installmentRows.filter((r) => r.paid).length;
  const nextInstallment = installmentRows.find((r) => r.isNext) ?? null;

  const stageLabel = project ? (STAGE_META[project.stage as keyof typeof STAGE_META]?.clientLabel ?? project.stage) : null;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-display">Hola, {activeClient?.contact_name || activeClient?.business_name}</p>
        <p className="text-sm text-muted-2">{activeClient?.business_name}</p>
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
              Tu proyecto está entregado. Desde ahora podés gestionar cambios, consultas técnicas y nuevas funcionalidades mediante Solicitudes.
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
        <div className="space-y-3">
          {/* Estado del proyecto: lo primero y más grande — es lo que más se pregunta un cliente. */}
          <Link href="/portal/mi-web">
            <Card className="p-5 transition-colors hover:border-muted-2">
              <div className="flex items-center gap-2 text-muted">
                <FolderKanban size={16} />
                <p className="text-label">Tu proyecto</p>
              </div>
              <p className="mt-2 text-lg font-semibold">{statusLine}</p>
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

          {/* Cuotas: "2 de 4 pagas" dice más de un vistazo que un saldo pelado. */}
          <Link href="/portal/pagos">
            <Card className="p-5 transition-colors hover:border-muted-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted">
                  <Wallet size={16} />
                  <p className="text-label">Cuotas</p>
                </div>
                <ChevronRight size={16} className="text-muted-2" />
              </div>
              {project.balance <= 0 ? (
                <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-success">
                  <CircleCheck size={18} /> Todo pago
                </p>
              ) : installmentRows.length > 0 ? (
                <>
                  <p className="mt-2 text-lg font-semibold">
                    {paidInstallments} de {installmentRows.length} cuotas pagas
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Saldo pendiente: <span className="font-medium text-warning">{formatCurrency(project.balance, project.currency)}</span>
                    {nextInstallment?.due_date && ` · próxima vence ${formatDate(nextInstallment.due_date)}`}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-lg font-semibold text-warning">
                  Saldo pendiente: {formatCurrency(project.balance, project.currency)}
                </p>
              )}
            </Card>
          </Link>

          {/* Solicitudes: si hay algo esperando tu respuesta, se nota. */}
          <Link href="/portal/solicitudes">
            <Card
              className={`p-5 transition-colors hover:border-muted-2 ${ticketSummary.waitingReply > 0 ? "border-warning/30 bg-warning-soft/20" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted">
                  <LifeBuoy size={16} />
                  <p className="text-label">Solicitudes</p>
                </div>
                <ChevronRight size={16} className="text-muted-2" />
              </div>
              {ticketSummary.waitingReply > 0 ? (
                <p className="mt-2 text-lg font-semibold text-warning">
                  {ticketSummary.waitingReply === 1 ? "1 solicitud espera" : `${ticketSummary.waitingReply} solicitudes esperan`} tu respuesta
                </p>
              ) : (
                <p className="mt-2 text-lg font-semibold">
                  {ticketSummary.open === 0 ? "Sin solicitudes abiertas" : `${ticketSummary.open} solicitud${ticketSummary.open === 1 ? "" : "es"} abierta${ticketSummary.open === 1 ? "" : "s"}`}
                </p>
              )}
            </Card>
          </Link>

          {/* Mi web: secundario a propósito — ya está resumido arriba en "Tu proyecto". */}
          <Link href="/portal/mi-web">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-muted-2">
              <Globe size={15} className="shrink-0 text-muted" />
              <p className="flex-1 truncate text-sm text-muted">{data.domain?.domain ?? "Sin dominio asociado"}</p>
              <Badge tone={isOnline ? "success" : "muted"}>{isOnline ? "Online" : "Sin publicar"}</Badge>
            </div>
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
            ? "Tu proyecto está entregado. Desde ahora podés gestionar cambios, consultas técnicas y nuevas funcionalidades mediante Solicitudes."
            : "Escribinos por WhatsApp o enviá una solicitud desde el portal."}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link href="/portal/solicitudes/nueva" className="flex-1">
            <Button className="w-full">{isDelivered ? "Solicitar soporte" : "Crear solicitud"}</Button>
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

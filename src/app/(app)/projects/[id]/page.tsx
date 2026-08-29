import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProjectDetail,
  getAllTickets,
  getProjectSupportSummary,
  getProjectInternalNotes,
  getActivePaymentMethods,
} from "@/lib/queries";
import { InternalNotes } from "@/components/shared/InternalNotes";
import { TicketList } from "@/components/portal/TicketList";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checklist } from "@/components/projects/Checklist";
import { StageEditor } from "@/components/projects/StageEditor";
import { DevLinkCard } from "@/components/projects/DevLinkCard";
import { InstallmentsEditor } from "@/components/projects/InstallmentsEditor";
import { MarkInstallmentPaidDialog } from "@/components/projects/MarkInstallmentPaidDialog";
import {
  DomainsSection,
  HostingSection,
  RepositoriesSection,
  DatabasesSection,
} from "@/components/projects/InfraSections";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { MarkDeliveredButton } from "@/components/projects/MarkDeliveredButton";
import { HistoryTab } from "@/components/clients/HistoryTab";
import { Tabs } from "@/components/ui/Tabs";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { installmentsWithStatus } from "@/lib/installments";
import { ArrowLeft, FileDown, CheckCircle2, Clock } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectDetail(id);
  if (!data || !data.client) notFound();

  const { project, client, domains, hosting, repositories, databases, tasks, history, installments } = data;
  const mainHosting = hosting[0] ?? null;
  const installmentRows = installmentsWithStatus(installments, project.amount_paid);
  let installmentsCumulative = 0;
  const installmentRowsCum = installmentRows.map((r) => {
    installmentsCumulative += r.amount;
    return { ...r, cumulative: installmentsCumulative };
  });
  const [tickets, supportSummary, internalNotes, paymentMethods] = await Promise.all([
    getAllTickets({ projectId: project.id }),
    getProjectSupportSummary(project.id),
    getProjectInternalNotes(project.id),
    getActivePaymentMethods(),
  ]);
  const remainingTasks = tasks.filter((task) => !task.is_done).length;

  const projectTabs = [
    {
      id: "resumen",
      label: "Resumen",
      content: (
        <div className="space-y-6">
          <DevLinkCard projectId={project.id} clientId={client.id} hosting={mainHosting} />
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardBody className="space-y-4">
                {project.description && <p className="text-sm text-muted">{project.description}</p>}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Info label="Precio" value={formatCurrency(project.price, project.currency)} />
                  <Info label="Pagado" value={formatCurrency(project.amount_paid, project.currency)} tone="success" />
                  <Info label="Estado de pago" value={project.payment_status} />
                  <Info label="Inicio" value={formatDate(project.start_date)} />
                  <Info label="Entrega real" value={formatDate(project.actual_delivery_date)} />
                  <Info label="Moneda" value={project.currency} />
                </div>
                {project.notes && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-2">Notas</p>
                    <p className="whitespace-pre-line text-sm text-muted">{project.notes}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-card-title">Etapa del proyecto</h2>
                <p className="mt-0.5 text-caption">Actualizá el estado y dejá claro el próximo paso.</p>
              </CardHeader>
              <CardBody>
                <StageEditor
                  projectId={project.id}
                  clientId={client.id}
                  stage={project.stage}
                  status={project.status}
                  nextStep={project.next_step}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: "pagos",
      label: "Pagos",
      count: installmentRowsCum.filter((row) => !row.paid).length,
      content: (
        <div className="space-y-6">
          {installmentRowsCum.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="text-card-title">Detalle de cuotas</h2>
              </CardHeader>
              <CardBody className="space-y-0 divide-y divide-border">
                {installmentRowsCum.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      {row.paid ? (
                        <CheckCircle2 size={16} className="shrink-0 text-success" />
                      ) : (
                        <Clock size={16} className="shrink-0 text-muted-2" />
                      )}
                      <p className="truncate text-sm font-medium">{row.label || `Cuota ${row.number}`}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(row.amount, project.currency)}</span>
                      <Badge tone={row.paid ? "success" : row.isNext ? "warning" : "muted"}>
                        {row.paid ? "Pagada" : row.isNext ? "Próxima" : "Pendiente"}
                      </Badge>
                      {!row.paid && (
                        <MarkInstallmentPaidDialog
                          clientId={client.id}
                          projectId={project.id}
                          label={row.label || `Cuota ${row.number}`}
                          amountDue={Math.max(0, row.cumulative - project.amount_paid)}
                          currency={project.currency}
                          paymentMethods={paymentMethods}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : (
            <Card className="p-5 text-sm text-muted">Este proyecto todavía no tiene un plan de cuotas.</Card>
          )}

          <InstallmentsEditor
            projectId={project.id}
            clientId={client.id}
            currentCount={installmentRows.length}
            deposit={project.deposit}
          />
        </div>
      ),
    },
    {
      id: "entrega",
      label: "Entrega",
      count: remainingTasks,
      content: (
        <div className="space-y-6">
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-card-title">Cierre del proyecto</h2>
                <p className="mt-1 text-sm text-muted">
                  Completá el checklist y marcá la entrega cuando el proyecto esté realmente listo.
                </p>
              </div>
              {project.status === "entregado" ? (
                <span className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle2 size={16} /> Proyecto entregado
                </span>
              ) : (
                <MarkDeliveredButton projectId={project.id} clientId={client.id} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-card-title">Checklist de entrega</h2>
            </CardHeader>
            <CardBody>
              <Checklist projectId={project.id} clientId={client.id} tasks={tasks} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-card-title">Documentación</h2>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              <PdfLink type="ficha-tecnica" clientId={client.id} projectId={project.id} label="Ficha técnica" />
              <PdfLink type="entrega" clientId={client.id} projectId={project.id} label="Entrega del proyecto" />
              <PdfLink type="infraestructura" clientId={client.id} projectId={project.id} label="Infraestructura" />
            </CardBody>
          </Card>
        </div>
      ),
    },
    {
      id: "infraestructura",
      label: "Infraestructura",
      content: (
        <div className="grid gap-6 lg:grid-cols-2">
          <DomainsSection projectId={project.id} clientId={client.id} domains={domains} />
          <HostingSection projectId={project.id} clientId={client.id} hosting={hosting} />
          <RepositoriesSection projectId={project.id} clientId={client.id} repositories={repositories} />
          <DatabasesSection projectId={project.id} clientId={client.id} databases={databases} />
        </div>
      ),
    },
    {
      id: "actividad",
      label: "Actividad",
      count: supportSummary.open,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <h2 className="text-card-title">Tickets</h2>
              <span className="text-xs text-muted-2">
                {supportSummary.open} abiertos · {supportSummary.resolved} resueltos
              </span>
            </CardHeader>
            <CardBody>
              <TicketList tickets={tickets} basePath="/support" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-card-title">Historial del proyecto</h2>
            </CardHeader>
            <CardBody>
              <HistoryTab history={history} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-card-title">Notas internas</h2>
            </CardHeader>
            <CardBody>
              <InternalNotes notes={internalNotes} clientId={client.id} projectId={project.id} />
            </CardBody>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
      <Link
        href={`/clients/${client.id}`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> {client.business_name}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-page-title">{project.name}</h1>
          <p className="mt-1 text-sm text-muted">{PROJECT_TYPES.find((t) => t.value === project.type)?.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <EditProjectDialog clientId={client.id} project={project} />
          <DeleteProjectButton projectId={project.id} clientId={client.id} />
        </div>
      </div>

      {/* Lo esencial de un vistazo — el detalle de precio/fechas queda en la card de abajo. */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-border bg-surface p-4 text-sm">
        <SummaryItem label="Cliente" value={client.business_name} />
        <SummaryItem label="Estado" value={PROJECT_STATUSES.find((s) => s.value === project.status)?.label ?? project.status} />
        <SummaryItem label="Progreso" value={`${project.progress_percent}%`} />
        <SummaryItem
          label="Próximo paso"
          value={project.next_step || "Sin definir"}
          muted={!project.next_step}
        />
        <SummaryItem
          label="Saldo"
          value={project.balance > 0 ? formatCurrency(project.balance, project.currency) : "Al día"}
          tone={project.balance > 0 ? "warning" : "success"}
        />
        <SummaryItem label="Fecha estimada" value={formatDate(project.estimated_delivery_date)} />
      </div>

      <Tabs tabs={projectTabs} defaultTab="resumen" />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-caption">{label}</p>
      <p
        className={`font-medium ${
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : muted ? "text-muted-2" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div>
      <p className="text-caption">{label}</p>
      <p className={`font-medium capitalize ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function PdfLink({
  type,
  clientId,
  projectId,
  label,
}: {
  type: string;
  clientId: string;
  projectId: string;
  label: string;
}) {
  return (
    <a href={`/api/pdf?type=${type}&clientId=${clientId}&projectId=${projectId}`} target="_blank" rel="noopener noreferrer">
      <Button size="sm" variant="outline">
        <FileDown size={14} /> {label}
      </Button>
    </a>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectDetail } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checklist } from "@/components/projects/Checklist";
import { StageEditor } from "@/components/projects/StageEditor";
import { ProjectStatusSelect } from "@/components/clients/StatusSelect";
import {
  DomainsSection,
  HostingSection,
  RepositoriesSection,
  DatabasesSection,
} from "@/components/projects/InfraSections";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { MarkDeliveredButton } from "@/components/projects/MarkDeliveredButton";
import { HistoryTab } from "@/components/clients/HistoryTab";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, FileDown } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectDetail(id);
  if (!data || !data.client) notFound();

  const { project, client, domains, hosting, repositories, databases, tasks, history } = data;

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
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-sm text-muted">{PROJECT_TYPES.find((t) => t.value === project.type)?.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <MarkDeliveredButton projectId={project.id} clientId={client.id} />
          <DeleteProjectButton projectId={project.id} clientId={client.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone={statusTone(project.status, "project")}>
                {PROJECT_STATUSES.find((s) => s.value === project.status)?.label}
              </Badge>
              <div className="w-52">
                <ProjectStatusSelect
                  projectId={project.id}
                  clientId={client.id}
                  currentStatus={project.status}
                  options={PROJECT_STATUSES}
                />
              </div>
            </div>
            {project.description && <p className="text-sm text-muted">{project.description}</p>}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
              <Info label="Precio" value={formatCurrency(project.price, project.currency)} />
              <Info label="Pagado" value={formatCurrency(project.amount_paid, project.currency)} tone="success" />
              <Info label="Saldo" value={formatCurrency(project.balance, project.currency)} tone="warning" />
              <Info label="Estado de pago" value={project.payment_status} />
              <Info label="Inicio" value={formatDate(project.start_date)} />
              <Info label="Entrega estimada" value={formatDate(project.estimated_delivery_date)} />
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
            <h2 className="text-sm font-semibold">Etapa del proyecto</h2>
          </CardHeader>
          <CardBody>
            <StageEditor
              projectId={project.id}
              clientId={client.id}
              stage={project.stage}
              progress={project.progress_percent}
              nextStep={project.next_step}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DomainsSection projectId={project.id} clientId={client.id} domains={domains} />
        <HostingSection projectId={project.id} clientId={client.id} hosting={hosting} />
        <RepositoriesSection projectId={project.id} clientId={client.id} repositories={repositories} />
        <DatabasesSection projectId={project.id} clientId={client.id} databases={databases} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Checklist de entrega</h2>
        </CardHeader>
        <CardBody>
          <Checklist projectId={project.id} clientId={client.id} tasks={tasks} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Documentación</h2>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          <PdfLink type="ficha-tecnica" clientId={client.id} projectId={project.id} label="Ficha técnica" />
          <PdfLink type="entrega" clientId={client.id} projectId={project.id} label="Entrega del proyecto" />
          <PdfLink type="infraestructura" clientId={client.id} projectId={project.id} label="Infraestructura" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Historial del proyecto</h2>
        </CardHeader>
        <CardBody>
          <HistoryTab history={history} />
        </CardBody>
      </Card>
    </div>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div>
      <p className="text-xs text-muted-2">{label}</p>
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

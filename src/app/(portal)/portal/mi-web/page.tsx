import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getActiveProject, getPortalWebsiteInfo, getPortalDeliveryChecklist } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Empty";
import { formatDate, daysUntil } from "@/lib/utils";
import { STAGE_META, type ProjectStage } from "@/lib/types";
import { Globe, ExternalLink, AlertTriangle, CheckCircle2, Circle, FileText } from "lucide-react";

const DELIVERED_STATUSES = ["entregado", "publicado", "mantenimiento"];

export default async function PortalMiWebPage() {
  const { activeClientId } = await getPortalContext();
  const project = await getActiveProject(activeClientId);

  if (!project) {
    return <EmptyState icon={Globe} title="Todavía no hay un proyecto asociado" />;
  }

  const isDelivered = DELIVERED_STATUSES.includes(project.status);
  const [{ domain, hosting, lastAudit }, checklist] = await Promise.all([
    getPortalWebsiteInfo(project.id, activeClientId),
    isDelivered ? getPortalDeliveryChecklist(activeClientId) : Promise.resolve(null),
  ]);
  const score = (lastAudit?.score ?? {}) as { seo?: number; accessibility?: number; performance?: number };
  const domainDays = daysUntil(domain?.expiry_date);
  const domainExpiringSoon = domainDays !== null && domainDays >= 0 && domainDays <= 30;
  const paymentDone = project.balance <= 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Mi web</h1>
        <p className="mt-1 text-sm text-muted">Información pública de tu sitio, sin detalles técnicos internos.</p>
      </div>

      {isDelivered && checklist && (
        <Card className="border-success/25 bg-success-soft/30">
          <CardHeader>
            <h2 className="text-card-title">Tu proyecto está pronto</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ul className="space-y-2 text-sm">
              <ChecklistItem done={Boolean(hosting?.production_url)} label="Web publicada" />
              <ChecklistItem done={Boolean(domain?.domain)} label="Dominio configurado" />
              <ChecklistItem done={checklist.hasDocuments} label="Documentos disponibles" />
              <ChecklistItem done={checklist.hasDeliveredCredentials} label="Accesos entregados" />
              <ChecklistItem done={paymentDone} label="Pago completado" />
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              {hosting?.production_url && (
                <a href={hosting.production_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full">
                    <ExternalLink size={16} /> Abrir web
                  </Button>
                </a>
              )}
              <Link href="/portal/documentos" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <FileText size={16} /> Ver documentos
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-2">
              Tu proyecto está entregado. Desde ahora podés gestionar cambios, consultas técnicas y nuevas funcionalidades mediante Solicitudes.
            </p>
          </CardBody>
        </Card>
      )}

      {domainExpiringSoon && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <AlertTriangle size={16} className="shrink-0" />
          <p className="flex-1">
            Dominio próximo a vencer: {domainDays} día{domainDays === 1 ? "" : "s"}.
          </p>
        </div>
      )}

      {hosting?.preview_url && !hosting?.production_url && (
        <Card className="border-accent/30 bg-accent/5 p-5">
          <p className="text-sm font-medium">Versión de desarrollo disponible</p>
          <p className="mt-1 text-xs text-muted-2">Todavía no es la versión final — la vas a poder revisar acá mientras avanzamos.</p>
          <a href={hosting.preview_url} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="mt-3 w-full">
              <ExternalLink size={16} /> Ver versión de desarrollo
            </Button>
          </a>
        </Card>
      )}

      <Card className="p-6 sm:p-8">
        <div className="space-y-3 text-sm">
          <Row label="Estado" value={STAGE_META[project.stage as ProjectStage]?.clientLabel ?? project.status.replace(/_/g, " ")} />
          <Row label="Dirección" value={hosting?.production_url ?? domain?.domain} />
          <Row label="Última actualización" value={formatDate(project.updated_at)} />
          {domain?.expiry_date && <Row label="Próxima renovación" value={formatDate(domain.expiry_date)} />}
        </div>
        {hosting?.production_url && (
          <a href={hosting.production_url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="mt-5 w-full">
              <ExternalLink size={16} /> Abrir mi web
            </Button>
          </a>
        )}
      </Card>

      {/* Todo lo técnico/secundario, plegado: no compite con lo esencial de arriba. */}
      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium text-muted marker:content-none group-open:border-b group-open:border-border">
          Detalles
        </summary>
        <div className="space-y-3 p-5 text-sm">
          <Row label="Dominio" value={domain?.domain} />
          <Row label="SSL / HTTPS" value={hosting?.production_url?.startsWith("https") ? "Activo" : "No disponible"} />
          <Row label="Hosting" value={hosting?.platform} />
          <Row label="Fecha de publicación" value={formatDate(project.actual_delivery_date)} />
        </div>
        {lastAudit && (
          <div className="space-y-3 border-t border-border p-5 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-2">Última revisión del sitio</p>
            <div className="flex items-center justify-between">
              <span className="text-muted">SEO</span>
              <Badge tone={((score.seo ?? 0) >= 70 ? "success" : "warning")}>{score.seo ?? "-"}/100</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Accesibilidad</span>
              <Badge tone={((score.accessibility ?? 0) >= 70 ? "success" : "warning")}>
                {score.accessibility ?? "-"}/100
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Velocidad</span>
              <Badge tone={((score.performance ?? 0) >= 70 ? "success" : "warning")}>
                {score.performance ?? "-"}/100
              </Badge>
            </div>
            <p className="text-xs text-muted-2">Analizado el {formatDate(lastAudit.created_at)}</p>
          </div>
        )}
      </details>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 size={16} className="shrink-0 text-success" />
        ) : (
          <Circle size={16} className="shrink-0 text-muted-2" />
        )}
        <span className={done ? "text-foreground" : "text-muted-2"}>{label}</span>
      </span>
      {!done && <span className="shrink-0 text-xs text-muted-2">Pendiente</span>}
    </li>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="truncate font-medium capitalize">{value || "Información no disponible"}</span>
    </div>
  );
}

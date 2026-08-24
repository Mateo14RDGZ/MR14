import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardData, getPortalWebsiteInfo } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Empty";
import { formatDate } from "@/lib/utils";
import { STAGE_META, type ProjectStage } from "@/lib/types";
import { Globe, ExternalLink } from "lucide-react";

export default async function PortalMiWebPage() {
  const { activeClientId } = await getPortalContext();
  const { project } = await getPortalDashboardData(activeClientId);

  if (!project) {
    return <EmptyState icon={Globe} title="Todavía no hay un proyecto asociado" />;
  }

  const { domain, hosting, lastAudit } = await getPortalWebsiteInfo(project.id);
  const score = (lastAudit?.score ?? {}) as { seo?: number; accessibility?: number; performance?: number };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-page-title">Mi web</h1>
        <p className="mt-1 text-sm text-muted">Información pública de tu sitio, sin detalles técnicos internos.</p>
      </div>

      <Card className="p-6 text-center sm:p-8">
        <p className="text-caption">URL principal</p>
        <p className="mt-1.5 truncate text-page-title">{hosting?.production_url ?? domain?.domain ?? "Sin publicar"}</p>
        {hosting?.production_url && (
          <a href={hosting.production_url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="mt-4">
              <ExternalLink size={16} /> Abrir sitio
            </Button>
          </a>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-card-title">Detalles técnicos</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row label="Dominio" value={domain?.domain} />
            <Row label="SSL / HTTPS" value={hosting?.production_url?.startsWith("https") ? "Activo" : "No disponible"} />
            <Row label="Hosting" value={hosting?.platform} />
            <Row label="Fecha de publicación" value={formatDate(project.actual_delivery_date)} />
            <Row label="Última actualización" value={formatDate(project.updated_at)} />
            <Row label="Estado" value={STAGE_META[project.stage as ProjectStage]?.clientLabel ?? project.status.replace(/_/g, " ")} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-card-title">Última auditoría</h2>
          </CardHeader>
          <CardBody>
            {!lastAudit ? (
              <p className="text-sm text-muted-2">Información no disponible.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">SEO</span>
                  <Badge tone={((score.seo ?? 0) >= 70 ? "success" : "warning")}>{score.seo ?? "-"}/100</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Accesibilidad</span>
                  <Badge tone={((score.accessibility ?? 0) >= 70 ? "success" : "warning")}>
                    {score.accessibility ?? "-"}/100
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Performance estimada</span>
                  <Badge tone={((score.performance ?? 0) >= 70 ? "success" : "warning")}>
                    {score.performance ?? "-"}/100
                  </Badge>
                </div>
                <p className="pt-2 text-xs text-muted-2">Analizado el {formatDate(lastAudit.created_at)}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium capitalize">{value || "Información no disponible"}</span>
    </div>
  );
}

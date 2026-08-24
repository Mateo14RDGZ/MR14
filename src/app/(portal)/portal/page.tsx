import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardData } from "@/lib/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StageProgress } from "@/components/portal/StageProgress";
import { EmptyState } from "@/components/ui/Empty";
import { formatCurrency, formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import { Globe, ExternalLink, ShieldCheck, Wallet, FolderKanban, Activity, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function PortalDashboardPage() {
  const { activeClientId, activeClient } = await getPortalContext();
  const data = await getPortalDashboardData(activeClientId);
  const { project } = data;

  const whatsappHref = "https://wa.me/59899000000?text=" + encodeURIComponent(`Hola MR14, soy ${activeClient?.business_name}, necesito ayuda con mi proyecto.`);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {activeClient?.business_name}</h1>
        <p className="mt-1 text-sm text-muted">Este es el estado actual de tu proyecto con MR14.</p>
      </div>

      {!project ? (
        <EmptyState icon={FolderKanban} title="Todavía no hay un proyecto activo" description="MR14 lo verá cargado en breve." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Globe size={16} className="text-accent" />
              <h2 className="text-sm font-semibold">Mi web</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Estado</span>
                <Badge tone={data.hosting?.production_url ? "success" : "muted"}>
                  {data.hosting?.production_url ? "Online" : "Sin publicar"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Dominio</span>
                <span className="text-sm font-medium">{data.domain?.domain ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Última actualización</span>
                <span className="text-sm font-medium">{formatDate(project.updated_at)}</span>
              </div>
              {data.hosting?.production_url && (
                <a href={data.hosting.production_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" className="w-full">
                    <ExternalLink size={14} /> Abrir web
                  </Button>
                </a>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" />
              <h2 className="text-sm font-semibold">Dominio</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Estado</span>
                <Badge tone={data.domain?.status === "activo" ? "success" : "muted"}>
                  {data.domain?.status ?? "Sin registrar"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Renovación</span>
                <span className="text-sm font-medium">{formatDate(data.domain?.expiry_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Proveedor</span>
                <span className="text-sm font-medium">{data.domain?.registrar ?? "-"}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Wallet size={16} className="text-accent" />
              <h2 className="text-sm font-semibold">Pagos</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Precio</span>
                <span className="text-sm font-medium">{formatCurrency(project.price, project.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Pagado</span>
                <span className="text-sm font-medium text-success">{formatCurrency(project.amount_paid, project.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Pendiente</span>
                <span className="text-sm font-medium text-warning">{formatCurrency(project.balance, project.currency)}</span>
              </div>
              <Badge tone={project.payment_status === "pagado" ? "success" : "warning"}>
                {project.payment_status === "pagado" ? "Pagado" : project.payment_status === "parcial" ? "Pago parcial" : "Pendiente"}
              </Badge>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <FolderKanban size={16} className="text-accent" />
              <h2 className="text-sm font-semibold">Proyecto</h2>
            </CardHeader>
            <CardBody>
              <StageProgress stage={project.stage} progress={project.progress_percent} nextStep={project.next_step} />
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <h2 className="text-sm font-semibold">Historial reciente</h2>
          </CardHeader>
          <CardBody>
            {data.recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title="Sin novedades todavía" />
            ) : (
              <ul className="space-y-4">
                {data.recentActivity.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
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

        <Card className="flex flex-col justify-between">
          <CardHeader className="flex items-center gap-2">
            <MessageCircle size={16} className="text-accent" />
            <h2 className="text-sm font-semibold">¿Necesitás ayuda?</h2>
          </CardHeader>
          <CardBody>
            <p className="mb-4 text-sm text-muted">
              Escribinos directamente por WhatsApp o enviá una solicitud desde el portal.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full">Contactar a MR14</Button>
              </a>
              <Link href="/portal/solicitudes" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Enviar solicitud
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      {data.renewals.some((r) => {
        const d = daysUntil(r.due_date);
        return d !== null && d <= 30 && d >= 0 && r.status !== "renovado";
      }) && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Tenés renovaciones próximas a vencer. Revisá la sección{" "}
          <Link href="/portal/renovaciones" className="underline">
            Renovaciones
          </Link>
          .
        </div>
      )}
    </div>
  );
}

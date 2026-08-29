import Link from "next/link";
import { Suspense } from "react";
import { getPortalContext } from "@/lib/portal";
import { getPortalDashboardCore, getPortalTicketSummary } from "@/lib/queries";
import { NextActionsPanel, computeNextActions } from "@/components/portal/NextActions";
import { PortalSecondarySection } from "@/components/portal/PortalSecondarySection";
import { EmptyState } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { firstName } from "@/lib/utils";
import { STAGE_META } from "@/lib/types";
import {
  FolderKanban,
  LifeBuoy,
  ExternalLink,
  FileText,
  KeyRound,
  RefreshCw,
  ArrowRight,
  Wallet,
  Globe2,
} from "lucide-react";
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
    <div className="animate-fade-in space-y-7">
      <header className="pt-1">
        <p className="text-xs font-medium text-muted">{activeClient?.business_name}</p>
        <h1 className="mt-1 text-[2rem] font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
          Hola, {firstName(activeClient?.contact_name || activeClient?.business_name || "")}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Acá tenés el estado de tu proyecto y todo lo que podés necesitar.</p>
      </header>

      {/* Una sola card de estado: online ya no muestra progreso/etapa (eso
          fue el camino, no el destino) — solo "está online" + abrirla. */}
      {!project ? (
        <EmptyState icon={FolderKanban} title="Tu proyecto todavía no empezó" description="Cuando esté cargado vas a poder seguir cada avance desde acá." />
      ) : isOnline ? (
        <section className="relative overflow-hidden rounded-3xl border border-success/20 bg-[radial-gradient(circle_at_top_right,rgba(51,196,129,0.16),transparent_42%),var(--surface)] p-6 sm:p-8">
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Publicada
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Tu web está online</h2>
            {data.domain?.domain && <p className="mt-2 text-sm text-muted">{data.domain.domain}</p>}
            <a href={data.hosting!.production_url!} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex">
              <Button size="lg"><ExternalLink size={16} /> Abrir mi web</Button>
            </a>
          </div>
        </section>
      ) : (
        <Link href="/portal/mi-web" className="portal-press group block">
          <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(91,110,232,0.22),transparent_46%),var(--surface)] p-6 transition-colors group-hover:border-accent/40 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Globe2 size={15} /> {project.name}
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{statusLine}</h2>
            <p className="mt-2 text-sm text-muted">{stageLabel}</p>
            <div className="mt-7 flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, Math.max(0, project.progress_percent))}%` }}
              />
              </div>
              <span className="text-sm font-semibold tabular-nums">{project.progress_percent}%</span>
            </div>
            {project.next_step && (
              <div className="mt-5 flex items-start justify-between gap-4 border-t border-border pt-4 text-sm">
                <p><span className="text-muted">Después: </span>{project.next_step}</p>
                <ArrowRight size={16} className="mt-0.5 shrink-0 text-accent transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </section>
        </Link>
      )}

      <NextActionsPanel actions={nextActions} />

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold tracking-tight">Lo más usado</h2><p className="mt-0.5 text-xs text-muted">Todo a uno o dos toques.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickLink href="/portal/pagos" icon={Wallet} label="Pagos" detail={project?.balance && project.balance > 0 ? "Tenés saldo pendiente" : "Estás al día"} />
          <QuickLink href="/portal/solicitudes/nueva" icon={LifeBuoy} label="Pedir ayuda" detail="Cambio, consulta o problema" />
          <QuickLink href="/portal/documentos" icon={FileText} label="Documentos" detail="Archivos de tu proyecto" />
          <QuickLink href="/portal/credenciales" icon={KeyRound} label="Accesos" detail="Usuarios y contraseñas" />
        </div>
      </section>

      {ticketSummary.open > 0 && (
        <Link href="/portal/solicitudes" className="portal-press flex min-h-12 items-center gap-3 rounded-2xl bg-surface-2 px-4 text-sm transition-colors hover:bg-surface-3">
          <LifeBuoy size={17} className="text-accent" />
          <span className="flex-1">{ticketSummary.open} solicitud{ticketSummary.open === 1 ? "" : "es"} en seguimiento</span>
          <span className="text-xs font-semibold text-accent">Ver</span>
        </Link>
      )}

      <Link href="/portal/renovaciones" className="portal-press flex min-h-11 items-center gap-3 px-1 text-sm text-muted transition-colors hover:text-foreground">
        <RefreshCw size={15} /> Ver renovaciones y vencimientos <ArrowRight size={14} className="ml-auto" />
      </Link>

      {/* Contenido secundario: se streamea aparte, no bloquea el resto del dashboard. */}
      <Suspense fallback={<PortalSecondaryFallback />}>
        <PortalSecondarySection clientId={activeClientId} />
      </Suspense>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, detail }: { href: string; icon: typeof Wallet; label: string; detail: string }) {
  return (
    <Link href={href} className="portal-press group flex min-h-32 flex-col rounded-2xl border border-border bg-surface p-4 transition-[border-color,transform,background-color] hover:border-border-strong hover:bg-surface-2">
      <div className="quick-link-icon flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon size={19} /></div>
      <p className="mt-4 font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
    </Link>
  );
}

function PortalSecondaryFallback() {
  return <Skeleton className="h-11 w-full rounded-lg" />;
}

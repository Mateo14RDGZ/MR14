import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientDetail, getAllTickets, getClientAudits, getClientInternalNotes } from "@/lib/queries";
import { InternalNotes } from "@/components/shared/InternalNotes";
import { TicketList } from "@/components/portal/TicketList";
import { Tabs } from "@/components/ui/Tabs";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { OverviewTab } from "@/components/clients/OverviewTab";
import { ProjectsTab } from "@/components/clients/ProjectsTab";
import { CredentialsTab } from "@/components/clients/CredentialsTab";
import { DocumentsTab } from "@/components/clients/DocumentsTab";
import { MembersTab } from "@/components/clients/MembersTab";
import { PaymentsTab } from "@/components/clients/PaymentsTab";
import { RequestsTab } from "@/components/clients/RequestsTab";
import { HistoryTab } from "@/components/clients/HistoryTab";
import { AuditsTab } from "@/components/clients/AuditsTab";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { NewTicketDialog } from "@/components/shared/NewTicketDialog";
import { NewProjectDialog } from "@/components/clients/NewProjectDialog";
import { ClientLogoUpload } from "@/components/clients/ClientLogoUpload";
import { Button } from "@/components/ui/Button";
import { PROJECT_STATUSES, CLIENT_STATUSES } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, FolderKanban, Wallet, Pencil, UserCheck, Clock } from "lucide-react";

// Los ids de tab de antes de la reorganización siguen resolviendo a algo
// razonable: no queremos romper links guardados (favoritos, notificaciones
// viejas, etc.) que apuntan a ?tab=credentials, ?tab=history, etc.
const TAB_ALIASES: Record<string, string> = {
  overview: "resumen",
  projects: "proyecto",
  credentials: "proyecto",
  documents: "proyecto",
  support: "soporte",
  requests: "soporte",
  members: "mas",
  audits: "mas",
  history: "mas",
  notes: "mas",
};

const NEEDS_REPLY_STATUSES = new Set(["received", "reviewing", "requires_quote"]);
const RESOLVED_STATUSES = new Set(["resolved", "closed"]);

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const data = await getClientDetail(id);
  if (!data.client) notFound();

  const { client, projects, credentials, documents, history, members, payments, requests, installments } = data;
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, balance: p.balance, currency: p.currency }));
  const paymentProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    amount_paid: p.amount_paid,
    balance: p.balance,
    currency: p.currency,
  }));
  const hasPendingApproval = members.some((m) => m.status === "invited");
  const mainProject = projects[0];
  const lastActivity = history[0]?.created_at;
  const [tickets, audits, internalNotes] = await Promise.all([
    getAllTickets({ clientId: client.id }),
    getClientAudits(client.id),
    getClientInternalNotes(client.id),
  ]);

  const ticketsOpen = tickets.filter((t) => !RESOLVED_STATUSES.has(t.status)).length;
  const ticketsWaitingReply = tickets.filter((t) => NEEDS_REPLY_STATUSES.has(t.status)).length;
  const ticketsResolved = tickets.filter((t) => RESOLVED_STATUSES.has(t.status)).length;

  const topTab = rawTab ? (TAB_ALIASES[rawTab] ?? rawTab) : undefined;
  const proyectoSubTab = rawTab === "credentials" || rawTab === "documents" ? rawTab : undefined;
  const soporteSubTab = rawTab === "requests" ? "requests" : undefined;

  const ticketDialogProps = {
    clients: [{ id: client.id, business_name: client.business_name }],
    projects: projects.map((p) => ({ id: p.id, name: p.name, client_id: client.id })),
  };
  const newTicketTrigger = <NewTicketDialog {...ticketDialogProps} triggerLabel="Crear solicitud" />;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Clientes
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <ClientLogoUpload clientId={client.id} businessName={client.business_name} logoUrl={client.logo_url} />
        <div>
          <h1 className="text-page-title">{client.business_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            {client.contact_name && <p className="text-sm text-muted">{client.contact_name}</p>}
            <Badge tone={statusTone(client.status, "client")}>
              {CLIENT_STATUSES.find((s) => s.value === client.status)?.label}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs
        defaultTab={topTab}
        tabs={[
          {
            id: "resumen",
            label: "Resumen",
            content: (
              <ResumenTab
                client={client}
                mainProject={mainProject}
                projectCount={projects.length}
                lastActivity={lastActivity}
                history={history}
                hasPendingApproval={hasPendingApproval}
                newTicketTrigger={newTicketTrigger}
              />
            ),
          },
          {
            id: "proyecto",
            label: "Proyecto",
            content: (
              <Tabs
                defaultTab={proyectoSubTab}
                tabs={[
                  {
                    id: "projects",
                    label: "Proyectos",
                    count: projects.length,
                    content: <ProjectsTab clientId={client.id} projects={projects} />,
                  },
                  {
                    id: "documents",
                    label: "Documentos",
                    count: documents.length || undefined,
                    content: <DocumentsTab clientId={client.id} documents={documents} projects={projectOptions} />,
                  },
                  {
                    id: "credentials",
                    label: "Accesos",
                    count: credentials.length || undefined,
                    content: <CredentialsTab clientId={client.id} credentials={credentials} projects={projectOptions} />,
                  },
                ]}
              />
            ),
          },
          {
            id: "payments",
            label: "Pagos",
            content: <PaymentsTab clientId={client.id} payments={payments} projects={paymentProjects} installments={installments} />,
          },
          {
            id: "soporte",
            label: "Soporte",
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-lg font-semibold text-warning">{ticketsOpen}</p>
                    <p className="text-xs text-muted-2">Abiertos</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-lg font-semibold">{ticketsWaitingReply}</p>
                    <p className="text-xs text-muted-2">Esperando respuesta</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-lg font-semibold text-success">{ticketsResolved}</p>
                    <p className="text-xs text-muted-2">Resueltos</p>
                  </div>
                </div>
                <Tabs
                  defaultTab={soporteSubTab}
                  tabs={[
                    {
                      id: "tickets",
                      label: "Tickets",
                      count: tickets.length,
                      content: (
                        <div className="space-y-3">
                          <div className="flex justify-end">
                            <NewTicketDialog {...ticketDialogProps} />
                          </div>
                          <TicketList tickets={tickets} basePath="/support" />
                        </div>
                      ),
                    },
                    {
                      id: "requests",
                      label: "Solicitudes",
                      count: requests.length,
                      content: <RequestsTab clientId={client.id} requests={requests} />,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            id: "mas",
            label: "Más",
            content: (
              <MasTab
                client={client}
                members={members}
                audits={audits}
                history={history}
                internalNotes={internalNotes}
                hasPendingApproval={hasPendingApproval}
                openSection={rawTab}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function ResumenTab({
  client,
  mainProject,
  projectCount,
  lastActivity,
  history,
  hasPendingApproval,
  newTicketTrigger,
}: {
  client: NonNullable<Awaited<ReturnType<typeof getClientDetail>>["client"]>;
  mainProject: Awaited<ReturnType<typeof getClientDetail>>["projects"][number] | undefined;
  projectCount: number;
  lastActivity: string | undefined;
  history: Awaited<ReturnType<typeof getClientDetail>>["history"];
  hasPendingApproval: boolean;
  newTicketTrigger: React.ReactNode;
}) {
  const contactRows = [
    { label: "Teléfono", value: client.phone },
    { label: "WhatsApp", value: client.whatsapp },
    { label: "Email", value: client.email },
    { label: "RUT", value: client.rut },
    { label: "Dirección", value: client.address },
  ].filter((r) => r.value);

  return (
    <div className="space-y-4">
      {hasPendingApproval && (
        <Link
          href={`/clients/${client.id}?tab=members`}
          className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning transition-colors hover:border-warning/50"
        >
          <UserCheck size={16} className="shrink-0" />
          <span className="flex-1">Hay una solicitud de acceso al portal pendiente de aprobación.</span>
        </Link>
      )}

      {!mainProject ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">Todavía no tenés ningún proyecto para este cliente.</p>
          <NewProjectDialog clientId={client.id} triggerLabel="Crear proyecto" />
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="min-w-0 max-w-[180px]">
              <p className="text-caption">Proyecto</p>
              <p className="truncate font-medium">{mainProject.name}</p>
            </div>
            <div className="min-w-0">
              <p className="text-caption">Estado</p>
              <p className="truncate font-medium">{PROJECT_STATUSES.find((s) => s.value === mainProject.status)?.label}</p>
            </div>
            <div className="min-w-0">
              <p className="text-caption">Progreso</p>
              <p className="font-medium tabular-nums">{mainProject.progress_percent}%</p>
            </div>
            <div className="min-w-0">
              <p className="text-caption">Saldo</p>
              <p className={`truncate font-medium ${mainProject.balance > 0 ? "text-warning" : "text-success"}`}>
                {mainProject.balance > 0 ? formatCurrency(mainProject.balance, mainProject.currency) : "Al día"}
              </p>
            </div>
            {lastActivity && (
              <div className="min-w-0">
                <p className="text-caption">Última actividad</p>
                <p className="truncate font-medium">{formatDateTime(lastActivity)}</p>
              </div>
            )}
          </div>
          {mainProject.next_step && (
            <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
              <span className="text-muted-2">Próximo paso: </span>
              {mainProject.next_step}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/projects/${mainProject.id}`}>
              <Button size="sm" variant="secondary">
                <FolderKanban size={14} /> Ver proyecto
              </Button>
            </Link>
            {mainProject.balance > 0 && (
              <Link href={`/clients/${client.id}?tab=payments`}>
                <Button size="sm" variant="secondary">
                  <Wallet size={14} /> Registrar pago
                </Button>
              </Link>
            )}
            {newTicketTrigger}
          </div>
          {projectCount > 1 && (
            <Link
              href={`/clients/${client.id}?tab=projects`}
              className="mt-3 inline-block text-xs text-accent hover:underline"
            >
              Ver todos los proyectos ({projectCount})
            </Link>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-card-title">Datos del cliente</p>
          <Link href={`/clients/${client.id}/edit`} className="flex items-center gap-1 text-xs text-accent hover:underline">
            <Pencil size={12} /> Editar información
          </Link>
        </div>
        {contactRows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-2">Sin datos de contacto cargados todavía.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {contactRows.map((r) => (
              <div key={r.label}>
                <p className="text-xs text-muted-2">{r.label}</p>
                <p className="truncate text-sm font-medium">{r.value}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card className="p-4">
          <p className="text-card-title">Actividad reciente</p>
          <div className="mt-3 space-y-3">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex gap-2 text-sm">
                <Clock size={14} className="mt-0.5 shrink-0 text-muted-2" />
                <div className="min-w-0">
                  <p className="truncate">{h.event}</p>
                  <p className="text-xs text-muted-2">{formatDateTime(h.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/clients/${client.id}?tab=history`} className="mt-3 inline-block text-xs text-accent hover:underline">
            Ver historial completo
          </Link>
        </Card>
      )}
    </div>
  );
}

function MasTab({
  client,
  members,
  audits,
  history,
  internalNotes,
  hasPendingApproval,
  openSection,
}: {
  client: NonNullable<Awaited<ReturnType<typeof getClientDetail>>["client"]>;
  members: Awaited<ReturnType<typeof getClientDetail>>["members"];
  audits: Awaited<ReturnType<typeof getClientAudits>>;
  history: Awaited<ReturnType<typeof getClientDetail>>["history"];
  internalNotes: Awaited<ReturnType<typeof getClientInternalNotes>>;
  hasPendingApproval: boolean;
  openSection?: string;
}) {
  return (
    <div className="space-y-6">
      <MasGroup title="Cliente">
        <MasDetails label="Información completa">
          <OverviewTab client={client} />
        </MasDetails>
      </MasGroup>

      <MasGroup title="Portal del cliente">
        <MasDetails label={`Acceso del cliente${members.length ? ` (${members.length})` : ""}`} open={hasPendingApproval || openSection === "members"}>
          <MembersTab clientId={client.id} members={members} businessName={client.business_name} defaultPhone={client.whatsapp || client.phone} />
        </MasDetails>
      </MasGroup>

      <MasGroup title="Administración">
        <MasDetails label={`Auditorías${audits.length ? ` (${audits.length})` : ""}`} open={openSection === "audits"}>
          <AuditsTab audits={audits} />
        </MasDetails>
        <MasDetails label="Historial completo" open={openSection === "history"}>
          <HistoryTab history={history} />
        </MasDetails>
      </MasGroup>

      <MasGroup title="Interno">
        <MasDetails label={`Notas internas${internalNotes.length ? ` (${internalNotes.length})` : ""}`} open={openSection === "notes"}>
          <InternalNotes notes={internalNotes} clientId={client.id} />
        </MasDetails>
      </MasGroup>

      <div className="border-t border-border pt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-2">Zona de riesgo</p>
        <DeleteClientButton clientId={client.id} />
      </div>
    </div>
  );
}

function MasGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MasDetails({ label, open, children }: { label: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-border" open={open}>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium marker:content-none group-open:border-b group-open:border-border">
        {label}
      </summary>
      <div className="p-4">{children}</div>
    </details>
  );
}

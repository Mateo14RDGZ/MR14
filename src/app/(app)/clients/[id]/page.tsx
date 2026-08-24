import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientDetail, getAllTickets, getClientSupportSummary, getClientAudits, getClientInternalNotes } from "@/lib/queries";
import { InternalNotes } from "@/components/shared/InternalNotes";
import { TicketList } from "@/components/portal/TicketList";
import { Tabs } from "@/components/ui/Tabs";
import { Badge, statusTone } from "@/components/ui/Badge";
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
import { InviteMemberDialog } from "@/components/clients/InviteMemberDialog";
import { NewTicketDialog } from "@/components/shared/NewTicketDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PROJECT_STATUSES, CLIENT_STATUSES } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, FolderKanban, Wallet } from "lucide-react";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const data = await getClientDetail(id);
  if (!data.client) notFound();

  const { client, projects, credentials, documents, history, members, payments, requests } = data;
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const hasPendingApproval = members.some((m) => m.status === "invited");
  const mainProject = projects[0];
  const lastActivity = history[0]?.created_at;
  const [tickets, supportSummary, audits, internalNotes] = await Promise.all([
    getAllTickets({ clientId: client.id }),
    getClientSupportSummary(client.id),
    getClientAudits(client.id),
    getClientInternalNotes(client.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Clientes
      </Link>

      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={client.business_name} size="lg" />
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
        <div className="flex items-center gap-2">
          <InviteMemberDialog clientId={client.id} businessName={client.business_name} defaultPhone={client.whatsapp || client.phone} />
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>

      {mainProject && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-caption">Proyecto</p>
              <p className="font-medium">{mainProject.name}</p>
            </div>
            <div>
              <p className="text-caption">Estado</p>
              <p className="font-medium">{PROJECT_STATUSES.find((s) => s.value === mainProject.status)?.label}</p>
            </div>
            <div>
              <p className="text-caption">Saldo</p>
              <p className={`font-medium ${mainProject.balance > 0 ? "text-warning" : "text-success"}`}>
                {mainProject.balance > 0 ? formatCurrency(mainProject.balance, mainProject.currency) : "Al día"}
              </p>
            </div>
            {lastActivity && (
              <div>
                <p className="text-caption">Última actividad</p>
                <p className="font-medium">{formatDateTime(lastActivity)}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/projects/${mainProject.id}`}>
              <Button size="sm" variant="secondary">
                <FolderKanban size={14} /> Ver proyecto
              </Button>
            </Link>
            <Link href={`/clients/${client.id}?tab=payments`}>
              <Button size="sm" variant="secondary">
                <Wallet size={14} /> Registrar pago
              </Button>
            </Link>
            <NewTicketDialog
              clients={[{ id: client.id, business_name: client.business_name }]}
              projects={projects.map((p) => ({ id: p.id, name: p.name, client_id: client.id }))}
              triggerLabel="Crear solicitud"
            />
          </div>
        </div>
      )}

      <Tabs
        defaultTab={tab ?? (hasPendingApproval ? "members" : undefined)}
        tabs={[
          { id: "overview", label: "Información", content: <OverviewTab client={client} /> },
          { id: "projects", label: "Proyectos", count: projects.length, content: <ProjectsTab clientId={client.id} projects={projects} /> },
          { id: "payments", label: "Pagos", count: payments.length, content: <PaymentsTab clientId={client.id} payments={payments} projects={projectOptions} /> },
          { id: "credentials", label: "Credenciales", count: credentials.length, content: <CredentialsTab clientId={client.id} credentials={credentials} projects={projectOptions} /> },
          { id: "documents", label: "Documentos", count: documents.length, content: <DocumentsTab clientId={client.id} documents={documents} projects={projectOptions} /> },
          {
            id: "members",
            label: "Usuarios",
            count: members.length,
            content: (
              <MembersTab
                clientId={client.id}
                members={members}
                businessName={client.business_name}
                defaultPhone={client.whatsapp || client.phone}
              />
            ),
          },
          {
            id: "support",
            label: "Tickets",
            count: supportSummary.total,
            content: (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <NewTicketDialog
                    clients={[{ id: client.id, business_name: client.business_name }]}
                    projects={projects.map((p) => ({ id: p.id, name: p.name, client_id: client.id }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-lg font-semibold">{supportSummary.total}</p>
                    <p className="text-xs text-muted-2">Tickets</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-lg font-semibold text-warning">{supportSummary.open}</p>
                    <p className="text-xs text-muted-2">Abiertos</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-lg font-semibold text-success">{supportSummary.resolved}</p>
                    <p className="text-xs text-muted-2">Resueltos</p>
                  </div>
                </div>
                <TicketList tickets={tickets} basePath="/support" />
              </div>
            ),
          },
          { id: "requests", label: "Solicitudes", count: requests.length, content: <RequestsTab clientId={client.id} requests={requests} /> },
          { id: "audits", label: "Auditorías", count: audits.length, content: <AuditsTab audits={audits} /> },
          { id: "history", label: "Historial", content: <HistoryTab history={history} /> },
          { id: "notes", label: "Notas internas", count: internalNotes.length, content: <InternalNotes notes={internalNotes} clientId={client.id} /> },
        ]}
      />
    </div>
  );
}

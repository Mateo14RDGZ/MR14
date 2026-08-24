import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientDetail } from "@/lib/queries";
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
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { CLIENT_STATUSES } from "@/lib/types";
import { initials } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClientDetail(id);
  if (!data.client) notFound();

  const { client, projects, credentials, documents, history, members, payments, requests } = data;
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Clientes
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-semibold text-muted">
            {initials(client.business_name)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.business_name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={statusTone(client.status, "client")}>
                {CLIENT_STATUSES.find((s) => s.value === client.status)?.label}
              </Badge>
            </div>
          </div>
        </div>
        <DeleteClientButton clientId={client.id} />
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Información", content: <OverviewTab client={client} /> },
          { id: "projects", label: "Proyectos", count: projects.length, content: <ProjectsTab clientId={client.id} projects={projects} /> },
          { id: "payments", label: "Pagos", count: payments.length, content: <PaymentsTab clientId={client.id} payments={payments} projects={projectOptions} /> },
          { id: "credentials", label: "Credenciales", count: credentials.length, content: <CredentialsTab clientId={client.id} credentials={credentials} projects={projectOptions} /> },
          { id: "documents", label: "Documentos", count: documents.length, content: <DocumentsTab clientId={client.id} documents={documents} projects={projectOptions} /> },
          { id: "members", label: "Usuarios", count: members.length, content: <MembersTab clientId={client.id} members={members} /> },
          { id: "requests", label: "Solicitudes", count: requests.length, content: <RequestsTab clientId={client.id} requests={requests} /> },
          { id: "history", label: "Historial", content: <HistoryTab history={history} /> },
        ]}
      />
    </div>
  );
}

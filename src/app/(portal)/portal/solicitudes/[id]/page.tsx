import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalContext } from "@/lib/portal";
import { getTicketDetail } from "@/lib/queries";
import { TicketDetail } from "@/components/shared/TicketDetail";
import { ArrowLeft } from "lucide-react";

export default async function PortalTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { activeClient } = await getPortalContext();
  const data = await getTicketDetail(id);
  if (!data) notFound();

  const { ticket, messages, attachments, events, quotes } = data;

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link href="/portal/solicitudes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Mis solicitudes
      </Link>
      <TicketDetail
        role="client"
        ticket={ticket}
        clientName={activeClient?.business_name ?? ""}
        projectName={(ticket.projects as { name?: string } | null)?.name ?? ""}
        messages={messages}
        attachments={attachments}
        events={events}
        quotes={quotes}
      />
    </div>
  );
}

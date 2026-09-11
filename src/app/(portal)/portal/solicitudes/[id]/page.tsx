import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalContext } from "@/lib/portal";
import { getTicketDetail } from "@/lib/queries";
import { TicketDetail } from "@/components/shared/TicketDetail";
import { ArrowLeft } from "lucide-react";

export default async function PortalTicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; attachmentWarning?: string }> }) {
  const { id } = await params;
  const receipt = await searchParams;
  const { activeClient } = await getPortalContext();
  const data = await getTicketDetail(id);
  if (!data) notFound();

  const { ticket, messages, attachments, events, quotes, creator } = data;

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link href="/portal/solicitudes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Mis solicitudes
      </Link>
      {receipt.created && <p role="status" className="mb-4 rounded-xl bg-accent-soft p-4 text-base text-accent">Tu consulta fue enviada a Mateo. Podés seguir la respuesta acá.</p>}
      {receipt.attachmentWarning && <p role="alert" className="mb-4 rounded-xl border border-border p-4 text-sm">La consulta se guardó, pero faltó una foto o archivo. Podés agregarlo con un mensaje abajo.</p>}
      <TicketDetail
        role="client"
        ticket={ticket}
        clientName={activeClient?.business_name ?? ""}
        projectName={(ticket.projects as { name?: string } | null)?.name ?? ""}
        messages={messages}
        attachments={attachments}
        events={events}
        quotes={quotes}
        creator={creator}
      />
    </div>
  );
}

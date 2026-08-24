import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicketDetail } from "@/lib/queries";
import { TicketDetail } from "@/components/shared/TicketDetail";
import { ArrowLeft } from "lucide-react";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTicketDetail(id);
  if (!data) notFound();

  const { ticket, messages, attachments, events, quotes } = data;
  const clientName = (ticket.clients as { business_name?: string } | null)?.business_name ?? "";
  const projectName = (ticket.projects as { name?: string } | null)?.name ?? "";

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <Link href="/support" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Tickets
      </Link>
      <TicketDetail
        role="admin"
        ticket={ticket}
        clientName={clientName}
        projectName={projectName}
        messages={messages}
        attachments={attachments}
        events={events}
        quotes={quotes}
      />
    </div>
  );
}

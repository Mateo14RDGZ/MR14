import Link from "next/link";
import { getPortalContext } from "@/lib/portal";
import { getPortalProjectsForSelect } from "@/lib/queries";
import { NewTicketForm } from "@/components/portal/NewTicketForm";
import { ArrowLeft } from "lucide-react";

export default async function NewTicketPage() {
  const { activeClientId } = await getPortalContext();
  const projects = await getPortalProjectsForSelect(activeClientId);

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href="/portal/solicitudes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Mis solicitudes
      </Link>
      <h1 className="mb-1 text-page-title">Solicitar soporte</h1>
      <p className="mb-6 text-sm text-muted">Contanos qué necesitás y te respondemos a la brevedad.</p>
      <NewTicketForm clientId={activeClientId} projects={projects} />
    </div>
  );
}

import Link from "next/link";
import { setActiveOrganizationAction } from "@/actions/members";
import { Building2, User } from "lucide-react";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { getMyNotifications } from "@/lib/queries";
import { ClientLogo } from "@/components/ui/ClientLogo";
import { OrganizationSelect } from "./OrganizationSelect";

interface Membership {
  client_id: string;
  clients: { business_name: string } | null;
}

export async function OrgSwitcher({
  memberships,
  activeClientId,
  businessName,
  clientLogo,
}: {
  memberships: Membership[];
  activeClientId: string;
  businessName: string;
  clientLogo?: string | null;
}) {
  const { notifications, unreadCount } = await getMyNotifications();

  return (
    <header className="portal-mobile-header sticky top-0 z-30 flex min-h-[4.75rem] items-center gap-2 border-b border-border bg-background/90 px-[clamp(0.75rem,4vw,1.25rem)] pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:min-h-16 lg:gap-3 lg:px-8">
      <Link href="/portal" aria-label={`Ir al inicio de ${businessName}`} className="portal-press flex shrink-0 items-center lg:hidden">
        {clientLogo ? (
          <ClientLogo src={clientLogo} alt={businessName} size={56} priority className="h-[clamp(3rem,14vw,3.5rem)] w-[clamp(3rem,14vw,3.5rem)]" />
        ) : (
          <span className="flex h-[clamp(3rem,14vw,3.5rem)] w-[clamp(3rem,14vw,3.5rem)] shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-semibold text-accent">
            {businessName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>
      {memberships.length > 1 && (
        <form action={setActiveOrganizationAction} className="flex items-center gap-2">
          <Building2 size={15} className="hidden text-muted-2 lg:block" />
          <OrganizationSelect activeClientId={activeClientId}
            clients={memberships.map((m) => ({ id: m.client_id, name: m.clients?.business_name ?? "Negocio" }))} />
        </form>
      )}
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-1 min-[360px]:gap-2">
        <NotificationBell notifications={notifications} unreadCount={unreadCount} ticketBasePath="/portal/solicitudes" audience="client" />
        <Link
          href="/portal/perfil"
          aria-label="Abrir mi perfil"
          className="portal-press flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 lg:hidden"
        >
          <User size={19} />
        </Link>
      </div>
    </header>
  );
}

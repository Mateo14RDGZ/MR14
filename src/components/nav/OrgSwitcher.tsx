import Link from "next/link";
import { setActiveOrganizationAction } from "@/actions/members";
import { Building2, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { getMyNotifications } from "@/lib/queries";
import { ClientLogo } from "@/components/ui/ClientLogo";

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
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-background/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:px-8">
      <Link href="/portal" aria-label="Ir al inicio" className="portal-press flex min-w-0 items-center gap-2.5 lg:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
          <Logo mark size="lg" className="max-h-8 w-auto" />
        </span>
        <span aria-hidden="true" className="text-xs text-muted-2">×</span>
        {clientLogo ? (
          <ClientLogo src={clientLogo} size={36} className="h-9 w-9 border border-border bg-white" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xs font-semibold text-accent">
            {businessName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden truncate text-xs font-medium text-muted min-[390px]:block">{businessName}</span>
      </Link>
      {memberships.length > 1 && (
        <form action={setActiveOrganizationAction} className="flex items-center gap-2">
          <Building2 size={15} className="hidden text-muted-2 lg:block" />
          <select
            name="client_id"
            defaultValue={activeClientId}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm outline-none focus:border-accent"
          >
            {memberships.map((m) => (
              <option key={m.client_id} value={m.client_id}>
                {m.clients?.business_name ?? "Negocio"}
              </option>
            ))}
          </select>
        </form>
      )}
      <div className="flex-1" />
      <NotificationBell notifications={notifications} unreadCount={unreadCount} ticketBasePath="/portal/solicitudes" />
      <Link
        href="/portal/perfil"
        aria-label="Abrir mi perfil"
        className="portal-press flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
      >
        <User size={18} />
      </Link>
    </header>
  );
}

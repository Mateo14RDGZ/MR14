import { setActiveOrganizationAction } from "@/actions/members";
import { Building2 } from "lucide-react";
import { signOut } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { getMyNotifications } from "@/lib/queries";

interface Membership {
  client_id: string;
  clients: { business_name: string } | null;
}

export async function OrgSwitcher({
  memberships,
  activeClientId,
}: {
  memberships: Membership[];
  activeClientId: string;
}) {
  const { notifications, unreadCount } = await getMyNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
      {memberships.length > 1 ? (
        <form action={setActiveOrganizationAction} className="flex items-center gap-2">
          <Building2 size={16} className="text-muted-2" />
          <select
            name="client_id"
            defaultValue={activeClientId}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-accent"
          >
            {memberships.map((m) => (
              <option key={m.client_id} value={m.client_id}>
                {m.clients?.business_name ?? "Negocio"}
              </option>
            ))}
          </select>
        </form>
      ) : (
        <p className="text-sm font-medium">{memberships[0]?.clients?.business_name}</p>
      )}
      <div className="flex-1" />
      <NotificationBell notifications={notifications} unreadCount={unreadCount} ticketBasePath="/portal/solicitudes" />
      <form action={signOut} className="lg:hidden">
        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2">
          <LogOut size={18} />
        </button>
      </form>
    </header>
  );
}

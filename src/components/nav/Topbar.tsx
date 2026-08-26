import { CommandPaletteTrigger } from "./CommandPalette";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { getMyNotifications } from "@/lib/queries";

export async function Topbar() {
  const { notifications, unreadCount } = await getMyNotifications();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      {/* Fila 1: logo/buscador + acciones. En mobile el buscador baja a su propia fila
          (no entra junto al resto en ~390px) — en desktop va todo en una sola fila. */}
      <div className="flex min-h-16 items-center gap-3 px-4 lg:min-h-16 lg:px-6">
        <div className="lg:hidden">
          <Logo mark size="xl" />
        </div>
        <div className="hidden min-w-0 flex-1 max-w-sm lg:block">
          <CommandPaletteTrigger />
        </div>
        <div className="flex-1" />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} ticketBasePath="/support" />
        <form action={signOut} className="lg:hidden">
          <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2">
            <LogOut size={18} />
          </button>
        </form>
      </div>
      <div className="px-4 pb-3 lg:hidden">
        <CommandPaletteTrigger />
      </div>
    </header>
  );
}

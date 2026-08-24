import { CommandPaletteTrigger } from "./CommandPalette";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { getMyNotifications } from "@/lib/queries";

export async function Topbar() {
  const { notifications, unreadCount } = await getMyNotifications();

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:px-6">
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>
      <div className="min-w-0 flex-1 max-w-sm">
        <CommandPaletteTrigger />
      </div>
      <div className="flex-1" />
      <NotificationBell notifications={notifications} unreadCount={unreadCount} ticketBasePath="/support" />
      <form action={signOut} className="lg:hidden">
        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2">
          <LogOut size={18} />
        </button>
      </form>
    </header>
  );
}

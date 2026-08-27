"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/actions/auth";

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const primaryItems = NAV_ITEMS.filter((i) => i.href !== "/settings");

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-60 lg:shrink-0 lg:flex-col border-r border-border bg-surface">
      <div className="flex h-32 shrink-0 items-center justify-center px-4">
        <Logo mark size="2xl" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2">
        {primaryItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-surface-2 font-medium text-foreground"
                  : "text-muted hover:bg-surface-2/60 hover:text-foreground"
              )}
            >
              <Icon size={17} strokeWidth={1.75} className={active ? "text-foreground" : "text-muted-2"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 space-y-0.5 border-t border-border px-2.5 py-2.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
            pathname.startsWith("/settings")
              ? "bg-surface-2 font-medium text-foreground"
              : "text-muted hover:bg-surface-2/60 hover:text-foreground"
          )}
        >
          <Settings size={17} strokeWidth={1.75} className={pathname.startsWith("/settings") ? "text-foreground" : "text-muted-2"} />
          Configuración
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted transition-colors duration-150 hover:bg-surface-2/60 hover:text-danger"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </form>
        <div className="truncate px-2.5 pt-1.5 text-caption">{userEmail ?? "Sesión activa"}</div>
      </div>
    </aside>
  );
}

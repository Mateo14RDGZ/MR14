"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { PORTAL_NAV_ITEMS } from "./portal-nav-items";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/actions/auth";

export function PortalSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center px-5 border-b border-border">
        <Logo />
      </div>
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-2">Portal de</p>
        <p className="truncate font-medium">{businessName}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {PORTAL_NAV_ITEMS.map((item) => {
          const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/portal/perfil"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/portal/perfil")
              ? "bg-accent/10 text-accent"
              : "text-muted hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <User size={18} strokeWidth={1.75} />
          Mi perfil
        </Link>
      </nav>
      <div className="border-t border-border p-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

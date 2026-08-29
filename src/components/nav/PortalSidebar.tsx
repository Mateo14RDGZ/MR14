"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { PORTAL_PRIMARY_NAV_ITEMS, PORTAL_RESOURCE_NAV_ITEMS } from "./portal-nav-items";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/actions/auth";

export function PortalSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border bg-surface/80 lg:flex lg:h-svh lg:w-64 lg:shrink-0 lg:flex-col">
      <div className="flex h-28 shrink-0 items-center justify-center px-4">
        <Logo mark size="2xl" />
      </div>
      <div className="mx-3 shrink-0 rounded-xl bg-surface-2 px-3.5 py-3">
        <p className="text-caption">Estás viendo</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{businessName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">Principal</p>
        <div className="space-y-1">
        {PORTAL_PRIMARY_NAV_ITEMS.map((item) => {
          const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-accent-soft font-semibold text-foreground"
                  : "text-muted hover:bg-surface-2/60 hover:text-foreground"
              )}
            >
              <Icon size={17} strokeWidth={1.75} className={active ? "text-foreground" : "text-muted-2"} />
              {item.label}
            </Link>
          );
        })}
        </div>
        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">Recursos</p>
        <div className="space-y-1">
          {PORTAL_RESOURCE_NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
                  active ? "bg-accent-soft font-semibold text-foreground" : "text-muted hover:bg-surface-2/60 hover:text-foreground"
                )}
              >
                <Icon size={17} strokeWidth={1.75} className={active ? "text-accent" : "text-muted-2"} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="shrink-0 space-y-0.5 border-t border-border px-2.5 py-2.5">
        <Link
          href="/portal/perfil"
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
            pathname.startsWith("/portal/perfil")
              ? "bg-surface-2 font-medium text-foreground"
              : "text-muted hover:bg-surface-2/60 hover:text-foreground"
          )}
        >
          <User size={17} strokeWidth={1.75} className={pathname.startsWith("/portal/perfil") ? "text-foreground" : "text-muted-2"} />
          Mi perfil
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
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_BOTTOM_NAV_ITEMS } from "./portal-nav-items";
import { cn } from "@/lib/utils";

const MAS_ROUTES = ["/portal/mas", "/portal/pagos", "/portal/renovaciones", "/portal/perfil"];

function isActiveFor(href: string, pathname: string) {
  if (href === "/portal") return pathname === "/portal";
  if (href === "/portal/mas") return MAS_ROUTES.some((r) => pathname.startsWith(r));
  return pathname.startsWith(href);
}

export function PortalBottomNav() {
  const pathname = usePathname();
  // Ver BottomNav: feedback inmediato al tocar, porque la navegación real
  // depende de una respuesta del servidor.
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => {
    setTapped(null);
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
        const active = tapped ? tapped === item.href : isActiveFor(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setTapped(item.href)}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors duration-150",
              active ? "text-foreground" : "text-muted-2"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

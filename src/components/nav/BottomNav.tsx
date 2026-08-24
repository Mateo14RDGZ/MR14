"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BOTTOM_NAV_ITEMS, MAS_ROUTES } from "./nav-items";
import { cn } from "@/lib/utils";

function isActiveFor(href: string, pathname: string) {
  return href === "/mas" ? MAS_ROUTES.some((r) => pathname.startsWith(r)) : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  // Cambiar de pantalla implica un roundtrip al servidor. Sin esto, el tap no
  // da ninguna señal hasta que la pantalla nueva ya está lista y se siente
  // trabado: el destino tocado se marca activo al instante y el skeleton de
  // loading.tsx se encarga del resto.
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => {
    setTapped(null);
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
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

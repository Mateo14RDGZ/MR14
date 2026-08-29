"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_BOTTOM_NAV_ITEMS } from "./portal-nav-items";
import { cn } from "@/lib/utils";

function isActiveFor(href: string, pathname: string) {
  if (href === "/portal") return pathname === "/portal";
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
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg border-t border-border bg-surface/95 px-2 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden">
      {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
        const active = tapped ? tapped === item.href : isActiveFor(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setTapped(item.href)}
            className={cn(
              "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors duration-150",
              active ? "text-accent" : "text-muted-2"
            )}
          >
            {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
            <Icon size={20} strokeWidth={active ? 2 : 1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

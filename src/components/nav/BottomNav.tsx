"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
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

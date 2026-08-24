"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { TICKET_CATEGORIES, TICKET_STATUSES, type Ticket } from "@/lib/types";

type TicketListItem = Pick<Ticket, "id" | "number" | "subject" | "category" | "status" | "created_at">;
import { formatDate } from "@/lib/utils";
import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, "muted" | "warning" | "accent" | "success" | "danger"> = {
  received: "muted",
  reviewing: "warning",
  in_progress: "accent",
  waiting_client: "warning",
  requires_quote: "warning",
  approved: "accent",
  resolved: "success",
  closed: "muted",
};

const OPEN_STATUSES = ["received", "reviewing", "in_progress", "waiting_client", "requires_quote", "approved"];

export function TicketList({ tickets, basePath }: { tickets: TicketListItem[]; basePath: string }) {
  const [tab, setTab] = useState<"open" | "resolved" | "all">("open");

  const filtered = tickets.filter((t) => {
    if (tab === "open") return OPEN_STATUSES.includes(t.status);
    if (tab === "resolved") return !OPEN_STATUSES.includes(t.status);
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["open", "resolved", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t === "open" ? "Abiertos" : t === "resolved" ? "Resueltos" : "Todos"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={tab === "open" ? "No tenés solicitudes abiertas." : "Sin solicitudes en esta categoría."}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Link key={t.id} href={`${basePath}/${t.id}`}>
              <Card className="p-4 transition-colors hover:border-muted-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-2">#{t.number}</p>
                    <p className="truncate font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-2">
                      {TICKET_CATEGORIES.find((c) => c.value === t.category)?.label} · {formatDate(t.created_at)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[t.status]}>
                    {TICKET_STATUSES.find((s) => s.value === t.status)?.label}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export { STATUS_TONE as TICKET_STATUS_TONE, OPEN_STATUSES };

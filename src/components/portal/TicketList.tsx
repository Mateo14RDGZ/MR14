"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { TICKET_STATUSES, CLIENT_TICKET_STATUS_LABEL, type Ticket } from "@/lib/types";

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

export function TicketList({
  tickets,
  basePath,
  clientView = false,
}: {
  tickets: TicketListItem[];
  basePath: string;
  clientView?: boolean;
}) {
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const filtered = tickets.filter((t) => {
    if (tab === "open") return OPEN_STATUSES.includes(t.status);
    if (tab === "resolved") return !OPEN_STATUSES.includes(t.status);
    return !OPEN_STATUSES.includes(t.status);
  });

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["open", "resolved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-12 flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:flex-none",
              tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t === "open" ? "Esperando respuesta" : "Terminadas"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={tab === "open" ? "No tenés consultas pendientes" : "Todavía no hay consultas terminadas"}
          description={tab === "open" ? "Cuando le escribas a Mateo, vas a poder seguir la respuesta desde acá." : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Link key={t.id} href={`${basePath}/${t.id}`}>
              <Card className="p-4 transition-colors hover:border-muted-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{t.subject}</p>
                    <p className="mt-1 text-sm text-muted">
                      Enviada el {formatDate(t.created_at)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[t.status]}>
                    {clientView ? CLIENT_TICKET_STATUS_LABEL[t.status] : TICKET_STATUSES.find((s) => s.value === t.status)?.label}
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

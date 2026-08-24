import { EmptyState } from "@/components/ui/Empty";
import { Badge } from "@/components/ui/Badge";
import type { HistoryRow } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

export function HistoryTab({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return <EmptyState icon={Activity} title="Sin historial todavía" />;
  }

  return (
    <ol className="space-y-4 border-l border-border pl-5">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <div className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-accent" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">{h.event}</p>
            <Badge tone={h.visibility === "client" ? "success" : "muted"}>
              {h.visibility === "client" ? "Visible al cliente" : "Interno"}
            </Badge>
          </div>
          <p className="text-xs text-muted-2">{formatDateTime(h.created_at)}</p>
        </li>
      ))}
    </ol>
  );
}

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { formatDateTime } from "@/lib/utils";
import { ScanSearch } from "lucide-react";
import type { WebsiteAuditRow } from "@/lib/types";

export function AuditsTab({ audits }: { audits: WebsiteAuditRow[] }) {
  if (audits.length === 0) {
    return (
      <EmptyState
        icon={ScanSearch}
        title="Sin auditorías todavía"
        description="Analizá el sitio de este cliente desde la sección Auditorías."
        action={
          <Link href="/audits" className="text-xs text-accent hover:underline">
            Ir a Auditorías
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {audits.map((a) => {
        const score = (a.score ?? {}) as { seo?: number; accessibility?: number; performance?: number };
        return (
          <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{a.url}</p>
              <p className="text-xs text-muted-2">{formatDateTime(a.created_at)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={(score.seo ?? 0) >= 70 ? "success" : "warning"}>SEO {score.seo ?? "-"}</Badge>
              <Badge tone={(score.accessibility ?? 0) >= 70 ? "success" : "warning"}>A11y {score.accessibility ?? "-"}</Badge>
              <Badge tone={(score.performance ?? 0) >= 70 ? "success" : "warning"}>Perf {score.performance ?? "-"}</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

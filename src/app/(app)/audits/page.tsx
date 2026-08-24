import Link from "next/link";
import { getRecentAudits, getClientsForSelect, getAllProjects } from "@/lib/queries";
import { AnalyzeForm } from "@/components/audits/AnalyzeForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export default async function AuditsPage() {
  const [audits, clients, projects] = await Promise.all([getRecentAudits(), getClientsForSelect(), getAllProjects()]);
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client_id: p.client_id }));

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Auditorías"
        description="Analizá cualquier sitio web y generá documentación técnica automática."
      />

      <AnalyzeForm clients={clients} projects={projectOptions} />

      {audits.length > 0 && (
        <div>
          <h2 className="text-section-title mb-3">Auditorías recientes</h2>
          <div className="space-y-2">
            {audits.map((a) => {
              const score = (a.score ?? {}) as { seo?: number };
              return (
                <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.url}</p>
                    <p className="text-xs text-muted-2">
                      {(a.clients as { business_name?: string } | null)?.business_name ?? "Sin asociar"} ·{" "}
                      {formatDateTime(a.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={(score.seo ?? 0) >= 70 ? "success" : "warning"}>SEO {score.seo ?? "-"}</Badge>
                    {a.client_id && (
                      <Link href={`/clients/${a.client_id}`} className="text-xs text-accent hover:underline">
                        Ver cliente
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

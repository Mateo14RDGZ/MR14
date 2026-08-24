import Link from "next/link";
import { getAllProjects } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <p className="mt-1 text-sm text-muted">{projects.length} proyectos en total</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Sin proyectos todavía" />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="p-4 transition-colors hover:border-muted-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-2">
                      {(p.clients as { business_name?: string } | null)?.business_name} ·{" "}
                      {PROJECT_TYPES.find((t) => t.value === p.type)?.label}
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status, "project")}>
                    {PROJECT_STATUSES.find((s) => s.value === p.status)?.label}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-2">Precio</p>
                    <p className="font-medium">{formatCurrency(p.price, p.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Saldo</p>
                    <p className="font-medium text-warning">{formatCurrency(p.balance, p.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Progreso</p>
                    <p className="font-medium">{p.progress_percent}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Entrega estimada</p>
                    <p className="font-medium">{formatDate(p.estimated_delivery_date)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

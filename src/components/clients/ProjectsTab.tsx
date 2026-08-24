import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { NewProjectDialog } from "@/components/clients/NewProjectDialog";
import { PROJECT_STATUSES, PROJECT_TYPES, type Project } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export function ProjectsTab({ clientId, projects }: { clientId: string; projects: Project[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewProjectDialog clientId={clientId} />
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
                      {PROJECT_TYPES.find((t) => t.value === p.type)?.label} · Inicio {formatDate(p.start_date)}
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status, "project")}>
                    {PROJECT_STATUSES.find((s) => s.value === p.status)?.label}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-2">Precio</p>
                    <p className="font-medium">{formatCurrency(p.price, p.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Pagado</p>
                    <p className="font-medium text-success">{formatCurrency(p.amount_paid, p.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-2">Saldo</p>
                    <p className="font-medium text-warning">{formatCurrency(p.balance, p.currency)}</p>
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

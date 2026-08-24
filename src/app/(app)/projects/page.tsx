import Link from "next/link";
import { getAllProjects, getClientsForSelect } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { NewProjectDialog } from "@/components/clients/NewProjectDialog";
import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([getAllProjects(), getClientsForSelect()]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Proyectos"
        description={`${projects.length} proyectos en total`}
        action={<NewProjectDialog clients={clients} />}
      />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Sin proyectos todavía" />
      ) : (
        <div className="space-y-2.5">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="p-4 transition-colors hover:border-muted-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-2">
                      {(p.clients as { business_name?: string } | null)?.business_name} ·{" "}
                      {PROJECT_TYPES.find((t) => t.value === p.type)?.label}
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status, "project")} className="shrink-0">
                    {PROJECT_STATUSES.find((s) => s.value === p.status)?.label}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${Math.min(100, Math.max(0, p.progress_percent))}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-2">
                    {p.progress_percent}%
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-caption">Precio</p>
                    <p className="truncate font-medium tabular-nums">{formatCurrency(p.price, p.currency)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption">Saldo</p>
                    <p className="truncate font-medium tabular-nums text-warning">
                      {formatCurrency(p.balance, p.currency)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption">Entrega estimada</p>
                    <p className="truncate font-medium">{formatDate(p.estimated_delivery_date)}</p>
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

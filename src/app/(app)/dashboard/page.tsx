import Link from "next/link";
import { Suspense } from "react";
import { getDashboardCore, getSupportDashboardData, getAttentionItems } from "@/lib/queries";
import { StatCard, Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardSecondarySection } from "@/components/dashboard/DashboardSecondarySection";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { AlertTriangle, LifeBuoy, ChevronRight, Wallet, RefreshCw, CheckCircle2 } from "lucide-react";

const ATTENTION_ICON = { ticket: LifeBuoy, payment: Wallet, renewal: RefreshCw };

export default async function DashboardPage() {
  const [data, support, attention] = await Promise.all([
    getDashboardCore(),
    getSupportDashboardData(),
    getAttentionItems(),
  ]);

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader title="Dashboard" description="Lo que necesita tu atención en MR14." />

      <Card className="overflow-hidden">
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          <div>
            <h2 className="text-card-title">Prioridades</h2>
            <p className="mt-0.5 text-caption">Acciones concretas que todavía necesitan seguimiento.</p>
          </div>
        </CardHeader>
        {attention.items.length === 0 ? (
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 size={16} /> Nada pendiente por ahora.
            </div>
          </CardBody>
        ) : (
          <div className="divide-y divide-border">
            {attention.items.slice(0, 6).map((item, i) => {
              const Icon = ATTENTION_ICON[item.type];
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-surface-2"
                >
                  <Icon size={15} className="shrink-0 text-muted-2" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.client}</p>
                    <p className="truncate text-xs text-muted-2">{item.motivo}</p>
                  </div>
                  {item.timestamp && <span className="shrink-0 text-xs text-muted-2">hace {timeAgo(item.timestamp)}</span>}
                  <ChevronRight size={15} className="shrink-0 text-muted-2" />
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clientes activos" value={data.activeClients} hint={`${data.totalClients} en total`} />
        <StatCard label="En desarrollo" value={data.inDevelopment} />
        <StatCard label="Dinero pendiente" value={formatCurrency(data.moneyPending)} tone="warning" />
        <StatCard label="Tickets abiertos" value={support.open} tone={support.open > 0 ? "warning" : "default"} />
      </div>

      <Suspense fallback={<DashboardSecondaryFallback />}>
        <DashboardSecondarySection />
      </Suspense>
    </div>
  );
}

function DashboardSecondaryFallback() {
  return <Skeleton className="h-64 w-full rounded-lg" />;
}

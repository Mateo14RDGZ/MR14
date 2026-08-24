import Link from "next/link";
import { Suspense } from "react";
import { getDashboardCore, getSupportDashboardData, getAttentionItems } from "@/lib/queries";
import { StatCard, Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardSecondarySection } from "@/components/dashboard/DashboardSecondarySection";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { AlertTriangle, LifeBuoy, ChevronRight, Wallet, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ATTENTION_ICON = { ticket: LifeBuoy, payment: Wallet, renewal: RefreshCw };

export default async function DashboardPage() {
  const [data, support, attention] = await Promise.all([
    getDashboardCore(),
    getSupportDashboardData(),
    getAttentionItems(),
  ]);

  const secondaryStats: { label: string; value: string | number; tone?: "warning" | "success" | "danger" }[] = [
    { label: "Pendientes", value: data.pending, tone: "warning" },
    { label: "Entregados", value: data.delivered, tone: "success" },
    { label: "Dinero cobrado", value: formatCurrency(data.moneyCollected), tone: "success" },
    { label: "Clientes c/ pagos pendientes", value: data.clientsWithPendingPayments, tone: "danger" },
    { label: "Tickets nuevos", value: support.received, tone: "warning" },
    { label: "Resueltos hoy", value: support.resolvedToday, tone: "success" },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader title="Dashboard" description="Resumen general de MR14" />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
        <span className="text-label">Hoy</span>
        <span>{attention.today.newTickets} ticket{attention.today.newTickets === 1 ? "" : "s"} nuevo{attention.today.newTickets === 1 ? "" : "s"}</span>
        <span className="text-muted-2">·</span>
        <span>{attention.today.pendingReview} sin revisar</span>
        <span className="text-muted-2">·</span>
        <span>{attention.today.pendingPayments} pago{attention.today.pendingPayments === 1 ? "" : "s"} pendiente{attention.today.pendingPayments === 1 ? "" : "s"}</span>
        <span className="text-muted-2">·</span>
        <span>{attention.today.renewalsThisWeek} dominio{attention.today.renewalsThisWeek === 1 ? "" : "s"} vence{attention.today.renewalsThisWeek === 1 ? "" : "n"} esta semana</span>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          <h2 className="text-card-title">Requieren atención</h2>
        </CardHeader>
        {attention.items.length === 0 ? (
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 size={16} /> Nada pendiente por ahora.
            </div>
          </CardBody>
        ) : (
          <div className="divide-y divide-border">
            {attention.items.slice(0, 8).map((item, i) => {
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

      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
          {secondaryStats.map((s) => (
            <div key={s.label} className="min-w-0 p-4">
              <p className="text-label">{s.label}</p>
              <p
                className={cn(
                  "mt-1 truncate text-lg font-semibold tabular-nums",
                  s.tone === "warning" && "text-warning",
                  s.tone === "success" && "text-success",
                  s.tone === "danger" && "text-danger"
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {support.needsAttention > 0 && (
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 transition-colors hover:border-warning/50"
        >
          <LifeBuoy size={16} className="shrink-0 text-warning" />
          <p className="flex-1 text-sm text-warning">
            {support.needsAttention} ticket{support.needsAttention === 1 ? "" : "s"} requieren atención en Tickets.
          </p>
          <ChevronRight size={16} className="shrink-0 text-warning" />
        </Link>
      )}

      <Suspense fallback={<DashboardSecondaryFallback />}>
        <DashboardSecondarySection />
      </Suspense>
    </div>
  );
}

function DashboardSecondaryFallback() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-surface shadow-sm shadow-[#322a4a]/[0.04]", className)}>{children}</div>;
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("border-b border-border px-5 py-3.5", className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const toneColor = {
    default: "text-foreground",
    danger: "text-danger",
    success: "text-success",
    warning: "text-warning",
  }[tone];
  return (
    <Card className="min-w-0 p-4">
      <p className="text-label">{label}</p>
      <p className={cn("text-metric mt-1.5 truncate", toneColor)}>{value}</p>
      {hint && <p className="text-caption mt-1 truncate">{hint}</p>}
    </Card>
  );
}

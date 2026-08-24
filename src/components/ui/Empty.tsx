import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-muted-2">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <p className="text-card-title">{title}</p>
      {description && <p className="text-caption mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

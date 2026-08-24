import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  default: "bg-surface-2 text-foreground border-border",
  accent: "bg-accent-soft text-accent border-accent/25",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  muted: "bg-transparent text-muted border-border",
};

const dotClasses: Record<Tone, string> = {
  default: "bg-muted",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-muted-2",
};

export function Badge({
  children,
  tone = "default",
  dot = true,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClasses[tone])} />}
      {children}
    </span>
  );
}

const CLIENT_STATUS_TONE: Record<string, Tone> = {
  prospecto: "muted",
  contactado: "muted",
  interesado: "default",
  contrato_enviado: "warning",
  contrato_firmado: "accent",
  esperando_anticipo: "warning",
  en_desarrollo: "accent",
  en_revision: "warning",
  esperando_saldo: "warning",
  entregado: "success",
  mantenimiento: "default",
  cerrado: "muted",
};

const PROJECT_STATUS_TONE: Record<string, Tone> = {
  planificacion: "muted",
  en_desarrollo: "accent",
  en_revision: "warning",
  esperando_aprobacion: "warning",
  esperando_saldo: "warning",
  entregado: "success",
  publicado: "success",
  mantenimiento: "default",
  pausado: "muted",
  cancelado: "danger",
};

export function statusTone(status: string, kind: "client" | "project" = "client"): Tone {
  const map = kind === "client" ? CLIENT_STATUS_TONE : PROJECT_STATUS_TONE;
  return map[status] ?? "default";
}

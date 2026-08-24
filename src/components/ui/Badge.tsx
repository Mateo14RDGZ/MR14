import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  default: "bg-surface-2 text-foreground border-border",
  accent: "bg-accent/10 text-accent border-accent/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  muted: "bg-transparent text-muted border-border",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
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

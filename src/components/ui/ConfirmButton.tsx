"use client";

import { useState, useTransition } from "react";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog } from "./Dialog";

// Server actions que llaman a redirect()/notFound() de Next.js lo hacen
// lanzando un error especial con este digest — hay que dejarlo pasar para
// que el framework haga la navegación, no tratarlo como una falla real.
function isFrameworkNavigationError(err: unknown): boolean {
  const digest = (err as { digest?: string } | undefined)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND");
}

export function ConfirmButton({
  action,
  label,
  confirmTitle = "¿Confirmar acción?",
  confirmDescription = "Esta acción no se puede deshacer.",
  variant = "danger",
  confirmVariant = "danger",
  size = "sm",
  className,
}: {
  action: () => Promise<void> | void;
  label: React.ReactNode;
  confirmTitle?: string;
  confirmDescription?: string;
  variant?: "danger" | "primary" | "secondary" | "ghost" | "outline";
  confirmVariant?: "danger" | "primary";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (pending) return;
          setOpen(false);
          setError(null);
        }}
        title={confirmTitle}
        className="max-w-sm"
      >
        <div className="mb-4 flex items-start gap-3">
          {confirmVariant === "danger" ? (
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          ) : (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
          )}
          <p className="text-sm text-muted">{confirmDescription}</p>
        </div>
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-soft/20 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                try {
                  await action();
                  setOpen(false);
                } catch (err) {
                  if (isFrameworkNavigationError(err)) throw err;
                  setError(err instanceof Error ? err.message : "No se pudo completar la acción. Intentá nuevamente.");
                }
              })
            }
          >
            {pending ? "Procesando…" : confirmTitle.replace(/^¿|\?$/g, "")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

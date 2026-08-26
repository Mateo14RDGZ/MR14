"use client";

import { useState, useTransition } from "react";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

export function ConfirmButton({
  action,
  label,
  confirmTitle = "¿Confirmar acción?",
  confirmDescription = "Esta acción no se puede deshacer.",
  variant = "danger",
  size = "sm",
  className,
}: {
  action: () => Promise<void> | void;
  label: React.ReactNode;
  confirmTitle?: string;
  confirmDescription?: string;
  variant?: "danger" | "primary" | "secondary" | "ghost" | "outline";
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
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fade-in"
          onClick={() => {
            if (pending) return;
            setOpen(false);
            setError(null);
          }}
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-xl border border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 text-danger">
              <AlertTriangle size={18} />
              <p className="text-sm font-semibold text-foreground">{confirmTitle}</p>
            </div>
            <p className="mb-5 text-sm text-muted">{confirmDescription}</p>
            {error && (
              <p className="mb-4 rounded-lg border border-danger/30 bg-danger-soft/20 px-3 py-2 text-sm text-danger">
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
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    try {
                      await action();
                      setOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
                    }
                  })
                }
              >
                {pending ? "Procesando…" : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

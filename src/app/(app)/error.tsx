"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle size={28} className="text-warning" />
      <p className="text-sm text-muted">No pudimos cargar esta sección.</p>
      <Button size="sm" variant="secondary" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}

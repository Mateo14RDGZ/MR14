"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-4">
      <AlertTriangle size={28} className="text-warning" />
      <p className="text-sm text-muted">No pudimos cargar esta información.</p>
      <Button size="sm" variant="secondary" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}

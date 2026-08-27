"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";
import { upsertHostingAction } from "@/actions/infra";
import type { HostingRow } from "@/lib/types";
import { Link2 } from "lucide-react";

/**
 * Foco único: el link temporal de la versión en desarrollo, que el
 * cliente puede ver desde el portal antes de que el proyecto esté
 * entregado. Reutiliza hosting.preview_url (ya existe en el modelo) en
 * vez de agregar una columna nueva — por eso, si ya hay una fila de
 * hosting con otros datos cargados (plataforma, producción, etc.), se
 * preservan como campos ocultos para no pisarlos.
 */
export function DevLinkCard({
  projectId,
  clientId,
  hosting,
}: {
  projectId: string;
  clientId: string;
  hosting: HostingRow | null;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(hosting?.preview_url ?? "");

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertHostingAction(projectId, clientId, formData, hosting?.id);
      if (result?.error) toast.error(result.error);
      else toast.success("Link de desarrollo actualizado.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-card-title">
          <Link2 size={16} className="text-accent" /> Link temporal de desarrollo
        </h2>
        <p className="mt-0.5 text-caption">El cliente lo ve en su portal mientras el proyecto no está entregado.</p>
      </CardHeader>
      <CardBody>
        <form action={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="mb-0 flex-1">
            <Label>URL</Label>
            <Input
              name="preview_url"
              type="url"
              placeholder="https://mi-proyecto.vercel.app"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Field>
          {/* Preserva el resto de la fila de hosting (si existe) al hacer upsert. */}
          <input type="hidden" name="platform" value={hosting?.platform ?? "vercel"} />
          <input type="hidden" name="project_name" value={hosting?.project_name ?? ""} />
          <input type="hidden" name="production_url" value={hosting?.production_url ?? ""} />
          <input type="hidden" name="account" value={hosting?.account ?? ""} />
          <input type="hidden" name="team" value={hosting?.team ?? ""} />
          <input type="hidden" name="created_date" value={hosting?.created_date ?? ""} />
          <input type="hidden" name="plan" value={hosting?.plan ?? ""} />
          <input type="hidden" name="notes" value={hosting?.notes ?? ""} />
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

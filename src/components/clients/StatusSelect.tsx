"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Input";
import { updateClientStatusAction } from "@/actions/clients";
import { updateProjectStatusAction } from "@/actions/projects";
import type { ClientStatus, ProjectStatus } from "@/lib/types";

export function StatusSelect({
  clientId,
  currentStatus,
  options,
}: {
  clientId: string;
  currentStatus: string;
  options: { value: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value as ClientStatus;
        startTransition(async () => {
          try {
            await updateClientStatusAction(clientId, value);
            toast.success("Estado actualizado.");
          } catch {
            toast.error("No se pudo actualizar el estado.");
          }
        });
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

export function ProjectStatusSelect({
  projectId,
  clientId,
  currentStatus,
  options,
}: {
  projectId: string;
  clientId: string;
  currentStatus: string;
  options: { value: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value as ProjectStatus;
        startTransition(async () => {
          try {
            await updateProjectStatusAction(projectId, clientId, value);
            toast.success("Estado actualizado.");
          } catch {
            toast.error("No se pudo actualizar el estado.");
          }
        });
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  toggleChecklistItemAction,
  addChecklistItemAction,
  deleteChecklistItemAction,
} from "@/actions/checklist";
import type { TaskRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Checklist({
  projectId,
  clientId,
  tasks,
}: {
  projectId: string;
  clientId: string;
  tasks: TaskRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState("");
  const done = tasks.filter((t) => t.is_done).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium">Entrega {percent}% completada</p>
        <span className="text-xs text-muted-2">{done}/{tasks.length}</span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mb-4 space-y-1.5">
        {tasks.map((t) => (
          <li key={t.id} className="group flex items-center gap-2">
            <button
              onClick={() =>
                startTransition(async () => {
                  await toggleChecklistItemAction(t.id, projectId, clientId, !t.is_done);
                })
              }
              disabled={pending}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                t.is_done ? "border-accent bg-accent text-accent-foreground" : "border-border"
              )}
            >
              {t.is_done && <Check size={12} strokeWidth={3} />}
            </button>
            <span className={cn("flex-1 text-sm", t.is_done && "text-muted-2 line-through")}>{t.label}</span>
            <button
              onClick={() =>
                startTransition(async () => {
                  await deleteChecklistItemAction(t.id, projectId, clientId);
                })
              }
              className="text-muted-2 transition-colors hover:text-danger"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newLabel.trim()) return;
          startTransition(async () => {
            await addChecklistItemAction(projectId, clientId, newLabel.trim());
            setNewLabel("");
          });
        }}
        className="flex gap-2"
      >
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Agregar ítem…"
          className="h-9"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          <Plus size={14} />
        </Button>
      </form>
    </div>
  );
}

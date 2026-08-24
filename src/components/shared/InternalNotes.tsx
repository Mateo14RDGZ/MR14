"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/Empty";
import { createInternalNoteAction, updateInternalNoteAction, deleteInternalNoteAction } from "@/actions/notes";
import { formatDateTime } from "@/lib/utils";
import { StickyNote, Pencil, Trash2, Lock } from "lucide-react";

interface NoteRow {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null } | null;
}

export function InternalNotes({
  notes,
  clientId,
  projectId,
}: {
  notes: NoteRow[];
  clientId: string;
  projectId?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const target = { clientId, projectId: projectId ?? null };

  function submitNew() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("content", draft);
      const result = await createInternalNoteAction(target, fd);
      if (result?.error) toast.error(result.error);
      else setDraft("");
    });
  }

  function submitEdit(id: string) {
    startTransition(async () => {
      try {
        await updateInternalNoteAction(id, target, editValue);
        setEditingId(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo editar la nota.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-2">
        <Lock size={12} /> Solo visible para MR14. El cliente nunca ve esta sección.
      </div>

      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ej: Prefiere WhatsApp. Explicarle los documentos de forma simple."
          rows={2}
        />
        <Button size="sm" disabled={pending || !draft.trim()} onClick={submitNew}>
          Agregar nota
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Sin notas internas todavía" />
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={pending} onClick={() => submitEdit(n.id)}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-line break-words">{n.content}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-2">
                    <span className="min-w-0">
                      {n.profiles?.full_name || "MR14"} · {formatDateTime(n.updated_at || n.created_at)}
                      {n.updated_at !== n.created_at ? " (editada)" : ""}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(n.id);
                          setEditValue(n.content);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-2 hover:bg-surface-2 hover:text-foreground"
                      >
                        <Pencil size={13} />
                      </button>
                      <ConfirmButton
                        action={() => deleteInternalNoteAction(n.id, target)}
                        label={<Trash2 size={13} />}
                        variant="ghost"
                        size="icon"
                        confirmTitle="¿Eliminar nota?"
                      />
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

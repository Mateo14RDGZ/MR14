"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/Empty";
import { createQuickReplyAction, updateQuickReplyAction, deleteQuickReplyAction } from "@/actions/quickReplies";
import type { QuickReply } from "@/lib/types";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";

export function QuickRepliesManager({ replies }: { replies: QuickReply[] }) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function submitNew() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("text", draft);
      const result = await createQuickReplyAction(fd);
      if (result?.error) toast.error(result.error);
      else setDraft("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ej: El cambio ya quedó realizado."
          rows={2}
        />
        <Button size="sm" disabled={pending || !draft.trim()} onClick={submitNew}>
          Agregar plantilla
        </Button>
      </div>

      {replies.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="Sin plantillas todavía" />
      ) : (
        <ul className="space-y-2">
          {replies.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
              {editingId === r.id ? (
                <div className="space-y-2">
                  <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          try {
                            await updateQuickReplyAction(r.id, editValue);
                            setEditingId(null);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "No se pudo editar.");
                          }
                        })
                      }
                    >
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-line break-words">{r.text}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditValue(r.text);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-2 hover:bg-surface-2 hover:text-foreground"
                    >
                      <Pencil size={13} />
                    </button>
                    <ConfirmButton
                      action={() => deleteQuickReplyAction(r.id)}
                      label={<Trash2 size={13} />}
                      variant="ghost"
                      size="icon"
                      confirmTitle="¿Eliminar plantilla?"
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

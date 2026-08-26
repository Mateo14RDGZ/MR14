"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";
import { renameDocumentAction } from "@/actions/documents";
import { Pencil } from "lucide-react";

export function RenameDocumentButton({ id, clientId, name }: { id: string; clientId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const newName = String(formData.get("name") || "").trim();
    if (!newName) return;
    startTransition(async () => {
      try {
        await renameDocumentAction(id, clientId, newName);
        toast.success("Documento renombrado.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo renombrar.");
      }
    });
  }

  return (
    <>
      <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil size={14} />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Renombrar documento">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Nombre</Label>
            <Input name="name" value={value} onChange={(e) => setValue(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={pending || !value.trim()} className="w-full">
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}

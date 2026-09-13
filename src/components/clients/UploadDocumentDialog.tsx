"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, Field } from "@/components/ui/Input";
import { uploadDocumentAction } from "@/actions/documents";
import { Upload } from "lucide-react";

const CATEGORIES = [
  "contrato","comprobante_anticipo","comprobante_saldo","guia_trabajo",
  "factura","doc_tecnica","credenciales","entrega_final","otro",
];

export function UploadDocumentDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const file = formData.get("file");
    if (file instanceof File && file.size > 3 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 3 MB.");
      return;
    }
    const projectId = String(formData.get("project_id") || "") || null;
    startTransition(async () => {
      try {
        const result = await uploadDocumentAction(clientId, projectId, formData);
        if (result?.error) toast.error(result.error);
        else { toast.success("Documento subido."); setOpen(false); }
      } catch { toast.error("No pudimos subir el documento. Revisá tu conexión e intentá nuevamente."); }
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Upload size={14} /> Subir documento
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Subir documento">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Archivo *</Label>
            <Input type="file" name="file" required accept=".pdf,.png,.jpg,.jpeg,.webp" />
            <p className="mt-1 text-xs text-muted">PDF o imagen, hasta 3 MB.</p>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Categoría</Label>
              <Select name="category" defaultValue="otro">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="mb-0">
              <Label>Visibilidad</Label>
              <Select name="visibility" defaultValue="internal">
                <option value="internal">Solo MR14</option>
                <option value="client">Visible para el cliente</option>
              </Select>
            </Field>
          </div>
          {projects.length > 0 && (
            <Field className="mb-0">
              <Label>Proyecto (opcional)</Label>
              <Select name="project_id" defaultValue="">
                <option value="">Sin asociar</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field className="mb-0">
            <Label>Etiquetas (separadas por coma)</Label>
            <Input name="tags" placeholder="entrega, técnico" />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Subiendo…" : "Subir"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}

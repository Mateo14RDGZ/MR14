"use client";
import { useId, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

export function TicketAttachments({ disabled = false }: { disabled?: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  return <div className="space-y-2">
    <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium"><Paperclip size={16} /> Agregar fotos o PDF <span className="font-normal text-muted">(opcional)</span></label>
    <input ref={input} id={id} type="file" name="files" multiple disabled={disabled}
      accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
      onChange={event => {
        const files = Array.from(event.target.files ?? []);
        const error = files.length > 5 ? "Elegí hasta 5 archivos." : files.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024 ? "Los archivos superan los 3 MB. Elegí menos archivos o una foto más pequeña." : "";
        event.target.setCustomValidity(error);
        if (error) event.target.reportValidity();
        setNames(files.map(file => file.name));
      }}
      className="block min-h-11 w-full min-w-0 text-sm text-muted file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:font-medium file:text-foreground" />
    <p className="text-xs text-muted">Hasta 5 archivos, con un máximo de 3 MB en total.</p>
    {names.length > 0 && <div className="flex items-start justify-between gap-2 rounded-lg bg-surface-2 p-3">
      <ul className="min-w-0 space-y-1 text-sm">{names.map((name, index) => <li key={index} className="break-all">{name}</li>)}</ul>
      <button type="button" disabled={disabled} aria-label="Quitar los archivos seleccionados" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-surface-3" onClick={() => {
        if (input.current) { input.current.value = ""; input.current.setCustomValidity(""); }
        setNames([]);
      }}><X size={18} /></button>
    </div>}
  </div>;
}

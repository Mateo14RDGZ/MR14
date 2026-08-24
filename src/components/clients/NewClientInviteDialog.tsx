"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";
import { createClientRegistrationLinkAction } from "@/actions/members";
import { UserPlus, MessageCircle, Mail, Copy, Check } from "lucide-react";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function NewClientInviteDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");

  function close() {
    setOpen(false);
    setLink(null);
    setCopied(false);
    setPhone("");
  }

  function generate() {
    startTransition(async () => {
      const result = await createClientRegistrationLinkAction();
      if (result?.error) toast.error(result.error);
      else if (result?.link) setLink(result.link);
    });
  }

  const message = `Hola! Te comparto el link para registrarte como cliente de MR14. Completá tus datos y creá tu acceso: ${link ?? ""}`;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={16} /> Invitar cliente
      </Button>
      <Dialog open={open} onClose={close} title={link ? "Enviar invitación" : "Invitar nuevo cliente"}>
        {!link ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Se genera un link único para que el prospecto complete los datos de su negocio y cree su propia
              cuenta. Vos lo aprobás después desde su ficha en Clientes.
            </p>
            <Button type="button" disabled={pending} className="w-full" onClick={generate}>
              {pending ? "Generando…" : "Generar link de invitación"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">Listo. Mandale este link al prospecto para que se registre.</p>

            <Field className="mb-0">
              <Label>WhatsApp del contacto (opcional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XXXXXXXX" />
            </Field>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <a
                href={`https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={onlyDigits(phone).length < 8 ? "pointer-events-none opacity-40" : ""}
              >
                <Button type="button" variant="secondary" className="w-full">
                  <MessageCircle size={14} /> WhatsApp
                </Button>
              </a>
              <a href={`mailto:?subject=${encodeURIComponent("Registrate como cliente de MR14")}&body=${encodeURIComponent(message)}`}>
                <Button type="button" variant="secondary" className="w-full">
                  <Mail size={14} /> Email
                </Button>
              </a>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  toast.success("Link copiado.");
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} Copiar
              </Button>
            </div>

            <Button type="button" variant="ghost" className="w-full" onClick={close}>
              Listo
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}

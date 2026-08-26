"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Select, Label, Field, Input } from "@/components/ui/Input";
import { createInvitationLinkAction } from "@/actions/members";
import { toWhatsAppNumber, isValidWhatsAppNumber } from "@/lib/utils";
import { UserPlus, MessageCircle, Mail, Copy, Check } from "lucide-react";

export function InviteMemberDialog({
  clientId,
  businessName,
  defaultPhone,
}: {
  clientId: string;
  businessName: string;
  defaultPhone?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(defaultPhone ?? "");

  function close() {
    setOpen(false);
    setLink(null);
    setCopied(false);
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createInvitationLinkAction(clientId, formData);
      if (result?.error) toast.error(result.error);
      else if (result?.link) setLink(result.link);
    });
  }

  const message = `Hola! Te comparto el acceso al Portal MR14 de ${businessName}. Entrá a este link y completá tus datos para crear tu cuenta: ${link ?? ""}`;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus size={14} /> Invitar usuario
      </Button>
      <Dialog open={open} onClose={close} title={link ? "Enviar invitación" : "Invitar usuario al portal"}>
        {!link ? (
          <form action={onSubmit} className="space-y-4">
            <Field className="mb-0">
              <Label>Rol dentro del cliente</Label>
              <Select name="role_in_client" defaultValue="owner">
                <option value="owner">Titular</option>
                <option value="colaborador">Colaborador</option>
              </Select>
            </Field>
            <p className="text-xs text-muted-2">
              Se genera un link único. El cliente lo abre, completa sus propios datos (nombre, email, teléfono) y
              crea su contraseña — la cuenta se crea sola en ese momento.
            </p>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Generando…" : "Generar link de invitación"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Listo. Mandale este link a <span className="text-foreground">{businessName}</span> para que complete
              sus datos y cree su cuenta.
            </p>

            <Field className="mb-0">
              <Label>WhatsApp del cliente</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XXXXXXXX" />
            </Field>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <a
                href={`https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={!isValidWhatsAppNumber(phone) ? "pointer-events-none opacity-40" : ""}
              >
                <Button type="button" variant="secondary" className="w-full">
                  <MessageCircle size={14} /> WhatsApp
                </Button>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Acceso al Portal MR14 · ${businessName}`)}&body=${encodeURIComponent(message)}`}
              >
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

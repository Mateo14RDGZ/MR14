"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, Field } from "@/components/ui/Input";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/Empty";
import {
  upsertDomainAction,
  deleteDomainAction,
  upsertHostingAction,
  deleteHostingAction,
  upsertRepositoryAction,
  deleteRepositoryAction,
  upsertDatabaseAction,
  deleteDatabaseAction,
} from "@/actions/infra";
import type { DomainRow, HostingRow, RepositoryRow, DatabaseRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Globe, Server, GitBranch, Database, Plus, Trash2 } from "lucide-react";

function SectionShell({
  icon: Icon,
  title,
  onAdd,
  children,
}: {
  icon: React.ElementType;
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-accent" />
          <h2 className="text-card-title">{title}</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={onAdd}>
          <Plus size={14} />
        </Button>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// ---------------- DOMAINS ----------------
export function DomainsSection({
  projectId,
  clientId,
  domains,
}: {
  projectId: string;
  clientId: string;
  domains: DomainRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertDomainAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else setOpen(false);
    });
  }

  return (
    <SectionShell icon={Globe} title="Dominio" onAdd={() => setOpen(true)}>
      {domains.length === 0 ? (
        <EmptyState icon={Globe} title="Sin dominio registrado" />
      ) : (
        <div className="space-y-3">
          {domains.map((d) => (
            <div key={d.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="break-all font-medium">{d.domain}</p>
                <ConfirmButton
                  action={() => deleteDomainAction(d.id, projectId, clientId)}
                  label={<Trash2 size={13} />}
                  variant="ghost"
                  size="icon"
                  confirmTitle="¿Eliminar dominio?"
                />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-muted-2">
                <div>Registrador: {d.registrar || "-"}</div>
                <div>Vence: {formatDate(d.expiry_date)}</div>
                <div>Renovación auto: {d.auto_renew ? "Sí" : "No"}</div>
                <div>Estado: {d.status || "-"}</div>
              </dl>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar dominio">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Dominio *</Label>
            <Input name="domain" required placeholder="ejemplo.com.uy" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Registrador</Label>
              <Input name="registrar" />
            </Field>
            <Field className="mb-0">
              <Label>Titular</Label>
              <Input name="owner_name" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Fecha de compra</Label>
              <Input type="date" name="purchase_date" />
            </Field>
            <Field className="mb-0">
              <Label>Vencimiento</Label>
              <Input type="date" name="expiry_date" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Precio de renovación</Label>
              <Input type="number" name="renewal_price" min={0} />
            </Field>
            <Field className="mb-0 flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="auto_renew" className="h-4 w-4" /> Renovación automática
              </label>
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Nameservers</Label>
            <Input name="nameservers" />
          </Field>
          <Field className="mb-0">
            <Label>Notas DNS</Label>
            <Textarea name="dns_notes" rows={2} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar dominio"}
          </Button>
        </form>
      </Dialog>
    </SectionShell>
  );
}

// ---------------- HOSTING ----------------
export function HostingSection({
  projectId,
  clientId,
  hosting,
}: {
  projectId: string;
  clientId: string;
  hosting: HostingRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertHostingAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else setOpen(false);
    });
  }

  return (
    <SectionShell icon={Server} title="Hosting / Deploy" onAdd={() => setOpen(true)}>
      {hosting.length === 0 ? (
        <EmptyState icon={Server} title="Sin hosting registrado" />
      ) : (
        <div className="space-y-3">
          {hosting.map((h) => (
            <div key={h.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="mb-2 flex items-start justify-between">
                <p className="font-medium capitalize">{h.platform}</p>
                <ConfirmButton
                  action={() => deleteHostingAction(h.id, projectId, clientId)}
                  label={<Trash2 size={13} />}
                  variant="ghost"
                  size="icon"
                  confirmTitle="¿Eliminar hosting?"
                />
              </div>
              <dl className="space-y-1 text-xs text-muted-2">
                <div className="break-all">Producción: {h.production_url || "-"}</div>
                <div className="break-all">Preview: {h.preview_url || "-"}</div>
                <div>Plan: {h.plan || "-"}</div>
              </dl>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar hosting">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Plataforma</Label>
            <Select name="platform" defaultValue="vercel">
              <option value="vercel">Vercel</option>
              <option value="netlify">Netlify</option>
              <option value="cloudflare">Cloudflare</option>
              <option value="hosting_tradicional">Hosting tradicional</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Nombre del proyecto</Label>
              <Input name="project_name" />
            </Field>
            <Field className="mb-0">
              <Label>Plan</Label>
              <Input name="plan" />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>URL de producción</Label>
            <Input name="production_url" placeholder="https://" />
          </Field>
          <Field className="mb-0">
            <Label>URL de preview</Label>
            <Input name="preview_url" placeholder="https://" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Cuenta</Label>
              <Input name="account" />
            </Field>
            <Field className="mb-0">
              <Label>Team</Label>
              <Input name="team" />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar hosting"}
          </Button>
        </form>
      </Dialog>
    </SectionShell>
  );
}

// ---------------- REPOSITORIES ----------------
export function RepositoriesSection({
  projectId,
  clientId,
  repositories,
}: {
  projectId: string;
  clientId: string;
  repositories: RepositoryRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertRepositoryAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else setOpen(false);
    });
  }

  return (
    <SectionShell icon={GitBranch} title="GitHub" onAdd={() => setOpen(true)}>
      {repositories.length === 0 ? (
        <EmptyState icon={GitBranch} title="Sin repositorio registrado" />
      ) : (
        <div className="space-y-3">
          {repositories.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="break-all font-medium">{r.name || r.url}</p>
                <ConfirmButton
                  action={() => deleteRepositoryAction(r.id, projectId, clientId)}
                  label={<Trash2 size={13} />}
                  variant="ghost"
                  size="icon"
                  confirmTitle="¿Eliminar repositorio?"
                />
              </div>
              <dl className="space-y-1 text-xs text-muted-2">
                <div className="break-all">URL: {r.url || "-"}</div>
                <div>Rama principal: {r.main_branch}</div>
                <div>Visibilidad: {r.is_private ? "Privado" : "Público"}</div>
              </dl>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar repositorio">
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Nombre</Label>
              <Input name="name" />
            </Field>
            <Field className="mb-0">
              <Label>Organización</Label>
              <Input name="organization" />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>URL</Label>
            <Input name="url" placeholder="https://github.com/..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>Rama principal</Label>
              <Input name="main_branch" defaultValue="main" />
            </Field>
            <Field className="mb-0 flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_private" defaultChecked className="h-4 w-4" /> Privado
              </label>
            </Field>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar repositorio"}
          </Button>
        </form>
      </Dialog>
    </SectionShell>
  );
}

// ---------------- DATABASES ----------------
export function DatabasesSection({
  projectId,
  clientId,
  databases,
}: {
  projectId: string;
  clientId: string;
  databases: DatabaseRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertDatabaseAction(projectId, clientId, formData);
      if (result?.error) toast.error(result.error);
      else setOpen(false);
    });
  }

  return (
    <SectionShell icon={Database} title="Base de datos" onAdd={() => setOpen(true)}>
      {databases.length === 0 ? (
        <EmptyState icon={Database} title="Sin base de datos registrada" />
      ) : (
        <div className="space-y-3">
          {databases.map((db) => (
            <div key={db.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="mb-2 flex items-start justify-between">
                <p className="font-medium capitalize">{db.provider}</p>
                <ConfirmButton
                  action={() => deleteDatabaseAction(db.id, projectId, clientId)}
                  label={<Trash2 size={13} />}
                  variant="ghost"
                  size="icon"
                  confirmTitle="¿Eliminar base de datos?"
                />
              </div>
              <dl className="space-y-1 text-xs text-muted-2">
                <div className="break-all">Proyecto: {db.project_name || "-"}</div>
                <div>Región: {db.region || "-"}</div>
              </dl>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar base de datos">
        <form action={onSubmit} className="space-y-4">
          <Field className="mb-0">
            <Label>Proveedor</Label>
            <Select name="provider" defaultValue="supabase">
              <option value="supabase">Supabase</option>
              <option value="firebase">Firebase</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          <Field className="mb-0">
            <Label>Nombre del proyecto</Label>
            <Input name="project_name" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field className="mb-0">
              <Label>URL</Label>
              <Input name="url" />
            </Field>
            <Field className="mb-0">
              <Label>Región</Label>
              <Input name="region" />
            </Field>
          </div>
          <Field className="mb-0">
            <Label>Notas</Label>
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Guardando…" : "Guardar base de datos"}
          </Button>
        </form>
      </Dialog>
    </SectionShell>
  );
}

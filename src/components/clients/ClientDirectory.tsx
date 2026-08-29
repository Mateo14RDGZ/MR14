"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Users, ChevronRight, UserCheck } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Empty";
import { CLIENT_STATUSES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import type { ClientHealth } from "@/lib/queries";

export interface ClientDirectoryItem {
  id: string;
  business_name: string;
  contact_name: string | null;
  city: string | null;
  status: string;
  logo_url: string | null;
  created_at: string;
  pendingApproval: boolean;
  health: ClientHealth;
}

const HEALTH_DOT: Record<ClientHealth, string> = {
  bien: "bg-success",
  atencion: "bg-warning",
  riesgo: "bg-danger",
};

const HEALTH_LABEL: Record<ClientHealth, string> = {
  bien: "Bien",
  atencion: "Atención",
  riesgo: "Riesgo",
};

const HEALTH_WEIGHT: Record<ClientHealth, number> = { bien: 0, atencion: 1, riesgo: 2 };

function HealthStatus({ health }: { health: ClientHealth }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_DOT[health]}`} />
      {HEALTH_LABEL[health]}
    </span>
  );
}

export function ClientDirectory({ clients }: { clients: ClientDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("priority");

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    const filtered = normalized
      ? clients.filter((client) =>
          [client.business_name, client.contact_name, client.city]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase("es").includes(normalized))
        )
      : [...clients];

    return filtered.sort((a, b) => {
      if (sort === "name") return a.business_name.localeCompare(b.business_name, "es");
      if (sort === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (a.pendingApproval !== b.pendingApproval) return a.pendingApproval ? -1 : 1;
      return HEALTH_WEIGHT[b.health] - HEALTH_WEIGHT[a.health];
    });
  }, [clients, query, sort]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="relative">
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
          <Input
            aria-label="Buscar clientes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, contacto o ciudad"
            className="pl-9"
          />
        </div>
        <Select aria-label="Ordenar clientes" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="priority">Prioridad</option>
          <option value="name">Nombre</option>
          <option value="recent">Más recientes</option>
        </Select>
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No encontramos clientes"
          description="Probá con otro nombre, contacto o ciudad."
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-label">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Contacto</th>
                  <th className="px-5 py-3 font-medium">Salud</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Alta</th>
                  <th className="w-8 px-5 py-3"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const statusLabel = CLIENT_STATUSES.find((status) => status.value === client.status)?.label ?? client.status;
                  const href = client.pendingApproval ? `/clients/${client.id}?tab=members` : `/clients/${client.id}`;
                  return (
                    <tr key={client.id} className="group border-b border-border last:border-0">
                      <td className="p-0">
                        <Link href={href} className="flex items-center gap-3 px-5 py-3.5">
                          <Avatar name={client.business_name} logoUrl={client.logo_url} size="sm" />
                          <span className="truncate font-medium">{client.business_name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{client.contact_name ?? "—"}</td>
                      <td className="px-5 py-3.5"><HealthStatus health={client.health} /></td>
                      <td className="px-5 py-3.5">
                        {client.pendingApproval ? (
                          <Badge tone="warning"><UserCheck size={12} /> Solicitud pendiente</Badge>
                        ) : (
                          <Badge tone={statusTone(client.status, "client")}>{statusLabel}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-2">{formatDate(client.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={href} aria-label={`Abrir ${client.business_name}`}>
                          <ChevronRight size={16} className="text-muted-2 transition-colors group-hover:text-foreground" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="space-y-2.5 sm:hidden">
            {filteredClients.map((client) => {
              const statusLabel = CLIENT_STATUSES.find((status) => status.value === client.status)?.label ?? client.status;
              const href = client.pendingApproval ? `/clients/${client.id}?tab=members` : `/clients/${client.id}`;
              return (
                <Link key={client.id} href={href}>
                  <Card className="flex items-center gap-3 p-4">
                    <Avatar name={client.business_name} logoUrl={client.logo_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{client.business_name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <HealthStatus health={client.health} />
                        <span aria-hidden="true" className="text-muted-2">·</span>
                        <span className="truncate text-xs text-muted-2">{client.contact_name ?? "Sin contacto"}</span>
                      </div>
                    </div>
                    {client.pendingApproval ? (
                      <Badge tone="warning"><UserCheck size={12} /> Pendiente</Badge>
                    ) : (
                      <Badge tone={statusTone(client.status, "client")}>{statusLabel}</Badge>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

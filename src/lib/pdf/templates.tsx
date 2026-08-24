import { PdfPage, PdfHeader, Section, InfoRow, styles } from "./shared";
import { Text, View } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  Client,
  Project,
  DomainRow,
  HostingRow,
  RepositoryRow,
  DatabaseRow,
  CredentialRow,
} from "@/lib/types";

interface InfraBundle {
  domains: DomainRow[];
  hosting: HostingRow[];
  repositories: RepositoryRow[];
  databases: DatabaseRow[];
}

export function FichaTecnicaDoc({
  client,
  project,
  infra,
}: {
  client: Client;
  project: Project;
  infra: InfraBundle;
}) {
  const domain = infra.domains[0];
  const hosting = infra.hosting[0];
  const repo = infra.repositories[0];
  const db = infra.databases[0];

  return (
    <PdfPage>
      <PdfHeader docTitle="Ficha técnica del proyecto" subtitle={`${client.business_name} — ${project.name}`} />

      <Section title="Cliente">
        <InfoRow label="Nombre comercial" value={client.business_name} />
        <InfoRow label="Responsable" value={client.contact_name} />
        <InfoRow label="Email" value={client.email} />
        <InfoRow label="Teléfono / WhatsApp" value={client.whatsapp || client.phone} />
      </Section>

      <Section title="Proyecto">
        <InfoRow label="Nombre" value={project.name} />
        <InfoRow label="Tipo" value={project.type} />
        <InfoRow label="Descripción" value={project.description} />
        <InfoRow label="Fecha de inicio" value={formatDate(project.start_date)} />
        <InfoRow label="Fecha de entrega" value={formatDate(project.actual_delivery_date || project.estimated_delivery_date)} />
        <InfoRow label="Estado" value={project.status} />
        <InfoRow label="Precio" value={formatCurrency(project.price, project.currency)} />
      </Section>

      <Section title="Stack e infraestructura">
        <InfoRow label="Dominio" value={domain?.domain} />
        <InfoRow label="Hosting" value={hosting ? `${hosting.platform} — ${hosting.production_url ?? ""}` : null} />
        <InfoRow label="Repositorio" value={repo?.url ?? repo?.name} />
        <InfoRow label="Base de datos" value={db ? `${db.provider} — ${db.project_name ?? ""}` : null} />
      </Section>

      <Section title="URLs">
        <InfoRow label="Producción" value={hosting?.production_url} />
        <InfoRow label="Preview" value={hosting?.preview_url} />
        <InfoRow label="Sitio del cliente" value={client.website} />
      </Section>
    </PdfPage>
  );
}

export function EntregaDoc({
  client,
  project,
  infra,
  accessesDelivered,
  responsible,
}: {
  client: Client;
  project: Project;
  infra: InfraBundle;
  accessesDelivered: string[];
  responsible: string;
}) {
  const domain = infra.domains[0];
  const hosting = infra.hosting[0];
  const repo = infra.repositories[0];

  return (
    <PdfPage>
      <PdfHeader docTitle="Entrega del proyecto" subtitle={`${client.business_name} — ${project.name}`} />

      <Section title="Información del sitio">
        <InfoRow label="Cliente" value={client.business_name} />
        <InfoRow label="Proyecto" value={project.name} />
        <InfoRow label="Fecha de entrega" value={formatDate(project.actual_delivery_date || new Date().toISOString())} />
        <InfoRow label="Responsable de la entrega" value={responsible} />
      </Section>

      <Section title="URLs">
        <InfoRow label="Producción" value={hosting?.production_url} />
        <InfoRow label="Dominio" value={domain?.domain} />
      </Section>

      <Section title="Infraestructura entregada">
        <InfoRow label="Hosting" value={hosting?.platform} />
        <InfoRow label="Repositorio" value={repo?.url} />
      </Section>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos entregados</Text>
        {accessesDelivered.length === 0 && <Text style={styles.value}>Información no disponible</Text>}
        {accessesDelivered.map((a, i) => (
          <Text key={i} style={{ ...styles.value, marginBottom: 4 }}>
            • {a}
          </Text>
        ))}
      </View>
    </PdfPage>
  );
}

export function InfraestructuraDoc({
  client,
  project,
  infra,
}: {
  client: Client;
  project: Project;
  infra: InfraBundle;
}) {
  return (
    <PdfPage>
      <PdfHeader docTitle="Documentación de infraestructura" subtitle={`${client.business_name} — ${project.name}`} />

      {infra.domains.map((d) => (
        <Section key={d.id} title={`Dominio — ${d.domain}`}>
          <InfoRow label="Registrador" value={d.registrar} />
          <InfoRow label="Titular" value={d.owner_name} />
          <InfoRow label="Fecha de compra" value={formatDate(d.purchase_date)} />
          <InfoRow label="Vencimiento" value={formatDate(d.expiry_date)} />
          <InfoRow label="Renovación automática" value={d.auto_renew ? "Sí" : "No"} />
          <InfoRow label="Nameservers" value={d.nameservers} />
          <InfoRow label="DNS" value={d.dns_notes} />
        </Section>
      ))}

      {infra.hosting.map((h) => (
        <Section key={h.id} title={`Hosting — ${h.platform}`}>
          <InfoRow label="Proyecto" value={h.project_name} />
          <InfoRow label="URL producción" value={h.production_url} />
          <InfoRow label="URL preview" value={h.preview_url} />
          <InfoRow label="Cuenta" value={h.account} />
          <InfoRow label="Team" value={h.team} />
          <InfoRow label="Plan" value={h.plan} />
        </Section>
      ))}

      {infra.repositories.map((r) => (
        <Section key={r.id} title={`GitHub — ${r.name ?? "repositorio"}`}>
          <InfoRow label="Organización" value={r.organization} />
          <InfoRow label="Rama principal" value={r.main_branch} />
          <InfoRow label="URL" value={r.url} />
          <InfoRow label="Visibilidad" value={r.is_private ? "Privado" : "Público"} />
        </Section>
      ))}

      {infra.databases.map((db) => (
        <Section key={db.id} title={`Base de datos — ${db.provider}`}>
          <InfoRow label="Proyecto" value={db.project_name} />
          <InfoRow label="URL" value={db.url} />
          <InfoRow label="Región" value={db.region} />
          <InfoRow label="Notas" value={db.notes} />
        </Section>
      ))}

      {infra.domains.length + infra.hosting.length + infra.repositories.length + infra.databases.length === 0 && (
        <Text style={styles.value}>Información no disponible: no hay infraestructura registrada para este proyecto.</Text>
      )}
    </PdfPage>
  );
}

export function CredencialesDoc({
  client,
  credentials,
}: {
  client: Client;
  credentials: (CredentialRow & { plainSecret: string })[];
}) {
  return (
    <PdfPage>
      <PdfHeader docTitle="Credenciales del cliente" subtitle={client.business_name} />

      <View style={styles.confidentialBanner}>
        <Text style={styles.confidentialText}>
          DOCUMENTO CONFIDENCIAL — No compartas este documento sin autorización del cliente.
        </Text>
      </View>

      {credentials.map((c) => (
        <Section key={c.id} title={c.service_label || c.service}>
          <InfoRow label="Usuario / email" value={c.username} />
          <InfoRow label="Contraseña" value={c.plainSecret} />
          <InfoRow label="URL de acceso" value={c.access_url} />
          <InfoRow label="Última actualización" value={formatDate(c.last_updated)} />
          <InfoRow label="Notas" value={c.notes} />
        </Section>
      ))}

      {credentials.length === 0 && <Text style={styles.value}>No se seleccionaron credenciales.</Text>}
    </PdfPage>
  );
}

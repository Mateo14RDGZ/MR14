import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import {
  FichaTecnicaDoc,
  EntregaDoc,
  InfraestructuraDoc,
  CredencialesDoc,
} from "@/lib/pdf/templates";
import type { Client, Project } from "@/lib/types";

async function loadInfra(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  const [domains, hosting, repositories, databases] = await Promise.all([
    supabase.from("domains").select("*").eq("project_id", projectId),
    supabase.from("hosting").select("*").eq("project_id", projectId),
    supabase.from("repositories").select("*").eq("project_id", projectId),
    supabase.from("project_databases").select("*").eq("project_id", projectId),
  ]);
  return {
    domains: domains.data ?? [],
    hosting: hosting.data ?? [],
    repositories: repositories.data ?? [],
    databases: databases.data ?? [],
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");

  if (!type || !clientId) {
    return NextResponse.json({ error: "Faltan parámetros type/clientId." }, { status: 400 });
  }

  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single();
  if (!client) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  let pdfBuffer: Buffer;
  let filename = "documento-mr14.pdf";

  if (type === "credenciales") {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    let query = supabase.from("credentials").select("*").eq("client_id", clientId);
    if (ids.length > 0) query = query.in("id", ids);
    const { data: creds } = await query;

    const withPlain = (creds ?? []).map((c) => ({
      ...c,
      plainSecret: (() => {
        try {
          return decryptSecret(c.secret_encrypted);
        } catch {
          return "(no se pudo descifrar)";
        }
      })(),
    }));

    pdfBuffer = await renderToBuffer(
      <CredencialesDoc client={client as Client} credentials={withPlain} />
    );
    filename = `MR14-credenciales-${client.business_name}.pdf`;
  } else {
    if (!projectId) {
      return NextResponse.json({ error: "Falta projectId." }, { status: 400 });
    }
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (!project) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    const infra = await loadInfra(supabase, projectId);

    if (type === "ficha-tecnica") {
      pdfBuffer = await renderToBuffer(
        <FichaTecnicaDoc client={client as Client} project={project as Project} infra={infra} />
      );
      filename = `MR14-ficha-tecnica-${project.name}.pdf`;
    } else if (type === "entrega") {
      const accesses: string[] = [];
      if (infra.hosting[0]?.production_url) accesses.push(`Acceso al hosting (${infra.hosting[0].platform})`);
      if (infra.repositories[0]?.url) accesses.push(`Acceso al repositorio (${infra.repositories[0].url})`);
      if (infra.domains[0]?.domain) accesses.push(`Gestión del dominio ${infra.domains[0].domain}`);
      pdfBuffer = await renderToBuffer(
        <EntregaDoc
          client={client as Client}
          project={project as Project}
          infra={infra}
          accessesDelivered={accesses}
          responsible="Mateo Rodríguez · MR14"
        />
      );
      filename = `MR14-entrega-${project.name}.pdf`;
    } else if (type === "infraestructura") {
      pdfBuffer = await renderToBuffer(
        <InfraestructuraDoc client={client as Client} project={project as Project} infra={infra} />
      );
      filename = `MR14-infraestructura-${project.name}.pdf`;
    } else {
      return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
    }
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/[^\w.\- ]/g, "")}"`,
    },
  });
}

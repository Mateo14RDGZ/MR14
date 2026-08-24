import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const like = `%${q}%`;

  const [clients, projects, domains, repositories, documents, tickets] = await Promise.all([
    supabase.from("clients").select("id,business_name,contact_name").ilike("business_name", like).limit(5),
    supabase.from("projects").select("id,name,client_id").ilike("name", like).limit(5),
    supabase.from("domains").select("id,domain,project_id").ilike("domain", like).limit(5),
    supabase.from("repositories").select("id,name,project_id,url").ilike("name", like).limit(5),
    supabase.from("documents").select("id,name,client_id").ilike("name", like).limit(5),
    supabase
      .from("tickets")
      .select("id,number,subject,clients(business_name)")
      .or(`subject.ilike.${like},number.ilike.${like}`)
      .limit(5),
  ]);

  const results = [
    ...(clients.data ?? []).map((c) => ({
      type: "client",
      id: c.id,
      title: c.business_name,
      subtitle: c.contact_name ?? "Cliente",
      href: `/clients/${c.id}`,
    })),
    ...(projects.data ?? []).map((p) => ({
      type: "project",
      id: p.id,
      title: p.name,
      subtitle: "Proyecto",
      href: `/projects/${p.id}`,
    })),
    ...(domains.data ?? []).map((d) => ({
      type: "domain",
      id: d.id,
      title: d.domain,
      subtitle: "Dominio",
      href: `/projects/${d.project_id}`,
    })),
    ...(repositories.data ?? []).map((r) => ({
      type: "repository",
      id: r.id,
      title: r.name ?? r.url ?? "Repositorio",
      subtitle: "Repositorio GitHub",
      href: `/projects/${r.project_id}`,
    })),
    ...(documents.data ?? []).map((d) => ({
      type: "document",
      id: d.id,
      title: d.name,
      subtitle: "Documento",
      href: `/clients/${d.client_id}`,
    })),
    ...(tickets.data ?? []).map((t) => ({
      type: "ticket",
      id: t.id,
      title: `#${t.number} ${t.subject}`,
      subtitle: (t.clients as { business_name?: string } | null)?.business_name ?? "Ticket",
      href: `/support/${t.id}`,
    })),
  ];

  return NextResponse.json({ results });
}

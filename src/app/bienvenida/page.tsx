import { redirect } from "next/navigation";
import { WelcomeAnimation } from "@/components/auth/WelcomeAnimation";

// Solo rutas internas: nunca redirigir a un dominio externo desde un query param.
function safeDest(dest?: string) {
  if (!dest || !dest.startsWith("/") || dest.startsWith("//")) return "/portal";
  return dest;
}

export default async function BienvenidaPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string; logo?: string; name?: string; clientId?: string }>;
}) {
  const params = await searchParams;
  const dest = safeDest(params.dest);

  // Si por algún motivo llegan sin logo (link directo, etc.), no hay nada
  // que animar: seguir de largo al destino.
  if (!params.logo || !params.clientId) redirect(dest);

  return <WelcomeAnimation clientId={params.clientId} logo={params.logo} name={params.name ?? ""} dest={dest} />;
}

import { redirect } from "next/navigation";
import { WelcomeAnimation } from "@/components/auth/WelcomeAnimation";
import { getClientBrandTokens } from "@/lib/brand-color-server";
import { brandTokens } from "@/lib/brand-color";

// Solo rutas internas: nunca redirigir a un dominio externo desde un query param.
function safeDest(dest?: string) {
  if (!dest || !dest.startsWith("/") || dest.startsWith("//")) return "/portal";
  return dest;
}

export default async function BienvenidaPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string; logo?: string; name?: string; clientId?: string; mode?: string; color?: string }>;
}) {
  const params = await searchParams;
  const dest = safeDest(params.dest);

  // Si por algún motivo llegan sin logo (link directo, etc.), no hay nada
  // que animar: seguir de largo al destino.
  const isAdmin = params.mode === "admin";
  if (!params.clientId || (!isAdmin && !params.logo)) redirect(dest);

  const logo = params.logo;
  let theme = brandTokens("#6257c8");
  if (!isAdmin) {
    theme = await getClientBrandTokens({
      id: params.clientId,
      logo_url: logo,
      brand_color: params.color,
    });
  }

  return (
    <WelcomeAnimation
      clientId={params.clientId}
      logo={logo}
      name={params.name ?? ""}
      dest={dest}
      variant={isAdmin ? "admin" : "client"}
      accent={theme["--accent"]}
      accentSoft={theme["--accent-soft"]}
    />
  );
}

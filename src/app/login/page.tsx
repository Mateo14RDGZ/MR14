import { signIn } from "@/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const result = await signIn(formData);
    if (result?.error) {
      const next = String(formData.get("next") || "/dashboard");
      const { redirect } = await import("next/navigation");
      redirect(`/login?error=${encodeURIComponent(result.error)}&next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-[340px] animate-fade-in">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-center text-sm text-muted">Gestión de proyectos y clientes</p>
        </div>

        <form action={action} className="space-y-5">
          <input type="hidden" name="next" value={params.next ?? ""} />
          {params.error && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
              {params.error}
            </div>
          )}
          <Field>
            <Label>Email</Label>
            <Input type="email" name="email" placeholder="tu@mr14.dev" required autoFocus />
          </Field>
          <Field>
            <Label>Contraseña</Label>
            <Input type="password" name="password" placeholder="••••••••" required />
          </Field>
          <Button type="submit" className="w-full" size="lg">
            Ingresar
          </Button>
        </form>

        <div className="mt-5 text-center">
          <a
            href="mailto:contacto@mateordgz.dev?subject=Recuperar%20contrase%C3%B1a"
            className="text-xs text-muted-2 transition-colors hover:text-muted"
          >
            Recuperar contraseña
          </a>
        </div>
      </div>
    </div>
  );
}

import { signIn } from "@/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label, Field } from "@/components/ui/Input";

export function LoginForm({
  basePath,
  subtitle,
  next,
  error,
}: {
  basePath: string;
  subtitle: string;
  next?: string;
  error?: string;
}) {
  async function action(formData: FormData) {
    "use server";
    const result = await signIn(formData);
    if (result?.error) {
      const requestedNext = String(formData.get("next") || "");
      const { redirect } = await import("next/navigation");
      redirect(
        `${basePath}?error=${encodeURIComponent(result.error)}${requestedNext ? `&next=${encodeURIComponent(requestedNext)}` : ""}`
      );
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-[340px] animate-fade-in">
        {/* Solo la marca: el nombre ya lo lleva el alt de la imagen. */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <Logo mark size="2xl" />
          <p className="text-center text-sm text-muted">{subtitle}</p>
        </div>

        <form action={action} className="space-y-5">
          <input type="hidden" name="next" value={next ?? ""} />
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
              {error}
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

import { LoginForm } from "@/components/auth/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginForm
      basePath="/admin"
      subtitle="Acceso administrador"
      next={params.next}
      error={params.error}
    />
  );
}

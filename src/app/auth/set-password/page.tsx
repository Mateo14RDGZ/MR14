import { SetPasswordClient } from "@/components/auth/SetPasswordClient";

// Depende de la sesión temporal creada por el link de invitación de Supabase:
// nunca debe pre-renderizarse en build, solo servirse en runtime.
export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return <SetPasswordClient />;
}

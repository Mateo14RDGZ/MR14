import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit (usado por @react-pdf/renderer) carga sus fuentes estándar con
  // require() dinámico, que el file tracing de Vercel a veces no detecta —
  // forzamos que se incluyan en el bundle de la función serverless.
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
  },
  experimental: {
    // Por defecto Next no reutiliza nada de una ruta dinámica ya visitada
    // (dynamic: 0), así que volver a una pestaña de la barra inferior paga
    // otra vez el middleware (auth.getUser() contra Supabase) + las queries
    // de la página. Con 30s, ir y volver entre pestañas es instantáneo.
    // Es seguro: todas las server actions llaman revalidatePath, que limpia
    // esta caché, así que después de registrar un pago / crear un ticket /
    // cambiar un estado se vuelve a pedir al servidor igual.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;

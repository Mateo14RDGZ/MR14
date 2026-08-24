import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit (usado por @react-pdf/renderer) carga sus fuentes estándar con
  // require() dinámico, que el file tracing de Vercel a veces no detecta —
  // forzamos que se incluyan en el bundle de la función serverless.
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
  },
};

export default nextConfig;

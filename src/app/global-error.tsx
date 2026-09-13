"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="es"><body className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-zinc-950">
    <main><h1 className="text-xl font-semibold">MR14 necesita volver a cargar</h1><p className="mt-2 text-sm text-zinc-600">Tus datos no se perdieron.</p>
      <button onClick={reset} className="mt-5 min-h-11 rounded-lg bg-[#3D566E] px-5 text-sm font-medium text-white">Volver a intentar</button></main>
  </body></html>;
}

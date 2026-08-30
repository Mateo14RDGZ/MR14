import { Skeleton } from "@/components/ui/Skeleton";

export default function PortalLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando contenido">
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-9 w-52 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-sm rounded-full" />
      </div>
      <Skeleton className="h-52 w-full rounded-3xl sm:h-60" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

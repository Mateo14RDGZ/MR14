import { Skeleton } from "@/components/ui/Skeleton";

export default function PortalLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-11 w-40 rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-40 w-full rounded-lg lg:col-span-2" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

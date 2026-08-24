import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";

export default function ClientsLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <SkeletonRows rows={6} />
    </div>
  );
}

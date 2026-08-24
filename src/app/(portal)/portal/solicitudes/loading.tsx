import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";

export default function PortalSolicitudesLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <SkeletonRows rows={4} />
    </div>
  );
}

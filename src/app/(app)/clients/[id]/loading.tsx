import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonRows } from "@/components/ui/Skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
      </div>
      <div className="flex gap-1 border-b border-border pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-md" />
        ))}
      </div>
      <SkeletonRows rows={4} />
    </div>
  );
}

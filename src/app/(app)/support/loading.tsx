import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonRows } from "@/components/ui/Skeleton";

export default function SupportLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <SkeletonRows rows={6} />
    </div>
  );
}

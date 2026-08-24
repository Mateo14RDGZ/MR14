import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";

export default function PortalDocumentosLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <SkeletonRows rows={4} />
    </div>
  );
}

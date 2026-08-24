import { Skeleton } from "@/components/ui/Skeleton";

export default function PortalMiWebLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

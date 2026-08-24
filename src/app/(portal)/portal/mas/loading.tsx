import { Skeleton } from "@/components/ui/Skeleton";

export default function PortalMasLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-[212px] w-full rounded-lg" />
      <Skeleton className="h-[52px] w-full rounded-lg" />
    </div>
  );
}

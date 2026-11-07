import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

import PropertyCardSkeleton from "@/components/property/PropertyCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar skeleton */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-xl border p-5 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

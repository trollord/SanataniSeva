export default function AdminListingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-40" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>

      {/* Table skeleton */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 px-4 py-3 bg-gray-100">
          {[120, 80, 80, 100, 80, 60].map((w, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded" style={{ width: w }} />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-t border-gray-100">
            {[120, 80, 80, 100, 80, 60].map((w, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

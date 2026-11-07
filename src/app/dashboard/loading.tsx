export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse space-y-6">
      {/* Page title */}
      <div className="h-8 bg-gray-200 rounded w-48" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Content block */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

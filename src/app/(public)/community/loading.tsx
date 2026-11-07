/**
 * Shown while the directory query runs. The page is force-dynamic and pulls
 * every ACTIVE contact, so navigation would otherwise hold on the previous
 * screen. Wrapper matches page.tsx exactly so nothing shifts on swap.
 */
export default function CommunityLoading() {
  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto animate-pulse">
        {/* Hero */}
        <div className="h-3 bg-gray-200 rounded w-28 mb-4" />
        <div className="h-9 sm:h-12 bg-gray-200 rounded w-3/4 max-w-md mb-3" />
        <div className="h-4 bg-gray-100 rounded w-full max-w-lg mb-10 sm:mb-14" />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <div className="h-9 bg-gray-200 rounded-full w-28" />
          <div className="h-9 bg-gray-100 rounded-full w-28" />
        </div>

        {/* Search + locality filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="h-12 bg-gray-100 rounded-full flex-1" />
          <div className="h-12 bg-gray-100 rounded-full w-full sm:w-52" />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[104, 88, 132, 96, 116, 80, 124, 92].map((w, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-full" style={{ width: w }} />
          ))}
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-2xl p-5 bg-white"
            >
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-5" />
              <div className="h-3.5 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="flex gap-2">
                <div className="h-10 bg-gray-100 rounded-full flex-1" />
                <div className="h-10 bg-gray-100 rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Loading the directory
        </span>
      </div>
    </div>
  );
}

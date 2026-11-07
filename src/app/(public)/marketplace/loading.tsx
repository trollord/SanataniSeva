/**
 * Marketplace is force-dynamic and queries items on every visit; this keeps the
 * nav click responsive. Wrapper matches page.tsx so nothing shifts on swap.
 */
export default function MarketplaceLoading() {
  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-24 mb-4" />
        <div className="h-9 sm:h-12 bg-gray-200 rounded w-2/3 max-w-sm mb-3" />
        <div className="h-4 bg-gray-100 rounded w-full max-w-2xl mb-10 sm:mb-14" />

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="h-12 bg-gray-100 rounded-full flex-1" />
          <div className="h-12 bg-gray-100 rounded-full w-full sm:w-44" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <div className="h-44 bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3.5 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-5 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Loading listings
        </span>
      </div>
    </div>
  );
}

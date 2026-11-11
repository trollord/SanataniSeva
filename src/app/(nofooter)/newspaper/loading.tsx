/**
 * The newspaper index runs two queries (editions + published news) before it can
 * render anything. Wrapper matches page.tsx so nothing shifts on swap.
 */
export default function NewspaperLoading() {
  return (
    <div className="pt-[60px] min-h-screen">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-16 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-28 mb-4" />
        <div className="h-9 sm:h-12 bg-gray-200 rounded w-2/3 max-w-md mb-10" />

        {/* Today's news strip */}
        <div className="space-y-3 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3.5 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>

        {/* Edition grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-2" />
              <div className="h-3.5 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Loading editions
        </span>
      </div>
    </div>
  );
}

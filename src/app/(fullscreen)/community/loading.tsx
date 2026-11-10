/**
 * Shown while the directory query runs. The page pulls every ACTIVE contact,
 * so navigation would otherwise hold on the previous screen. The wrapper
 * mirrors page.tsx - same height model, same rail - so nothing shifts on swap.
 */
export default function CommunityLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 px-5 sm:px-8 pt-24 pb-16 md:pt-20 md:pb-4">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col min-h-0 animate-pulse">

        {/* Hero */}
        <div className="shrink-0 flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 lg:gap-8 mb-5 lg:mb-4">
          <div className="h-8 lg:h-6 bg-gray-200 rounded w-56 shrink-0" />
          <div className="h-4 bg-gray-100 rounded w-full max-w-lg" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#F0E9DF] p-1 w-fit mb-5 lg:mb-4 shrink-0">
          <div className="h-8 bg-white rounded-lg w-36" />
          <div className="h-8 bg-gray-100/50 rounded-lg w-28" />
        </div>

        {/* Search + locality */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="h-10 bg-gray-100 rounded-full flex-1" />
          <div className="h-10 bg-gray-100 rounded-full w-full sm:w-56 shrink-0" />
        </div>

        {/* Rail + table */}
        <div className="flex flex-1 min-h-0 gap-5 mt-4">
          <div className="hidden lg:block w-52 shrink-0 bg-white border border-[#e4e9ea] rounded-2xl p-1.5 space-y-1">
            <div className="h-7 bg-gray-100 rounded-lg mb-2" />
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-7 bg-gray-50 rounded-lg" />
            ))}
          </div>

          <div className="flex flex-1 flex-col min-h-0">
            <div className="h-4 bg-gray-100 rounded w-28 mb-2.5 shrink-0" />
            <div className="flex-1 min-h-0 bg-white border border-[#e4e9ea] rounded-2xl overflow-hidden">
              <div className="h-9 bg-[#F5F5F5] border-b border-[#EBEBEB]" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 border-b border-[#EBEBEB]"
                >
                  <div className="h-7 w-7 bg-gray-100 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-40" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-28 hidden md:block" />
                  <div className="h-7 w-16 bg-gray-100 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Loading the directory
        </span>
      </div>
    </div>
  );
}

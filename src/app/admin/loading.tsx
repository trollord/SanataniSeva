/**
 * Segment-level fallback for every /admin route that does not define its own.
 *
 * Without this, clicking a sidebar link left the browser sitting on the previous
 * screen until the server render came back - the admin pages are all
 * force-dynamic and query Postgres, so that is a visible stall and reads as a
 * frozen tab. Next renders this instantly on navigation instead.
 *
 * Padding matches the admin pages (p-4 sm:p-6 lg:p-8) so the skeleton does not
 * jump when the real content swaps in.
 */
export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Page title */}
      <div className="h-7 sm:h-8 bg-gray-200 rounded w-56 mb-4 sm:mb-6" />

      {/* Toolbar / filter tabs */}
      <div className="flex gap-1 mb-5 sm:mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[72, 64, 76, 48].map((w, i) => (
          <div key={i} className="h-7 bg-gray-200 rounded-md" style={{ width: w }} />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex gap-4 px-4 py-3 bg-gray-50">
          {[140, 90, 90, 80, 60, 70].map((w, i) => (
            <div key={i} className="h-3.5 bg-gray-300 rounded" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-t border-gray-100">
            {[140, 90, 90, 80, 60, 70].map((w, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading
      </span>
    </div>
  );
}

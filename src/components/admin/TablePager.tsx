import Link from "next/link";

/**
 * Link-based pager for the server-rendered admin tables.
 *
 * Takes the page's existing searchParams so status tabs, filters and search
 * terms survive paging - building the href from scratch would silently drop
 * them. Renders nothing when everything fits on one page.
 */

/** Rows per page. Smaller pages render faster and keep the RSC payload down. */
export const PAGE_SIZE = 25;

/** Clamps a `?page=` value; a stale one would otherwise render an empty table. */
export function resolvePage(raw: string | undefined, total: number) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(raw) || 1), pageCount);
  return {
    page,
    pageCount,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: Math.min(page * PAGE_SIZE, total),
  };
}

export default function TablePager({
  basePath,
  params,
  page,
  pageCount,
  total,
  from,
  to,
}: {
  basePath: string;
  /** Current query string, minus `page`, which this component owns. */
  params?: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
}) {
  function href(target: number) {
    const sp = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && k !== "page") sp.set(k, v);
    });
    sp.set("page", String(target));
    return `${basePath}?${sp.toString()}`;
  }

  if (total === 0) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {total}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <PagerLink href={href(page - 1)} disabled={page === 1} label="Previous" />
          <span className="px-2 text-xs text-gray-500">
            Page {page} of {pageCount}
          </span>
          <PagerLink href={href(page + 1)} disabled={page === pageCount} label="Next" />
        </div>
      )}
    </div>
  );
}

function PagerLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}

/**
 * Client-side counterpart for tables whose rows live in component state
 * (admin users, dashboard listings) rather than being re-fetched per page.
 */
export function ClientPager({
  page,
  pageCount,
  total,
  from,
  to,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {total}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="px-2 text-xs text-gray-500">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page === pageCount}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/** Slices an in-memory array for ClientPager. */
export function paginate<T>(rows: T[], page: number) {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return {
    page: safePage,
    pageCount,
    total,
    from: total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1,
    to: Math.min(safePage * PAGE_SIZE, total),
    rows: rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
  };
}

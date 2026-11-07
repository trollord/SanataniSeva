"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, SlidersHorizontal, LayoutGrid, List, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import PropertyCard from "@/components/property/PropertyCard";
import MobileFilterToggle from "@/components/search/MobileFilterToggle";
import ActiveFilterChips from "@/components/search/ActiveFilterChips";

const SORT_OPTIONS = [
  { value: "", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "area_desc", label: "Largest Area" },
];

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[65dvh] sm:h-[600px] bg-gray-50 rounded-xl border text-sm text-gray-400 gap-2">
      <MapPin className="h-4 w-4 animate-pulse" />
      Loading map…
    </div>
  ),
});

const PAGE_SIZE = 6;

interface PropertyCardData {
  id: string;
  title: string;
  type: string;
  listingType: string;
  locality: string;
  building: string;
  bedrooms: number | null;
  areaSqft: number;
  furnished: string;
  price: number;
  deposit: number | null;
  availableFrom: string | null;
  latitude: number | null;
  longitude: number | null;
  images: { id: string; url: string; isPrimary: boolean }[];
}

function SkeletonGrid({ isGrid }: { isGrid: boolean }) {
  return (
    <div className={isGrid ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" : "flex flex-col gap-3 sm:gap-4"}>
      {Array.from({ length: PAGE_SIZE }).map((_, i) =>
        isGrid ? (
          <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
            <div className="h-48 sm:h-56 bg-zinc-100" />
            <div className="p-4 sm:p-5 space-y-3">
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
              <div className="h-3 bg-zinc-50 rounded w-1/2" />
              <div className="h-5 bg-zinc-100 rounded w-1/3 mt-4" />
            </div>
          </div>
        ) : (
          <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse flex flex-row border border-zinc-100">
            <div className="w-[110px] sm:w-[160px] h-[90px] sm:h-[110px] bg-zinc-100 flex-shrink-0 self-stretch" />
            <div className="flex-1 px-3 sm:px-4 py-2.5 flex flex-col justify-center gap-2">
              <div className="flex justify-between gap-2">
                <div className="h-4 bg-zinc-100 rounded w-1/2" />
                <div className="h-4 bg-zinc-100 rounded w-20" />
              </div>
              <div className="h-3 bg-zinc-50 rounded w-2/5" />
              <div className="flex gap-2">
                <div className="h-3 bg-zinc-100 rounded w-12" />
                <div className="h-3 bg-zinc-100 rounded w-14" />
                <div className="h-3 bg-zinc-100 rounded w-16" />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const view = searchParams.get("view") ?? "grid";
  const locality = searchParams.get("locality") ?? "All Localities";
  const listingType = searchParams.get("listingType");
  const listingTypeLabel = listingType === "RENT" ? "available for rent" : "available for sale";
  const listingWord = total === 1 ? "property" : "properties";
  const isGrid = view !== "list";
  const paramsKey = searchParams.toString();

  useEffect(() => {
    setLoading(true);
    setProperties([]);

    const params = new URLSearchParams();
    for (const [key, val] of searchParams.entries()) {
      if (key !== "view") params.set(key, val);
    }
    params.set("take", view === "map" ? "50" : String(PAGE_SIZE));
    params.set("skip", "0");

    fetch(`/api/properties?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProperties(data.properties ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || properties.length >= total) return;
    setLoadingMore(true);

    const params = new URLSearchParams();
    for (const [key, val] of searchParams.entries()) {
      if (key !== "view") params.set(key, val);
    }
    params.set("skip", String(properties.length));
    params.set("take", String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      setProperties((prev) => [...prev, ...data.properties]);
    } finally {
      setLoadingMore(false);
    }
  }, [properties.length, total, loadingMore, searchParams]);

  // Infinite scroll: load the next batch as the sentinel nears the viewport
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  function viewLink(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", key);
    return `/listings?${params.toString()}`;
  }

  const sort = searchParams.get("sort") ?? "";

  function changeSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    router.replace(`/listings?${params.toString()}`, { scroll: false });
  }

  const hasMore = properties.length < total;

  return (
    <>
      {/* Header */}
      <div className="flex items-start sm:items-end justify-between mb-6 sm:mb-12 flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-zinc-900">
            Properties in {locality}
          </h1>
          <p className="text-zinc-500 mt-1 sm:mt-2 text-xs sm:text-sm">
            {loading
              ? "Loading properties…"
              : total > 0
              ? `${total} ${listingWord} ${listingTypeLabel}`
              : "No properties match your filters"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3" data-tour="sort-views">
          <MobileFilterToggle />

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sort}
              onChange={(e) => changeSort(e.target.value)}
              aria-label="Sort properties"
              className="appearance-none bg-white border border-[#e4e9ea] rounded-full pl-9 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-zinc-700 cursor-pointer hover:bg-[#f2f4f4] focus:outline-none transition-all"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-zinc-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* View switch - labeled segmented control */}
          <div className="flex bg-white border border-[#e4e9ea] rounded-full p-1">
            {(
              [
                { key: "grid", label: "Grid", Icon: LayoutGrid },
                { key: "list", label: "List", Icon: List },
              ] as const
            ).map(({ key, label, Icon }) => (
              <Link
                key={key}
                href={viewLink(key)}
                replace
                title={`${label} view`}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  view === key
                    ? "bg-[#FF5F15] text-white shadow"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips />

      {/* Content */}
      {loading ? (
        <SkeletonGrid isGrid={isGrid} />
      ) : properties.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-zinc-400">
          <SlidersHorizontal className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 opacity-40" />
          <p className="font-medium text-zinc-900 text-sm sm:text-base">
            No properties match your filters.
          </p>
          <Link
            href="/listings"
            className="text-zinc-500 hover:text-zinc-900 text-xs sm:text-sm mt-2 inline-block underline underline-offset-2"
          >
            Clear all filters
          </Link>
        </div>
      ) : view === "map" ? (
        <MapView properties={properties} />
      ) : (
        <>
          <div className={isGrid ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch" : "flex flex-col gap-3 sm:gap-4"}>
            {properties.map((p, i) => (
              <div
                key={p.id}
                data-tour={i === 0 ? "property-card" : undefined}
                className={isGrid ? "h-full" : undefined}
              >
                <PropertyCard property={p} variant={isGrid ? "grid" : "list"} />
              </div>
            ))}
            {loadingMore &&
              Array.from({ length: PAGE_SIZE }).map((_, i) =>
                isGrid ? (
                  <div key={`sk-${i}`} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="h-48 sm:h-56 bg-zinc-100" />
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="h-4 bg-zinc-100 rounded w-3/4" />
                      <div className="h-3 bg-zinc-50 rounded w-1/2" />
                      <div className="h-5 bg-zinc-100 rounded w-1/3 mt-4" />
                    </div>
                  </div>
                ) : (
                  <div key={`sk-${i}`} className="bg-white rounded-xl overflow-hidden animate-pulse flex flex-row border border-zinc-100">
                    <div className="w-[110px] sm:w-[160px] h-[90px] sm:h-[110px] bg-zinc-100 flex-shrink-0 self-stretch" />
                    <div className="flex-1 px-3 sm:px-4 py-2.5 flex flex-col justify-center gap-2">
                      <div className="flex justify-between gap-2">
                        <div className="h-4 bg-zinc-100 rounded w-1/2" />
                        <div className="h-4 bg-zinc-100 rounded w-20" />
                      </div>
                      <div className="h-3 bg-zinc-50 rounded w-2/5" />
                      <div className="flex gap-2">
                        <div className="h-3 bg-zinc-100 rounded w-12" />
                        <div className="h-3 bg-zinc-100 rounded w-14" />
                        <div className="h-3 bg-zinc-100 rounded w-16" />
                      </div>
                    </div>
                  </div>
                )
              )}
          </div>

          {/* Infinite-scroll sentinel - triggers the next batch automatically */}
          {hasMore && <div ref={sentinelRef} className="h-1" aria-hidden />}

          <div className="mt-10 sm:mt-16 flex justify-center">
            {!hasMore && total > PAGE_SIZE && (
              <p className="text-xs sm:text-sm text-zinc-400">
                All {total} properties shown
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}

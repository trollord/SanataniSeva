"use client";

import { useState, useRef, useCallback } from "react";
import PropertyCard from "@/components/property/PropertyCard";

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
  images: { id: string; url: string; isPrimary: boolean }[];
}

interface Props {
  initialProperties: PropertyCardData[];
  total: number;
  pageSize: number;
  filters: Record<string, string | undefined>;
  view: "grid" | "list";
}

export default function LoadMoreProperties({
  initialProperties,
  total,
  pageSize,
  filters,
  view,
}: Props) {
  const [properties, setProperties] = useState<PropertyCardData[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const hasMore = properties.length < total;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || properties.length >= total) return;
    loadingRef.current = true;
    setLoading(true);

    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val && key !== "page" && key !== "view") params.set(key, val);
    }
    params.set("skip", String(properties.length));
    params.set("take", String(pageSize));

    try {
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties((prev) => [...prev, ...data.properties]);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [properties.length, total, filters, pageSize]);

  const isGrid = view !== "list";

  return (
    <>
      <div
        className={
          isGrid
            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch"
            : "flex flex-col gap-4 sm:gap-6"
        }
      >
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}

        {/* Skeleton placeholders while loading */}
        {loading &&
          Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className={
                isGrid
                  ? "bg-white rounded-xl overflow-hidden animate-pulse"
                  : "bg-white rounded-xl overflow-hidden animate-pulse"
              }
            >
              <div className="h-48 sm:h-56 bg-zinc-100" />
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-4 bg-zinc-100 rounded w-3/4" />
                <div className="h-3 bg-zinc-50 rounded w-1/2" />
                <div className="h-5 bg-zinc-100 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
      </div>

      <div className="mt-10 sm:mt-16 flex justify-center">
        {hasMore && !loading && (
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border border-[#e4e9ea] rounded-xl text-zinc-900 font-bold text-sm sm:text-base hover:bg-[#f2f4f4] transition-all active:scale-95"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Load More Properties
          </button>
        )}
        {!hasMore && total > pageSize && (
          <p className="text-xs sm:text-sm text-zinc-400">
            All {total} properties shown
          </p>
        )}
      </div>
    </>
  );
}

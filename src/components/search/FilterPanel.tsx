"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  HIRANANDANI_LOCALITIES,
  PROPERTY_TYPE_LABELS,
  BHK_OPTIONS,
  PRICE_RANGES_RENT,
  PRICE_RANGES_SALE,
} from "@/lib/constants";

// Filters apply instantly on change - no "Apply" button. Values live in the
// URL so chips, results and the panel always stay in sync.
export default function FilterPanel({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingType = searchParams.get("listingType") || "SALE";
  const type = searchParams.get("type") || "";
  const locality = searchParams.get("locality") || "";
  const bedrooms = searchParams.get("bedrooms") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const availability = searchParams.get("availability") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const priceRanges = listingType === "SALE" ? PRICE_RANGES_SALE : PRICE_RANGES_RENT;

  function apply(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(changes)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    router.replace(`/listings?${params.toString()}`, { scroll: false });
  }

  return (
    // On desktop: full height flex column with space distributed between sections
    // On mobile (inside sheet): normal flow with gap between sections
    <div className="flex flex-col h-full gap-5 lg:justify-between">

      {/* Header */}
      <h2 className="text-[10px] uppercase tracking-widest font-bold text-zinc-900">
        Filter Properties
      </h2>

      {/* Looking To */}
      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-2">
          Looking To
        </label>
        <div className="flex bg-[#f2f4f4] p-1 rounded-xl">
          {(["SALE", "RENT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => apply({ listingType: t, minPrice: "", maxPrice: "" })}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                listingType === t
                  ? "bg-[#FF5F15] text-white font-bold"
                  : "text-zinc-500 font-medium hover:text-zinc-700"
              }`}
            >
              {t === "SALE" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1.5">
          Property Type
        </label>
        <div className="relative">
          <select
            value={type}
            onChange={(e) => apply({ type: e.target.value })}
            className="w-full appearance-none bg-[#f2f4f4] border-none rounded-lg px-3 py-2.5 text-sm text-zinc-900 font-medium cursor-pointer focus:outline-none focus:ring-0"
          >
            <option value="">All Types</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-zinc-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Locality */}
      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1.5">
          Locality
        </label>
        <div className="relative">
          <select
            value={locality}
            onChange={(e) => apply({ locality: e.target.value })}
            className="w-full appearance-none bg-[#f2f4f4] border-none rounded-lg px-3 py-2.5 pr-10 text-sm text-zinc-900 font-medium cursor-pointer focus:outline-none focus:ring-0"
          >
            <option value="">All Localities</option>
            {HIRANANDANI_LOCALITIES.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-zinc-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-2">
          Bedrooms
        </label>
        <div className="flex flex-wrap gap-1.5">
          {BHK_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => apply({ bedrooms: bedrooms === String(n) ? "" : String(n) })}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                bedrooms === String(n)
                  ? "bg-[#FF5F15] text-white font-bold"
                  : "bg-[#f2f4f4] text-zinc-900 font-medium hover:bg-[#e4e9ea]"
              }`}
            >
              {n}BHK
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-2">
          Availability
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "now", label: "Ready to Move" },
            { value: "30d", label: "Within 30 Days" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => apply({ availability: availability === value ? "" : value })}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                availability === value
                  ? "bg-[#FF5F15] text-white font-bold"
                  : "bg-[#f2f4f4] text-zinc-900 font-medium hover:bg-[#e4e9ea]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-1.5">
          Listings without an availability date are always included.
        </p>
      </div>

      {/* Budget Range */}
      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-2">
          Budget Range
        </label>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-3">
          {priceRanges.map((range) => {
            const active =
              String(range.min) === minPrice &&
              (range.max === Infinity ? !maxPrice : String(range.max) === maxPrice);
            return (
              <li
                key={range.label}
                className="flex items-center gap-2.5 cursor-pointer group"
                onClick={() => {
                  if (active) apply({ minPrice: "", maxPrice: "" });
                  else
                    apply({
                      minPrice: String(range.min),
                      maxPrice: range.max === Infinity ? "" : String(range.max),
                    });
                }}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  active ? "border-[#FF5F15] bg-[#FF5F15]" : "border-zinc-300 group-hover:border-[#FF5F15]"
                }`}>
                  {active && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs transition-colors ${
                  active ? "font-bold text-zinc-900" : "font-medium text-zinc-500 group-hover:text-zinc-900"
                }`}>
                  {range.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile sheet: filters are already applied - this just closes the sheet */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#FF5F15] text-white rounded-xl font-bold tracking-tight hover:opacity-90 transition-all text-sm lg:hidden"
        >
          View Results
        </button>
      )}
    </div>
  );
}

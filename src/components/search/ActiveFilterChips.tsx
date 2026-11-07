"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils/formatters";

interface Chip {
  label: string;
  /** URL params removed when the chip is dismissed */
  params: string[];
}

const FILTER_PARAMS = ["listingType", "type", "locality", "bedrooms", "minPrice", "maxPrice", "availability"];

export default function ActiveFilterChips() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingType = searchParams.get("listingType");
  const type = searchParams.get("type");
  const locality = searchParams.get("locality");
  const bedrooms = searchParams.get("bedrooms");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const availability = searchParams.get("availability");

  const chips: Chip[] = [];
  if (listingType) {
    chips.push({ label: listingType === "RENT" ? "For Rent" : "For Sale", params: ["listingType"] });
  }
  if (type) {
    chips.push({ label: PROPERTY_TYPE_LABELS[type] ?? type, params: ["type"] });
  }
  if (locality) {
    chips.push({ label: locality, params: ["locality"] });
  }
  if (bedrooms) {
    chips.push({ label: `${bedrooms} BHK`, params: ["bedrooms"] });
  }
  if (availability === "now" || availability === "30d") {
    chips.push({
      label: availability === "now" ? "Ready to Move" : "Within 30 Days",
      params: ["availability"],
    });
  }
  if (minPrice || maxPrice) {
    const min = minPrice ? formatPrice(parseFloat(minPrice)) : null;
    const max = maxPrice ? formatPrice(parseFloat(maxPrice)) : null;
    chips.push({
      label: min && max ? `${min} – ${max}` : min ? `Above ${min}` : `Under ${max}`,
      params: ["minPrice", "maxPrice"],
    });
  }

  if (chips.length === 0) return null;

  function remove(paramsToRemove: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    paramsToRemove.forEach((p) => params.delete(p));
    router.replace(`/listings?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_PARAMS.forEach((p) => params.delete(p));
    router.replace(`/listings?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-8" data-tour="filter-chips">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => remove(chip.params)}
          className="group flex items-center gap-1.5 bg-[#FF5F15] text-white text-xs font-medium pl-3 pr-2 py-1.5 rounded-full hover:bg-[#E84A00] transition-colors"
          title="Remove filter"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 ml-1 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

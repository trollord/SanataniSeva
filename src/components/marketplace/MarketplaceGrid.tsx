"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ItemCard, { type MarketplaceItemCard } from "./ItemCard";
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITIONS,
  ITEM_CONDITION_LABELS,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
  ITEM_PRICE_RANGES,
} from "@/lib/constants";

export default function MarketplaceGrid({ items }: { items: MarketplaceItemCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [vehicleType, setVehicleType] = useState<string>("ALL");
  const [condition, setCondition] = useState<string>("ALL");
  const [priceIdx, setPriceIdx] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    const priceRange =
      priceIdx === "ALL" ? null : ITEM_PRICE_RANGES[Number(priceIdx)];

    return items.filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (
        category === "VEHICLES" &&
        vehicleType !== "ALL" &&
        item.vehicleType !== vehicleType
      )
        return false;
      if (condition !== "ALL" && item.condition !== condition) return false;
      if (
        priceRange &&
        (item.price < priceRange.min || item.price > priceRange.max)
      )
        return false;
      if (terms.length === 0) return true;
      const haystack = [
        item.title,
        item.pickupLocality,
        ITEM_CATEGORY_LABELS[item.category] ?? "",
        item.vehicleType ? VEHICLE_TYPE_LABELS[item.vehicleType] ?? "" : "",
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [items, query, category, vehicleType, condition, priceIdx]);

  const activeFilters =
    (category !== "ALL" ? 1 : 0) +
    (vehicleType !== "ALL" ? 1 : 0) +
    (condition !== "ALL" ? 1 : 0) +
    (priceIdx !== "ALL" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setCategory("ALL");
    setVehicleType("ALL");
    setCondition("ALL");
    setPriceIdx("ALL");
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, brand, locality…"
          className="pl-11 h-12 rounded-xl bg-white"
        />
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <CategoryChip
          active={category === "ALL"}
          label={`All · ${items.length}`}
          onClick={() => {
            setCategory("ALL");
            setVehicleType("ALL");
          }}
        />
        {ITEM_CATEGORIES.map((key) => {
          const count = items.filter((i) => i.category === key).length;
          if (count === 0) return null;
          return (
            <CategoryChip
              key={key}
              active={category === key}
              label={`${ITEM_CATEGORY_LABELS[key]} · ${count}`}
              onClick={() => {
                setCategory(key);
                setVehicleType("ALL");
              }}
            />
          );
        })}
      </div>

      {/* Vehicles sub-filter */}
      {category === "VEHICLES" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 mt-2">
          <SubChip
            active={vehicleType === "ALL"}
            label="All vehicles"
            onClick={() => setVehicleType("ALL")}
          />
          {VEHICLE_TYPES.map((v) => {
            const count = items.filter(
              (i) => i.category === "VEHICLES" && i.vehicleType === v
            ).length;
            if (count === 0) return null;
            return (
              <SubChip
                key={v}
                active={vehicleType === v}
                label={`${VEHICLE_TYPE_LABELS[v]} · ${count}`}
                onClick={() => setVehicleType(v)}
              />
            );
          })}
        </div>
      )}

      {/* Secondary filters row */}
      <div className="flex flex-wrap items-end gap-2 sm:gap-3 mt-4">
        <div className="flex flex-col gap-1 w-[calc(50%-0.25rem)] sm:w-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 px-1">Condition</span>
          <Select value={condition} onValueChange={(v) => setCondition(v ?? "ALL")}>
            <SelectTrigger className="!w-full sm:!w-[180px] !h-10 rounded-xl bg-white px-3.5">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any condition</SelectItem>
              {ITEM_CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {ITEM_CONDITION_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-[calc(50%-0.25rem)] sm:w-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 px-1">Price</span>
          <Select value={priceIdx} onValueChange={(v) => setPriceIdx(v ?? "ALL")}>
            <SelectTrigger className="!w-full sm:!w-[180px] !h-10 rounded-xl bg-white px-3.5">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any price</SelectItem>
              {ITEM_PRICE_RANGES.map((r, i) => (
                <SelectItem key={r.label} value={String(i)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilters > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#FF5F15] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        <p className="ml-auto text-xs text-gray-500 w-full sm:w-auto text-right">
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-8 sm:mt-10 bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 text-center">
          <p className="text-sm font-semibold text-[#FF5F15]">No items match your filters</p>
          <p className="text-xs text-gray-500 mt-1">
            Try widening your search or clearing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-6">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.1em] px-4 py-2 rounded-full transition-colors ${
        active
          ? "bg-[#FF5F15] text-white"
          : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function SubChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors ${
        active
          ? "bg-[#EBEBEB] text-[#FF5F15]"
          : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

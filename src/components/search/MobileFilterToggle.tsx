"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import FilterPanel from "@/components/search/FilterPanel";

export default function MobileFilterToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button - only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        data-tour="filters-mobile"
        className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white text-zinc-500 border border-[#e4e9ea] hover:bg-[#f2f4f4] transition-all"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] lg:hidden bg-white rounded-t-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "88vh" }}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-100 shrink-0">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Filters
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <FilterPanel onClose={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}

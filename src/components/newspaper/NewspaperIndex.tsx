"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, X } from "lucide-react";
import TodaysNewsFeed, { type NewsItemMeta } from "./TodaysNewsFeed";
import SearchableSelect from "@/components/ui/searchable-select";

// react-pdf pulls in pdfjs-dist, which is browser-only and throws if it is
// evaluated during SSR — so the cover thumbnails load client-side only.
const EditionCover = dynamic(() => import("./EditionCover"), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-gray-100" style={{ aspectRatio: "210 / 297" }} />
  ),
});

export interface EditionMeta {
  id: string;
  title: string;
  dateStr: string;
  year: number;
  month: number;
  pageCount: number;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  past: EditionMeta[];
  newsItems: NewsItemMeta[];
}

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 220, damping: 22 },
  },
};

export default function NewspaperIndex({ past, newsItems }: Props) {
  const years  = [...new Set(past.map((e) => e.year))].sort((a, b) => b - a);
  const months = [...new Set(past.map((e) => e.month))].sort((a, b) => a - b);

  const [filterYear,  setFilterYear]  = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  const hasFilter = filterYear !== null || filterMonth !== null;

  const filtered = past.filter((e) => {
    if (filterYear  && e.year  !== filterYear)  return false;
    if (filterMonth && e.month !== filterMonth) return false;
    return true;
  });

  function clearFilters() { setFilterYear(null); setFilterMonth(null); }

  return (
    <div className="bg-[#FAF8F5] text-[#1C1C1C]">

      {/* ── Today's News ──────────────────────────────────────────────── */}
      <div className="px-5 sm:px-8 pt-10 sm:pt-16 pb-10 sm:pb-14">
        <div className="max-w-5xl mx-auto">
          <TodaysNewsFeed items={newsItems} />
        </div>
      </div>

      {/* ── Editions Archive ──────────────────────────────────────────── */}
      {past.length > 0 && (
        <div className="px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="max-w-5xl mx-auto">

            {/* Section header + date filter */}
            <motion.div
              className="flex flex-col gap-3 mb-7"
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#E5DDD4]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8541A] shrink-0">
                  Editions Archive
                </span>
                <div className="flex-1 h-px bg-[#E5DDD4]" />
              </div>

              {/* Filters */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <div className="w-[128px]">
                  <SearchableSelect
                    value={filterMonth === null ? "" : String(filterMonth)}
                    onChange={(v) => setFilterMonth(v ? Number(v) : null)}
                    size="sm"
                    options={[
                      { value: "", label: "All months" },
                      ...months.map((m) => ({ value: String(m), label: MONTHS[m - 1] })),
                    ]}
                    aria-label="Filter by month"
                  />
                </div>

                <div className="w-[112px]">
                  <SearchableSelect
                    value={filterYear === null ? "" : String(filterYear)}
                    onChange={(v) => setFilterYear(v ? Number(v) : null)}
                    size="sm"
                    options={[
                      { value: "", label: "All years" },
                      ...years.map((y) => ({ value: String(y), label: String(y) })),
                    ]}
                    aria-label="Filter by year"
                  />
                </div>

                {hasFilter && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#6B6B6B]
                               hover:text-[#C8541A] transition-colors px-2 py-1.5"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>

            {/* Staggered grid */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
              variants={gridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {filtered.map((e) => (
                <motion.div key={e.id} variants={cardVariants}>
                  <Link
                    href={`/newspaper/${e.id}`}
                    className="group block bg-white border border-[#EDE5D8]
                               rounded-2xl overflow-hidden
                               hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="bg-[#F5F0E8]">
                      <EditionCover id={e.id} />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-[13px] sm:text-sm font-semibold text-[#0B0B0C]
                                     group-hover:text-[#C8541A] transition-colors
                                     leading-snug line-clamp-2 min-h-[2.5em]">
                        {e.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {e.dateStr}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {filtered.length === 0 && (
              <p className="text-sm text-[#6B6B6B] py-12 text-center">
                No editions match the selected period.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

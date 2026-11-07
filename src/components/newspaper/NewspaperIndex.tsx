"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, X } from "lucide-react";
import EditionCover from "./EditionCover";
import TodaysNewsFeed, { type NewsItemMeta } from "./TodaysNewsFeed";

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
                <div className="relative">
                  <select
                    value={filterMonth ?? ""}
                    onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : null)}
                    className="appearance-none bg-white border border-[#E5DDD4] rounded-xl
                               text-[11px] font-semibold text-[#0B0B0C] pl-3 pr-7 py-1.5
                               focus:outline-none focus:border-[#C8541A] hover:border-[#C8541A]
                               transition-colors cursor-pointer"
                  >
                    <option value="">All months</option>
                    {months.map((m) => (
                      <option key={m} value={m}>{MONTHS[m - 1]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterYear ?? ""}
                    onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : null)}
                    className="appearance-none bg-white border border-[#E5DDD4] rounded-xl
                               text-[11px] font-semibold text-[#0B0B0C] pl-3 pr-7 py-1.5
                               focus:outline-none focus:border-[#C8541A] hover:border-[#C8541A]
                               transition-colors cursor-pointer"
                  >
                    <option value="">All years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
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

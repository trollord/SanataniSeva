"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Item {
  headline: string;
  category: string;
}

const CATEGORY_CHIP: Record<string, string> = {
  EVENTS:        "bg-[#FFF3EC] text-[#C8541A] border border-[#FDDCC8]",
  COMMUNITY:     "bg-green-50 text-green-700 border border-green-200",
  ANNOUNCEMENTS: "bg-amber-50 text-amber-700 border border-amber-200",
  SPORTS:        "bg-blue-50 text-blue-700 border border-blue-200",
  GENERAL:       "bg-gray-100 text-gray-600 border border-gray-200",
};

const CATEGORY_LABEL: Record<string, string> = {
  EVENTS:        "Events",
  COMMUNITY:     "Community",
  ANNOUNCEMENTS: "Notice",
  SPORTS:        "Sports",
  GENERAL:       "News",
};

export default function NewsBannerStrip({ items }: { items: Item[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[index];
  const chip = CATEGORY_CHIP[item.category] ?? CATEGORY_CHIP.GENERAL;
  const label = CATEGORY_LABEL[item.category] ?? "News";

  return (
    <div className="mt-[60px] w-full h-28 bg-[#EDEAE5] border-b border-[#D8D3CC] flex items-center justify-center px-5 sm:px-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col items-center justify-center gap-2 text-center">

        {/* Category chip + pulsing dot */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8541A] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8541A]" />
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full ${chip}`}>
            {label}
          </span>
        </div>

        {/* Cycling headline */}
        <div className="w-full overflow-hidden relative h-8 sm:h-9">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold text-[#1C1C1C] px-10 sm:px-20 truncate"
            >
              {item.headline}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Dot indicators + read more */}
        <div className="flex items-center gap-3">
          {items.length > 1 && (
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === index ? "w-4 h-1.5 bg-[#C8541A]" : "w-1.5 h-1.5 bg-[#1C1C1C]/20 hover:bg-[#1C1C1C]/40"
                  }`}
                />
              ))}
            </div>
          )}
          <Link
            href="/newspaper"
            className="flex items-center gap-1 text-xs font-semibold text-[#C8541A] hover:text-[#B34A16] transition-colors"
          >
            Read more
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

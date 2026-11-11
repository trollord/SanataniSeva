"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface Item {
  id: string;
  headline: string;
  category: string;
  imageUrls: string[];
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

const ARROW =
  "absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#D8D3CC] bg-[#FAF8F5] p-2 text-[#1C1C1C] transition-colors hover:border-[#C8541A] hover:text-[#C8541A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C8541A] sm:flex";

/**
 * The home-page news slider. Each slide is one published post and the whole
 * slide is a link to that post's page; the arrows and dots sit outside the
 * link so stepping through never navigates.
 */
export default function NewsBannerStrip({ items }: { items: Item[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  // Auto-advance, held while the pointer or keyboard focus is on the slider so
  // a slide never changes under someone about to click it.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  const item = items[index % count];
  const chip = CATEGORY_CHIP[item.category] ?? CATEGORY_CHIP.GENERAL;
  const label = CATEGORY_LABEL[item.category] ?? "News";
  const step = (by: number) => setIndex((i) => (i + by + count) % count);

  return (
    <div
      className="mt-[60px] w-full bg-[#EDEAE5] border-b border-[#D8D3CC] px-5 sm:px-8 lg:px-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative mx-auto max-w-[1200px] py-6 sm:py-8">
        {count > 1 && (
          <>
            <button onClick={() => step(-1)} aria-label="Previous" className={`${ARROW} left-0`}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => step(1)} aria-label="Next" className={`${ARROW} right-0`}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Fixed height, so slides with and without a poster never move the
            page beneath the banner. */}
        <div className="relative h-[168px] sm:h-[232px] sm:mx-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Link
                href={`/news/${item.id}`}
                className="group flex h-full items-center justify-center gap-5 sm:gap-10 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8541A]"
              >
                {item.imageUrls[0] && (
                  <Image
                    src={item.imageUrls[0]}
                    alt=""
                    width={600}
                    height={850}
                    sizes="(max-width: 640px) 120px, 180px"
                    className="h-full w-auto max-w-[38%] shrink-0 rounded-lg object-contain"
                    priority={index === 0}
                  />
                )}

                <div className="min-w-0 max-w-[560px]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8541A] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8541A]" />
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full ${chip}`}>
                      {label}
                    </span>
                  </div>

                  <p className="mt-3 font-[family-name:var(--font-playfair)] text-xl sm:text-[32px] font-bold leading-tight tracking-tight text-[#1C1C1C] line-clamp-3">
                    {item.headline}
                  </p>

                  <span className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#C8541A] group-hover:text-[#B34A16] transition-colors">
                    View details
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1} of ${count}`}
                aria-current={i === index}
                className={`rounded-full transition-all duration-300 ${
                  i === index ? "w-4 h-1.5 bg-[#C8541A]" : "w-1.5 h-1.5 bg-[#1C1C1C]/20 hover:bg-[#1C1C1C]/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

interface Item {
  id: string;
  headline: string;
  category: string;
  imageUrls: string[];
  /** Publication date, already formatted for display by the page. */
  date: string;
}

const CATEGORY_CHIP: Record<string, string> = {
  EVENTS:        "bg-[#FFF3EC] text-[#C8541A] border border-[#FDDCC8]",
  COMMUNITY:     "bg-green-50 text-green-700 border border-green-200",
  ANNOUNCEMENTS: "bg-amber-50 text-amber-700 border border-amber-200",
  SPORTS:        "bg-blue-50 text-blue-700 border border-blue-200",
  GENERAL:       "bg-gray-100 text-gray-600 border border-gray-200",
};

const PF = "font-[family-name:var(--font-playfair)]";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

const ARROW = `hidden h-9 w-9 items-center justify-center rounded-full border border-[#EDE5D8] bg-[#FAF8F5] text-[#1C1C1C] transition-colors duration-150 hover:border-[#C8541A] hover:text-[#A8410F] sm:flex ${FOCUS}`;

/**
 * The home-page news slider: one card, set on the same cream ground and
 * 1200px measure as the masthead beneath it, so it reads as the top of the
 * page rather than a band laid across it.
 *
 * Each slide is one published post and the whole slide is a link to that
 * post's page. The dots and arrows sit outside the link, in the card's
 * bottom-right corner, so stepping through never navigates.
 */
export default function NewsBannerStrip({ items }: { items: Item[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  // Auto-advance, held while a mouse or keyboard focus is on the slider so a
  // slide never changes under someone about to click it. Keyed on `index` so
  // the wait starts over after a manual step.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), 4000);
    return () => clearTimeout(id);
  }, [count, paused, index]);

  if (count === 0) return null;

  const item = items[index % count];
  const chip = CATEGORY_CHIP[item.category] ?? CATEGORY_CHIP.GENERAL;
  const step = (by: number) => setIndex((i) => (i + by + count) % count);

  return (
    <div
      className="mt-[60px] w-full bg-[#FAF8F5] px-5 pt-5 sm:px-8 sm:pt-8 lg:px-12"
      // Mouse only: a tap also fires "enter" but never "leave", which would
      // stop the slider for good on a phone.
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Fixed height, so slides with and without a poster never move the
          page beneath the card. */}
      <div className="relative mx-auto h-[184px] max-w-[1200px] overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#F0E9DF] sm:h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Link
              href={`/news/${item.id}`}
              className={`group grid h-full grid-rows-[minmax(0,1fr)] grid-cols-[116px_minmax(0,1fr)] sm:grid-cols-[minmax(0,264px)_minmax(0,1fr)] ${FOCUS}`}
            >
              {/* Poster plate. Posters are portrait and carry their own
                  type, so they are shown whole, never cropped. */}
              <div className="flex min-h-0 items-center justify-center border-r border-[#EDE5D8] bg-[#EDE0CC] p-3 sm:p-5">
                {item.imageUrls[0] ? (
                  <Image
                    src={item.imageUrls[0]}
                    alt=""
                    width={600}
                    height={850}
                    sizes="(max-width: 640px) 100px, 230px"
                    className="max-h-full w-auto max-w-full rounded-lg object-contain shadow-[0_6px_24px_rgba(28,10,0,0.18)] transition-transform duration-300 group-hover:scale-[1.02]"
                    priority={index === 0}
                  />
                ) : (
                  <Newspaper className="h-8 w-8 text-[#9E6B3F]" strokeWidth={1.5} />
                )}
              </div>

              <div className="flex min-h-0 min-w-0 flex-col p-4 sm:p-8">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C8541A] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8541A]" />
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${chip}`}>
                    Upcoming Events
                  </span>
                  {count > 1 && (
                    <span className="ml-auto text-[11px] font-bold tabular-nums tracking-[0.12em] text-[#7A4F2A]">
                      {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                    </span>
                  )}
                </div>

                <p
                  className={`${PF} mt-2.5 font-bold tracking-tight text-[#1C1C1C] line-clamp-3 sm:mt-4 sm:line-clamp-2`}
                  style={{ fontSize: "clamp(1.1rem,2.7vw,2.2rem)", lineHeight: 1.12 }}
                >
                  {item.headline}
                </p>

                <p className="mt-2 text-[12px] text-[#6B6B6B] sm:mt-3 sm:text-[14px]">
                  Posted {item.date}
                </p>

                <span className="mt-auto inline-flex w-fit items-center gap-1.5 border-b border-[#C8541A] pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1C1C1C] transition-colors duration-150 group-hover:text-[#A8410F] sm:text-[13px]">
                  View details
                  <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-[3px]">
                    →
                  </span>
                </span>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-3 sm:bottom-7 sm:right-8">
            <div className="flex items-center gap-1.5">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show slide ${i + 1} of ${count}`}
                  aria-current={i === index}
                  className={`rounded-full transition-all duration-300 ${
                    i === index ? "h-1.5 w-5 bg-[#C8541A]" : "h-1.5 w-1.5 bg-[#1C1C1C]/25 hover:bg-[#1C1C1C]/45"
                  }`}
                />
              ))}
            </div>
            <button onClick={() => step(-1)} aria-label="Previous" className={ARROW}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => step(1)} aria-label="Next" className={`${ARROW} -ml-1.5`}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

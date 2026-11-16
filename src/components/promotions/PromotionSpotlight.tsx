"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import type { PromotionView } from "@/lib/promotions";
import PromotionActions, { OfferBadge } from "./PromotionActions";

const PF = "font-[family-name:var(--font-playfair)]";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#C8541A]";

const ARROW = `hidden h-9 w-9 items-center justify-center rounded-full border border-[#EDE5D8] bg-[#FAF8F5] text-[#1C1C1C] transition-colors duration-150 hover:border-[#C8541A] hover:text-[#A8410F] sm:flex ${FOCUS}`;

/**
 * The spotlight slider: the news banner's card and timing, with the business's
 * Call / WhatsApp / Directions on the slide. Unlike the news banner the slide
 * is not one big link - it holds buttons, and links cannot nest - so the
 * poster and the name link to the detail page instead.
 */
export default function PromotionSpotlight({
  items,
  categoryLabels,
}: {
  items: PromotionView[];
  categoryLabels: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  // Auto-advance, held while a mouse or keyboard focus is on the slider so a
  // slide never changes under someone about to tap Call. Keyed on `index` so
  // the wait starts over after a manual step.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearTimeout(id);
  }, [count, paused, index]);

  if (count === 0) return null;

  const p = items[index % count];
  const poster = p.imageUrls[0] ?? p.logoUrl;
  const category = p.categoryKey ? categoryLabels[p.categoryKey] : undefined;
  const step = (by: number) => setIndex((i) => (i + by + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Spotlight"
      // Mouse only: a tap also fires "enter" but never "leave", which would
      // stop the slider for good on a phone.
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Fixed height, so slides of different lengths never move the page
          beneath the card. */}
      <div className="relative h-[300px] overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#F0E9DF]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0 grid grid-cols-[104px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] sm:grid-cols-[minmax(0,264px)_minmax(0,1fr)]"
          >
            {/* Poster plate. Flyers carry their own type, so they are shown
                whole, never cropped. */}
            <Link
              href={`/promotions/${p.slug}`}
              tabIndex={-1}
              aria-hidden
              className="group flex min-h-0 items-center justify-center border-r border-[#EDE5D8] bg-[#EDE0CC] p-3 sm:p-5"
            >
              {poster ? (
                <Image
                  src={poster}
                  alt=""
                  width={600}
                  height={850}
                  sizes="(max-width: 640px) 90px, 230px"
                  className="max-h-full w-auto max-w-full rounded-lg object-contain shadow-[0_6px_24px_rgba(28,10,0,0.18)] transition-transform duration-300 group-hover:scale-[1.02]"
                  priority={index === 0}
                />
              ) : (
                <Store className="h-8 w-8 text-[#9E6B3F]" strokeWidth={1.5} />
              )}
            </Link>

            <div className="flex min-h-0 min-w-0 flex-col p-4 sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C8541A] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8541A]" />
                </span>
                <span className="rounded-full border border-[#FDDCC8] bg-[#FFF3EC] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8541A]">
                  Spotlight
                </span>
                {count > 1 && (
                  <span className="ml-auto text-[11px] font-bold tabular-nums tracking-[0.12em] text-[#7A4F2A]">
                    {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </span>
                )}
              </div>

              <Link
                href={`/promotions/${p.slug}`}
                className={`${PF} mt-2.5 font-bold tracking-tight text-[#1C1C1C] line-clamp-2 hover:text-[#A8410F] sm:mt-4 ${FOCUS}`}
                style={{ fontSize: "clamp(1.15rem,2.7vw,2.2rem)", lineHeight: 1.12 }}
              >
                {p.name}
              </Link>

              {category && (
                <p className="mt-1.5 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#7A4F2A]">
                  {category}
                </p>
              )}

              <p className="mt-1.5 text-[13px] leading-snug text-[#6B6B6B] line-clamp-2 sm:mt-2 sm:text-[15px]">
                {p.tagline}
              </p>

              {p.offer && <OfferBadge offer={p.offer} className="mt-2.5 self-start" />}

              <PromotionActions promotion={p} directions compact className="mt-auto pt-3" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3 sm:justify-end">
          <div className="flex items-center">
            {items.map((it, i) => (
              // The visible dot is small; the button around it is a full
              // tap target.
              <button
                key={it.id}
                onClick={() => setIndex(i)}
                aria-label={`Show ${it.name} (${i + 1} of ${count})`}
                aria-current={i === index}
                className="flex h-8 min-w-6 items-center justify-center px-1"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === index ? "h-1.5 w-5 bg-[#C8541A]" : "h-1.5 w-1.5 bg-[#1C1C1C]/25"
                  }`}
                />
              </button>
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
    </section>
  );
}

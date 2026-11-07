"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export interface NewsItemMeta {
  id: string;
  headline: string;
  body: string;
  category: string;
  imageUrl?: string | null;
  publishedAt: string;
}

const CATEGORY: Record<string, { label: string; chip: string }> = {
  EVENTS:        { label: "Events",        chip: "bg-[#FFF3EC]/90 text-[#C8541A] border-[#FDDCC8]/60"  },
  COMMUNITY:     { label: "Community",     chip: "bg-green-50/90 text-green-700 border-green-200/60"    },
  ANNOUNCEMENTS: { label: "Announcements", chip: "bg-amber-50/90 text-amber-700 border-amber-200/60"    },
  SPORTS:        { label: "Sports",        chip: "bg-blue-50/90 text-blue-700 border-blue-200/60"       },
  GENERAL:       { label: "General",       chip: "bg-white/90 text-gray-600 border-gray-200/60"         },
};

const BG_FALLBACK: Record<string, string> = {
  EVENTS:        "bg-gradient-to-br from-[#7C2D00] to-[#C8541A]",
  COMMUNITY:     "bg-gradient-to-br from-green-900 to-green-600",
  ANNOUNCEMENTS: "bg-gradient-to-br from-amber-900 to-amber-600",
  SPORTS:        "bg-gradient-to-br from-blue-900 to-blue-600",
  GENERAL:       "bg-gradient-to-br from-gray-800 to-gray-600",
};

const SLIDE_DURATION = 5000;

function usePausableInterval(cb: () => void, delay: number) {
  const paused = useRef(false);
  const cbRef  = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const id = setInterval(() => { if (!paused.current) cbRef.current(); }, delay);
    return () => clearInterval(id);
  }, [delay]);

  return {
    pause: () => { paused.current = true; },
    resume: () => { paused.current = false; },
  };
}

export default function TodaysNewsFeed({ items }: { items: NewsItemMeta[] }) {
  const [index, setIndex]       = useState(0);
  const [direction, setDirection] = useState(1);
  const [dragging, setDragging] = useState(false);

  const go = useCallback((next: number, dir: number) => {
    setDirection(dir);
    setIndex((next + items.length) % items.length);
  }, [items.length]);

  const advance = useCallback(() => go(index + 1, 1), [go, index]);
  const { pause, resume } = usePausableInterval(advance, SLIDE_DURATION);

  function prev() { pause(); go(index - 1, -1); setTimeout(resume, 8000); }
  function next() { pause(); go(index + 1,  1); setTimeout(resume, 8000); }

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0   }),
    center:              ({ x: 0,                           opacity: 1   }),
    exit:   (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0   }),
  };

  /* ── Empty state ──────────────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div>
        <SectionHeader />
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center text-gray-400 bg-white border border-[#EDE5D8] rounded-2xl">
          <FileText className="h-9 w-9 mb-3 opacity-35" />
          <p className="font-medium text-gray-500 text-sm">No news posted yet.</p>
          <p className="text-xs mt-1 text-gray-400">Check back soon for community updates.</p>
        </div>
      </div>
    );
  }

  const item = items[index];
  const cat  = CATEGORY[item.category] ?? CATEGORY.GENERAL;

  return (
    <div>
      <SectionHeader />

      {/* ── Carousel ────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl select-none"
        style={{ aspectRatio: "16/7" }}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={item.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: [0.32, 0, 0.67, 0], duration: 0.42 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragStart={() => { setDragging(true); pause(); }}
            onDragEnd={(_e, info) => {
              setDragging(false);
              if (Math.abs(info.offset.x) > 60) {
                info.offset.x < 0 ? go(index + 1, 1) : go(index - 1, -1);
              }
              setTimeout(resume, 8000);
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {/* Image or fallback */}
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.headline}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className={`absolute inset-0 ${BG_FALLBACK[item.category] ?? BG_FALLBACK.GENERAL}`} />
            )}

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

            {/* Content */}
            <div className={`absolute inset-0 flex flex-col justify-end p-5 sm:p-8 ${dragging ? "pointer-events-none" : ""}`}>
              {/* Category + date row */}
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <span className={`inline-flex text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border backdrop-blur-sm ${cat.chip}`}>
                  {cat.label}
                </span>
                <span className="text-[10px] sm:text-xs text-white/55">{item.publishedAt}</span>
              </div>

              {/* Headline */}
              <h3 className="font-bold text-white text-lg sm:text-2xl lg:text-3xl leading-snug max-w-2xl drop-shadow-sm line-clamp-2">
                {item.headline}
              </h3>

              {/* Body */}
              <p className="text-white/75 text-xs sm:text-sm leading-relaxed mt-1.5 sm:mt-2 max-w-xl line-clamp-2 sm:line-clamp-3">
                {item.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Prev / Next arrows ─────────────────────────────────────────── */}
        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                         w-8 h-8 sm:w-10 sm:h-10 rounded-full
                         bg-black/30 hover:bg-black/50 backdrop-blur-sm
                         flex items-center justify-center text-white
                         transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                         w-8 h-8 sm:w-10 sm:h-10 rounded-full
                         bg-black/30 hover:bg-black/50 backdrop-blur-sm
                         flex items-center justify-center text-white
                         transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* ── Dot indicators ──────────────────────────────────────────────── */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3 sm:mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { pause(); go(i, i > index ? 1 : -1); setTimeout(resume, 8000); }}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? "w-5 sm:w-6 h-1.5 bg-[#C8541A]"
                  : "w-1.5 h-1.5 bg-[#C8541A]/25 hover:bg-[#C8541A]/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="mb-5 sm:mb-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8541A] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8541A]" />
        </span>
        <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#C8541A]">
          Today&apos;s News
        </span>
      </div>
      <p className="text-xs text-[#9E6B3F] ml-[18px]">Community events &amp; highlights</p>
    </div>
  );
}

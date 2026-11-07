"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, ImageOff, X, Play } from "lucide-react";
import { isVideoUrl } from "@/lib/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Props {
  images: GalleryImage[];
  title: string;
}

/* Renders an image via next/image or a video element for uploaded videos.
   Non-interactive videos show a muted first frame with a play badge. */
function GalleryMedia({
  url,
  alt,
  sizes,
  priority = false,
  contain = false,
  interactive = false,
}: {
  url: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  contain?: boolean;
  interactive?: boolean;
}) {
  if (isVideoUrl(url)) {
    return (
      <>
        <video
          src={url}
          className={`absolute inset-0 w-full h-full ${contain ? "object-contain" : "object-cover"}`}
          muted
          playsInline
          preload="metadata"
          controls={interactive}
        />
        {!interactive && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/50 backdrop-blur-sm rounded-full p-2.5">
              <Play className="w-4 h-4 text-white" fill="white" />
            </span>
          </span>
        )}
      </>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill
      className={contain ? "object-contain" : "object-cover"}
      sizes={sizes}
      priority={priority}
    />
  );
}

function ImageSlide({
  images,
  title,
  startIndex,
  rounded = false,
}: {
  images: GalleryImage[];
  title: string;
  startIndex: number;
  rounded?: boolean;
}) {
  const [a, b, c] = images;
  const cls = rounded ? "rounded-lg" : "";

  return (
    <div className="grid grid-cols-5 gap-1 w-full h-full">
      {/* Primary - 60% */}
      <div className={`col-span-3 relative overflow-hidden ${cls}`}>
        {a ? (
          <GalleryMedia url={a.url} alt={`${title} ${startIndex + 1}`} sizes="60vw" priority={startIndex === 0} interactive />
        ) : (
          <div className="w-full h-full bg-zinc-100" />
        )}
      </div>

      {/* Right stack - 40% */}
      <div className="col-span-2 grid grid-rows-2 gap-1">
        <div className={`relative overflow-hidden ${cls}`}>
          {b ? (
            <GalleryMedia url={b.url} alt={`${title} ${startIndex + 2}`} sizes="40vw" interactive />
          ) : (
            <div className="w-full h-full bg-zinc-100" />
          )}
        </div>
        <div className={`relative overflow-hidden ${cls}`}>
          {c ? (
            <GalleryMedia url={c.url} alt={`${title} ${startIndex + 3}`} sizes="40vw" interactive />
          ) : (
            <div className="w-full h-full bg-zinc-100" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertyGallery({ images, title }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);                   // desktop lightbox: groups of 3
  const [mobileIdx, setMobileIdx] = useState(0);         // mobile carousel active index
  const [mobileExpandedIdx, setMobileExpandedIdx] = useState(0); // mobile lightbox index
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setMobileIdx(idx);
    // keep active thumbnail visible
    const thumb = thumbsRef.current?.children[idx] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  function scrollToSlide(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }

  if (images.length === 0) {
    return (
      <div className="h-[220px] sm:h-[320px] lg:h-[440px] bg-zinc-100 rounded-xl flex flex-col items-center justify-center gap-3">
        <ImageOff className="w-10 h-10 text-zinc-300" />
        <span className="text-sm text-zinc-400 font-medium">No photos uploaded</span>
      </div>
    );
  }

  const totalPages = Math.ceil(images.length / 3);
  const hasMore = images.length > 3;

  function openExpanded(startIdx = 0) {
    setPage(Math.floor(startIdx / 3));
    setMobileExpandedIdx(startIdx);
    setExpanded(true);
  }

  return (
    <>
      {/* ── MOBILE carousel + thumbnail strip (md:hidden) ──────────── */}
      <div className="md:hidden space-y-2">
        {/* Main carousel */}
        <div className="relative h-[300px] rounded-xl overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex h-full overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                className="snap-start shrink-0 w-full h-full relative focus:outline-none"
                onClick={() => openExpanded(i)}
                aria-label={`View photo ${i + 1}`}
              >
                <GalleryMedia url={img.url} alt={`${title} ${i + 1}`} sizes="100vw" priority={i === 0} />
              </button>
            ))}
          </div>

          {/* Counter pill */}
          <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full pointer-events-none">
            {mobileIdx + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div
            ref={thumbsRef}
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => scrollToSlide(i)}
                className="shrink-0 relative rounded-md overflow-hidden transition-all duration-200"
                style={{
                  width: 52,
                  height: 40,
                  opacity: i === mobileIdx ? 1 : 0.45,
                  outline: i === mobileIdx ? "2px solid #FF5F15" : "2px solid transparent",
                  outlineOffset: 1,
                }}
                aria-label={`Go to photo ${i + 1}`}
              >
                <GalleryMedia url={img.url} alt="" sizes="52px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP 3-panel grid (hidden md:block) ──────────────────── */}
      <div className="hidden md:block relative h-[320px] lg:h-[440px] rounded-xl overflow-hidden">
        <ImageSlide images={images.slice(0, 3)} title={title} startIndex={0} rounded />
        {hasMore && (
          <button
            onClick={() => openExpanded(0)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white rounded-full p-2 transition-all shadow-lg"
            aria-label="View all photos"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── LIGHTBOX ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 sm:p-8"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-5xl"
              style={{ height: "clamp(260px, 65vh, 580px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setExpanded(false)}
                className="absolute -top-10 right-0 z-20 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* ── Mobile lightbox: single image ── */}
              <div className="md:hidden w-full h-full relative rounded-lg overflow-hidden bg-black">
                <GalleryMedia
                  url={images[mobileExpandedIdx].url}
                  alt={`${title} ${mobileExpandedIdx + 1}`}
                  sizes="100vw"
                  priority
                  contain
                  interactive
                />
                {mobileExpandedIdx > 0 && (
                  <button
                    onClick={() => setMobileExpandedIdx((i) => i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white rounded-full p-2.5 transition-all shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {mobileExpandedIdx < images.length - 1 && (
                  <button
                    onClick={() => setMobileExpandedIdx((i) => i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white rounded-full p-2.5 transition-all shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/55 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {mobileExpandedIdx + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* ── Desktop lightbox: 3-panel ImageSlide (unchanged) ── */}
              <div className="hidden md:block w-full h-full">
                <ImageSlide
                  images={images.slice(page * 3, page * 3 + 3)}
                  title={title}
                  startIndex={page * 3}
                  rounded
                />
                {page > 0 && (
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white rounded-full p-2.5 transition-all shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {page < totalPages - 1 && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white rounded-full p-2.5 transition-all shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {totalPages > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/55 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {page + 1} / {totalPages}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

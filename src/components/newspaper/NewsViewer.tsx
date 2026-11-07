"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  id: string;
  title: string;
  pageCount: number;
  /** Extra px above the viewer (e.g. breadcrumb strip) to subtract from the height */
  extraOffset?: number;
}

const proxyUrl = (id: string) => `/api/newspaper/${id}`;

const NAVBAR_H   = 60;
const CONTROLS_H = 48; // bottom bar
const A4         = 297 / 210; // 1.4142 - page height / width
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_IDX = 2;

function viewPages(viewIdx: number, perView: number, total: number): number[] {
  const start = viewIdx * perView + 1;
  const out: number[] = [];
  for (let i = 0; i < perView && start + i <= total; i++) out.push(start + i);
  return out;
}
function totalViews(total: number, perView: number) {
  return Math.ceil(total / perView);
}

export default function NewsViewer({ id, title, pageCount, extraOffset = 0 }: Props) {
  const [zoomIdx, setZoomIdx]   = useState(DEFAULT_IDX);
  const [numPages, setNumPages] = useState(pageCount);
  const [viewIdx, setViewIdx]   = useState(0);

  /* ── measure the page-area div ───────────────────────────── */
  const areaRef = useRef<HTMLDivElement>(null);
  const [areaW, setAreaW] = useState(0);
  const [areaH, setAreaH] = useState(0);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      setAreaW(el.clientWidth);
      setAreaH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isDesktop = areaW >= 768;
  const perView   = isDesktop ? 2 : 1;
  const views     = totalViews(numPages, perView);
  const gap       = isDesktop ? 16 : 0;

  // keep current page in view when layout switches
  const prevPerView = useRef(perView);
  useEffect(() => {
    if (prevPerView.current === perView) return;
    const first = viewIdx * prevPerView.current + 1;
    setViewIdx(Math.floor((first - 1) / perView));
    prevPerView.current = perView;
  }, [perView, viewIdx]);

  /* ── page size: fit the area so the whole page is visible ── */
  // Horizontal: leave 72px each side on desktop for arrows; 16px on mobile
  const hPad     = isDesktop ? 144 : 32;
  const byWidth  = areaW > 0 ? ((areaW - hPad - gap * (perView - 1)) / perView) : 400;
  // Vertical: leave 24px top + bottom
  const byHeight = areaH > 0 ? ((areaH - 48) / A4) : 600;
  const base     = Math.max(60, Math.min(byWidth, byHeight));
  const zoom     = ZOOM_STEPS[zoomIdx];
  const slot     = Math.round(base * zoom);

  const pages     = viewPages(viewIdx, perView, numPages);
  const pageLabel = isDesktop
    ? pages.length === 2 ? `${pages[0]}–${pages[1]} / ${numPages}` : `${pages[0]} / ${numPages}`
    : `${pages[0]} / ${numPages}`;

  const goNext = useCallback(() => setViewIdx(v => Math.min(v + 1, views - 1)), [views]);
  const goPrev = useCallback(() => setViewIdx(v => Math.max(v - 1, 0)), []);

  const zoomIn  = useCallback(() => setZoomIdx(i => Math.min(i + 1, ZOOM_STEPS.length - 1)), []);
  const zoomOut = useCallback(() => setZoomIdx(i => Math.max(i - 1, 0)), []);

  // swipe
  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const d = touchX.current - e.changedTouches[0].clientX;
    if (d > 50) goNext(); else if (d < -50) goPrev();
  };
  // tap half on mobile
  const onTap = (e: React.MouseEvent) => {
    if (isDesktop) return;
    e.clientX < window.innerWidth / 2 ? goPrev() : goNext();
  };

  const readerH = `calc(100dvh - ${NAVBAR_H + extraOffset}px)`;

  const progress = Math.round(((viewIdx + 1) / Math.max(views, 1)) * 100);

  return (
    <div className="flex flex-col bg-[#1C1C1C]" style={{ height: readerH }}>

      {/* ── Reading progress bar ──────────────────────────────────────── */}
      <div className="h-[3px] shrink-0 bg-white/5">
        <div
          className="h-full bg-[#C8541A] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Page area ─────────────────────────────────────────────────── */}
      <div
        ref={areaRef}
        className="flex-1 relative flex items-center justify-center overflow-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={onTap}
        style={{ cursor: isDesktop ? "default" : "pointer" }}
      >
        {areaW > 0 && slot > 0 && (
          <Document
            file={proxyUrl(id)}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={
              <div className="flex flex-col items-center justify-center gap-3 text-white/30">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading…</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-red-400 font-medium">Failed to load PDF.</p>
                <p className="text-xs text-white/30">Try refreshing the page.</p>
              </div>
            }
          >
            <div className="flex items-center justify-center" style={{ gap }}>
              {pages.map(n => (
                <div key={n}
                     className="shadow-2xl overflow-hidden bg-white"
                     style={{ width: slot, flexShrink: 0 }}>
                  <Page
                    pageNumber={n}
                    width={slot}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={
                      <div className="bg-[#2a2a2a] flex items-center justify-center"
                           style={{ width: slot, height: Math.round(slot * A4) }}>
                        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </Document>
        )}

        {/* Desktop side arrows - float in the dark margins */}
        {isDesktop && (
          <>
            <button
              onClick={e => { e.stopPropagation(); goPrev(); }}
              disabled={viewIdx === 0}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-10
                         w-11 h-11 rounded-full bg-white/10 hover:bg-white/20
                         flex items-center justify-center
                         text-white/60 hover:text-white
                         disabled:opacity-20 disabled:cursor-default
                         transition-all active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); goNext(); }}
              disabled={viewIdx >= views - 1}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-10
                         w-11 h-11 rounded-full bg-white/10 hover:bg-white/20
                         flex items-center justify-center
                         text-white/60 hover:text-white
                         disabled:opacity-20 disabled:cursor-default
                         transition-all active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* ── Bottom controls bar ───────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-center gap-1 px-4
                   border-t border-white/10 bg-[#1C0A00]"
        style={{ height: CONTROLS_H }}
      >
        {/* Mobile prev */}
        <button onClick={goPrev} disabled={viewIdx === 0}
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center
                     text-white/50 hover:text-white hover:bg-white/10
                     disabled:opacity-20 transition-all mr-1">
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Zoom out */}
        <button onClick={zoomOut} disabled={zoomIdx === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-white/50 hover:text-white hover:bg-white/10
                     disabled:opacity-20 transition-all">
          <ZoomOut className="h-4 w-4" />
        </button>

        {/* Zoom % */}
        <span className="text-xs font-semibold text-white/40 tabular-nums min-w-[2.5rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        {/* Zoom in */}
        <button onClick={zoomIn} disabled={zoomIdx === ZOOM_STEPS.length - 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-white/50 hover:text-white hover:bg-white/10
                     disabled:opacity-20 transition-all">
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Divider */}
        <span className="w-px h-4 bg-white/10 mx-2" />

        {/* Page counter */}
        <span className="text-xs text-white/30 tabular-nums">{pageLabel}</span>

        {/* Divider */}
        <span className="w-px h-4 bg-white/10 mx-2" />

        {/* Download */}
        <a href={`/api/newspaper/${id}?download=1`} download={`${title}.pdf`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-white/50
                     hover:text-white hover:bg-white/10 transition-all
                     px-3 h-8 rounded-lg">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PDF</span>
        </a>

        {/* Mobile next */}
        <button onClick={goNext} disabled={viewIdx >= views - 1}
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center
                     text-white/50 hover:text-white hover:bg-white/10
                     disabled:opacity-20 transition-all ml-1">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

    </div>
  );
}

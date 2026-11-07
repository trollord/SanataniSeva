"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, FileText } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function EditionCover({ id }: { id: string }) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [px, setPx]           = useState(0);
  const [visible, setVisible] = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState(false);

  // measure real pixel width so react-pdf can fill it exactly
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPx(el.clientWidth));
    ro.observe(el);
    setPx(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // only fetch the PDF when the thumbnail scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // aspect-ratio keeps the box A4-shaped at any parent width
    <div ref={wrapRef} className="relative w-full" style={{ aspectRatio: "210 / 297" }}>

      {/* skeleton — sits behind, disappears once the page renders */}
      {!done && !err && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          {visible && <Loader2 className="h-5 w-5 animate-spin text-gray-300" />}
        </div>
      )}

      {visible && !err && px > 0 && (
        <Document
          file={`/api/newspaper/${id}`}
          onLoadError={() => setErr(true)}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={1}
            width={px}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            onRenderSuccess={() => setDone(true)}
            loading={null}
          />
        </Document>
      )}

      {err && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-1.5 text-gray-400">
          <FileText className="h-6 w-6" />
          <span className="text-[10px] font-medium">No preview</span>
        </div>
      )}
    </div>
  );
}

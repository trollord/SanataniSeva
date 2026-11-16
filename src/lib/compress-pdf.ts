/**
 * Browser-side shrinking for newspaper editions, the PDF counterpart of
 * compress-image.ts.
 *
 * Editions arrive as print exports - 8 pages can be 200 MB - which would take
 * minutes to upload and minutes more for every resident to open. Each page is
 * redrawn as a 200 dpi JPEG on a page of the original size: body text stays
 * crisp when zoomed and a typical edition lands around 10-15 MB. The cost is
 * that text in the result can no longer be selected, which readers of a
 * page-flip edition never need.
 */

import { PDFDocument } from "pdf-lib";

/** Smaller files are uploaded untouched: already quick, and keep their text. */
export const PDF_COMPRESS_FROM_BYTES = 15 * 1024 * 1024;

const DPI = 200;
const JPEG_QUALITY = 0.8;
// iOS Safari refuses canvases above ~16.7 MP; stay well under it, and under
// the memory a 4-byte-per-pixel bitmap of that size takes.
const MAX_PIXELS = 12_000_000;

/**
 * Returns a smaller copy of `file`, or `file` itself when it is small already
 * or the copy would not be smaller. `onPage(done, total)` reports progress.
 */
export async function compressPdf(
  file: File,
  onPage?: (done: number, total: number) => void
): Promise<File> {
  if (file.size < PDF_COMPRESS_FROM_BYTES) return file;

  // Loaded on demand: pdf.js touches browser globals at import time and is
  // large, and only an admin uploading a big edition needs it.
  const { pdfjs } = await import("react-pdf");
  // Same worker as the edition viewer (EditionCover), so the versions match
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const source = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const out = await PDFDocument.create();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  try {
    for (let n = 1; n <= source.numPages; n++) {
      const page = await source.getPage(n);
      // Scale 1 is the page in PDF points (1/72 inch), the size the copy keeps
      const size = page.getViewport({ scale: 1 });
      let scale = DPI / 72;
      const pixels = size.width * size.height * scale * scale;
      if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);
      const viewport = page.getViewport({ scale });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      // JPEG has no transparency: paint the paper white first
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      page.cleanup();

      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", JPEG_QUALITY)
      );
      if (!blob) throw new Error(`Could not redraw page ${n}`);
      const jpg = await out.embedJpg(await blob.arrayBuffer());
      out
        .addPage([size.width, size.height])
        .drawImage(jpg, { x: 0, y: 0, width: size.width, height: size.height });
      onPage?.(n, source.numPages);
    }
  } finally {
    // Hand the backing store back now: iOS caps total canvas memory
    canvas.width = canvas.height = 0;
    await source.destroy();
  }

  const bytes = await out.save();
  if (bytes.length >= file.size) return file;
  return new File([bytes as BlobPart], file.name, { type: "application/pdf", lastModified: Date.now() });
}

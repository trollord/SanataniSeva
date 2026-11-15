/**
 * Browser-side photo shrinking, shared by every form that uploads to S3.
 *
 * A phone photo is typically 3-6 MB and far larger than any slot that displays
 * it, so uploading the original is slow and often blows the 2 MB limit for no
 * visible gain. Downscaling to 1600px and re-encoding as JPEG usually lands
 * around 200-400 KB - roughly a tenfold cut in upload time.
 */

/** Same per-image cap /api/upload enforces. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const MAX_EDGE = 1600;

/**
 * Falls back to the original file if anything goes wrong (HEIC that the browser
 * cannot decode, for instance), so a failure here never blocks an upload that
 * would otherwise have succeeded. Anything that is not an image passes through.
 */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    // Already small enough and within budget - leave it alone.
    if (scale === 1 && file.size <= MAX_IMAGE_BYTES) {
      bitmap.close?.();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.82)
    );
    // Hand the backing store back now rather than at GC: iOS Safari caps total
    // canvas memory, and a batch of photos would otherwise pile up against it.
    canvas.width = canvas.height = 0;
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/**
 * Runs at most `max` tasks at once, starting queued ones in call order as
 * slots free up. A task that throws frees its slot like one that resolves.
 */
export function createLimiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    // A finishing task hands its slot straight to the next in line, so a call
    // arriving in between can never squeeze past the cap.
    if (active < max) active++;
    else await new Promise<void>((start) => queue.push(start));
    try {
      return await task();
    } finally {
      const next = queue.shift();
      if (next) next();
      else active--;
    }
  };
}

// Decoding a 12 MP photo holds ~48 MB of pixels until it is drawn, so ten
// dropped at once could exhaust a phone's memory. Shared by every form, so two
// quick drops still queue behind each other rather than doubling the load.
const limit = createLimiter(3);

/** Shrinks a photo for upload, at most three at a time across the page. */
export function compressImage(file: File): Promise<File> {
  return limit(() => compress(file));
}

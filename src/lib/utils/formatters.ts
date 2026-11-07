export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sq.ft`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// SQLite stores amenities as a JSON string; PostgreSQL uses a native array.
// Always pass DB values through these helpers to keep the rest of the code consistent.
export function parseAmenities(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

export function stringifyAmenities(amenities: string[]): string {
  return JSON.stringify(amenities);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Whole days from `start` to `end` (or now). Null when start is missing. */
export function turnaroundDays(
  start: Date | string | null | undefined,
  end?: Date | string | null
): number | null {
  if (!start) return null;
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, Math.round((e - s) / 86_400_000));
}

/** True when a media URL (or filename) points at an uploaded video. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}

/**
 * Business promotions: the shapes a promotion travels in and the pure rules
 * shared by /promotions, the admin screen and the API - visibility by IST
 * date, slugs, link normalisation, and the form schema both sides validate
 * with.
 *
 * No Prisma here - the admin form and the public browser import this on the
 * client. The cached loader lives in promotions-data.ts.
 */
import { z } from "zod";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";
import { parsePhone } from "@/lib/phone";

export const MAX_PROMOTION_PHOTOS = 8;
export const PROMOTION_TAGLINE_MAX = 120;

/** Appended to every directions search, so a bare "Shop 4, Rodas" resolves locally. */
export const ESTATE_AREA = "Hiranandani Estate, Thane";

/**
 * A promotion as the pages render it. Dates are "YYYY-MM-DD" strings rather
 * than Date objects: they are calendar days, and the cached loader would turn
 * a Date into a string anyway.
 */
export interface PromotionView {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categoryKey: string | null;
  offer: string | null;
  phone: string | null;
  whatsapp: boolean;
  website: string | null;
  instagram: string | null;
  address: string | null;
  locality: string | null;
  hours: string | null;
  logoUrl: string | null;
  imageUrls: string[];
  spotlight: boolean;
  sortOrder: number;
  hidden: boolean;
  startsOn: string | null;
  endsOn: string | null;
  updatedAt: string;
}

/* ── Dates and visibility ───────────────────────────────────────────────── */

/**
 * startsAt / endsAt are DATE columns, which Prisma returns as UTC midnight, so
 * the UTC calendar date is exactly the stored day - no timezone arithmetic.
 */
export function dateToYmd(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** The inverse, for writing a DATE column. */
export function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`);
}

/** A real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30). */
export function isYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = ymdToDate(s);
  return !Number.isNaN(d.getTime()) && dateToYmd(d) === s;
}

/** "30 November 2026" for a stored day, without letting the server's zone shift it. */
export function formatYmd(ymd: string): string {
  return ymdToDate(ymd).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type PromotionStatus = "LIVE" | "SCHEDULED" | "EXPIRED" | "HIDDEN";

/**
 * The one visibility rule. `today` is the IST date (istToday()), and both ends
 * are inclusive: a promotion ending on the 30th is still up all of the 30th
 * in Thane. Days compare as strings, which sort like dates in this form.
 */
export function promotionStatus(
  p: { hidden: boolean; startsOn: string | null; endsOn: string | null },
  today: string
): PromotionStatus {
  if (p.hidden) return "HIDDEN";
  if (p.startsOn && p.startsOn > today) return "SCHEDULED";
  if (p.endsOn && p.endsOn < today) return "EXPIRED";
  return "LIVE";
}

export function isPromotionLive(
  p: { hidden: boolean; startsOn: string | null; endsOn: string | null },
  today: string
): boolean {
  return promotionStatus(p, today) === "LIVE";
}

/* ── Slugs ──────────────────────────────────────────────────────────────── */

/**
 * URL slug for a new promotion, unique against `taken`. Fixed after create, so
 * a link shared on WhatsApp keeps working when the business is renamed.
 */
export function promotionSlug(name: string, taken: Iterable<string> = []): string {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // é -> e
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/['’]/g, "") // "Raju's" -> "rajus", not "raju-s"
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "business"; // a name in Devanagari alone slugs to nothing
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

/* ── Links ──────────────────────────────────────────────────────────────── */

/**
 * "example.com", "www.example.com/menu" or a full http(s) URL, as an absolute
 * URL; null when it is not a plausible public web address. Admins paste from
 * visiting cards, so a missing scheme is the common case.
 */
export function normaliseWebsite(input: string): string | null {
  const v = input.trim();
  if (!v || /\s/.test(v)) return null;
  const hasScheme = /^https?:\/\//i.test(v);
  if (!hasScheme && v.includes("://")) return null; // ftp://, javascript:// …
  let url: URL;
  try {
    url = new URL(hasScheme ? v : `https://${v}`);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  // A dotted host with a real-looking TLD; rules out "localhost" and typos
  // like "mysite" that would otherwise become https://mysite/.
  if (!/^([a-z0-9-]+\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(url.hostname)) return null;
  return url.href;
}

/** "example.com/menu" for display: no scheme, no www, no trailing slash. */
export function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

/** Instagram paths that are not profiles, so never a business's handle. */
const INSTAGRAM_NON_PROFILE = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct"]);

/**
 * "@shop", "shop", "instagram.com/shop" or a full profile URL (with any
 * ?igsh= tracking) as "https://www.instagram.com/shop/"; null when it is not
 * a valid handle. Handles are 1-30 letters, digits, dots and underscores.
 */
export function normaliseInstagram(input: string): string | null {
  const v = input.trim().replace(/^@/, "");
  if (!v) return null;
  const fromUrl = v.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/@?([^/?#]+)/i);
  if (!fromUrl && /[/:]/.test(v)) return null; // some other site's URL
  const handle = (fromUrl ? fromUrl[1] : v).toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) return null;
  if (handle.startsWith(".") || handle.endsWith(".") || handle.includes("..")) return null;
  if (INSTAGRAM_NON_PROFILE.has(handle)) return null;
  return `https://www.instagram.com/${handle}/`;
}

/** "@shop" for display. */
export function instagramLabel(url: string): string {
  const handle = url.match(/instagram\.com\/([^/?#]+)/i)?.[1];
  return handle ? `@${handle}` : url;
}

/**
 * Google Maps search for the business's address. A part already contained in
 * another is dropped, so locality "Hiranandani Estate" does not repeat the
 * area; "Others" is not a place.
 */
export function directionsUrl(address: string | null, locality: string | null): string {
  const raw = [address, locality === "Others" ? null : locality, ESTATE_AREA]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  const parts = raw.filter(
    (p, i) => !raw.some((q, j) => j !== i && q.toLowerCase().includes(p.toLowerCase()) && (q.length > p.length || j < i))
  );
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

/** Phone and WhatsApp buttons share this: WhatsApp only exists on mobiles. */
export function canWhatsApp(p: { phone: string | null; whatsapp: boolean }): boolean {
  return Boolean(p.phone && p.whatsapp && parsePhone(p.phone).kind === "mobile");
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/* ── Search ─────────────────────────────────────────────────────────────── */

/** Every word of the query must appear in the name, tagline, offer or category. */
export function matchesPromotionSearch(
  p: { name: string; tagline: string; offer: string | null },
  categoryLabel: string | null,
  query: string
): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [p.name, p.tagline, p.offer, categoryLabel].filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
}

/* ── Images ─────────────────────────────────────────────────────────────── */

/**
 * The S3 key behind one of our public URLs, or null for any other URL.
 * Images must be ones we uploaded (same rule as news), and the key is what a
 * delete needs. Fails closed when no bucket is configured.
 */
export function s3KeyFromUrl(
  url: string,
  bucketUrl: string | undefined = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL
): string | null {
  if (!bucketUrl) return null;
  const base = `${bucketUrl.replace(/\/$/, "")}/`;
  if (!url.startsWith(base)) return null;
  const key = url.slice(base.length);
  return key && !key.includes("..") ? key : null;
}

/** S3 keys in `before` that `after` no longer references: what an edit or delete frees. */
export function droppedKeys(before: (string | null)[], after: (string | null)[]): string[] {
  const kept = new Set(after.filter(Boolean));
  return [...new Set(before.filter((k): k is string => Boolean(k) && !kept.has(k)))];
}

/* ── Form ───────────────────────────────────────────────────────────────── */

const LOCALITIES: readonly string[] = HIRANANDANI_LOCALITIES;

const capped = (max: number, what: string) =>
  z.string().trim().max(max, `Keep the ${what} under ${max} characters`);

/**
 * The admin form, validated in the dialog and again by the API. Every field is
 * a string as typed ("" = not set); toPromotionFields() turns a valid one into
 * columns. Rules that need the database (does the category exist?) are the
 * API's.
 */
export const promotionFormSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the business name").max(80, "Keep the name under 80 characters"),
    tagline: z
      .string()
      .trim()
      .min(1, "Enter a one-line tagline")
      .max(PROMOTION_TAGLINE_MAX, `Keep the tagline under ${PROMOTION_TAGLINE_MAX} characters`),
    categoryKey: z.string(),
    offer: capped(120, "offer"),
    description: capped(4000, "description"),
    phone: capped(40, "number"),
    whatsapp: z.boolean(),
    website: capped(300, "web address"),
    instagram: capped(300, "Instagram link"),
    address: capped(200, "address"),
    locality: z.string(),
    hours: capped(120, "hours"),
    logoUrl: z.string(),
    imageUrls: z.array(z.string()).max(MAX_PROMOTION_PHOTOS, `Up to ${MAX_PROMOTION_PHOTOS} photos`),
    spotlight: z.boolean(),
    startsOn: z.string(),
    endsOn: z.string(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    if (v.phone) {
      const p = parsePhone(v.phone);
      if (!p.valid) issue("phone", p.reason ?? "Enter a valid number");
      else if (p.kind === "shortcode") issue("phone", "Enter the full number, with the STD code for a landline");
      else if (v.whatsapp && p.kind !== "mobile") issue("whatsapp", "WhatsApp needs a mobile number");
    }
    // With no number the WhatsApp tick is simply ignored (it is on by
    // default, and most promotions will have a mobile).

    if (v.website && !normaliseWebsite(v.website)) issue("website", "Enter a web address, e.g. example.com");
    if (v.instagram && !normaliseInstagram(v.instagram)) {
      issue("instagram", "Enter a handle like @shopname, or a link to the profile");
    }
    if (v.locality && !LOCALITIES.includes(v.locality)) issue("locality", "Pick a locality from the list");

    if (v.startsOn && !isYmd(v.startsOn)) issue("startsOn", "Enter a valid date");
    if (v.endsOn && !isYmd(v.endsOn)) issue("endsOn", "Enter a valid date");
    if (isYmd(v.startsOn) && isYmd(v.endsOn) && v.endsOn < v.startsOn) {
      issue("endsOn", "The end date must be on or after the start date");
    }
  });

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;

/**
 * Columns for a valid form, minus slug, sortOrder and hidden, which have their
 * own rules. Links and the phone are stored normalised so every surface shows
 * the same thing; images that are not ours are dropped, as news does.
 */
export function toPromotionFields(v: PromotionFormValues, bucketUrl?: string) {
  const orNull = (s: string) => s || null;
  const images = v.imageUrls
    .map((url) => ({ url, key: s3KeyFromUrl(url, bucketUrl) }))
    .filter((i): i is { url: string; key: string } => i.key !== null)
    .slice(0, MAX_PROMOTION_PHOTOS);
  const logoKey = v.logoUrl ? s3KeyFromUrl(v.logoUrl, bucketUrl) : null;
  const phone = v.phone ? parsePhone(v.phone) : null;

  return {
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    categoryKey: orNull(v.categoryKey),
    offer: orNull(v.offer),
    phone: phone?.valid ? phone.display : null,
    whatsapp: v.whatsapp && phone?.kind === "mobile",
    website: v.website ? normaliseWebsite(v.website) : null,
    instagram: v.instagram ? normaliseInstagram(v.instagram) : null,
    address: orNull(v.address),
    locality: orNull(v.locality),
    hours: orNull(v.hours),
    logoUrl: logoKey ? v.logoUrl : null,
    logoKey,
    imageUrls: images.map((i) => i.url),
    imageKeys: images.map((i) => i.key),
    spotlight: v.spotlight,
    startsAt: v.startsOn ? ymdToDate(v.startsOn) : null,
    endsAt: v.endsOn ? ymdToDate(v.endsOn) : null,
  };
}

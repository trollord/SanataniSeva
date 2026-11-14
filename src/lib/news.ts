/**
 * Validation for the editable fields of a news post, shared by create (POST
 * /api/news) and edit (PUT /api/news/[id]) so the two cannot drift apart.
 */

/**
 * Images must be ones we uploaded. The field used to accept a pasted URL, and
 * an admin should not be able to hotlink an arbitrary host into the feed.
 * Fails closed: with no bucket configured nothing is accepted, rather than
 * falling back to a prefix like "https://" that would match anything.
 */
const BUCKET_URL = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL;

export const MAX_NEWS_IMAGES = 6;

export interface NewsContent {
  headline: string;
  body: string;
  category: string;
  imageUrls: string[];
}

export function parseNewsContent(
  input: unknown
): { ok: true; data: NewsContent } | { ok: false; error: string } {
  const { headline, body, category, imageUrls } = (input ?? {}) as Record<string, unknown>;
  if (
    typeof headline !== "string" ||
    typeof body !== "string" ||
    !headline.trim() ||
    !body.trim()
  ) {
    return { ok: false, error: "headline and body are required" };
  }

  return {
    ok: true,
    data: {
      headline: headline.trim(),
      body: body.trim(),
      category: typeof category === "string" ? category : "GENERAL",
      imageUrls: Array.isArray(imageUrls)
        ? imageUrls
            .filter((u: unknown): u is string => typeof u === "string")
            .map((u) => u.trim())
            .filter((u) => (BUCKET_URL ? u.startsWith(BUCKET_URL) : false))
            .slice(0, MAX_NEWS_IMAGES)
        : [],
    },
  };
}

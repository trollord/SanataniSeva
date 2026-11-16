/**
 * Server side of promotions: the cached loader the public pages read, and the
 * revalidation every admin write runs. Pure rules are in promotions.ts.
 */
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { istToday } from "@/lib/bus";
import { deleteS3Object } from "@/lib/s3";
import { dateToYmd, isPromotionLive, promotionSlug, type PromotionView } from "@/lib/promotions";

export const PROMOTIONS_TAG = "promotions";

/**
 * Every promotion that is not hidden, in display order. Dates are left to the
 * caller (see getLivePromotions) rather than filtered here, so a cached list
 * never shows yesterday's idea of "today". A handful of rows, read on every
 * public render and written rarely: cached across requests, expired by
 * revalidatePromotions() on each write; the hour is only a backstop.
 */
const getUnhiddenPromotions = unstable_cache(
  async (): Promise<PromotionView[]> => {
    const rows = await prisma.promotion.findMany({
      where: { hidden: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        categoryKey: true,
        offer: true,
        phone: true,
        whatsapp: true,
        website: true,
        instagram: true,
        address: true,
        locality: true,
        hours: true,
        logoUrl: true,
        imageUrls: true,
        spotlight: true,
        sortOrder: true,
        hidden: true,
        startsAt: true,
        endsAt: true,
        updatedAt: true,
      },
    });
    return rows.map(({ startsAt, endsAt, updatedAt, ...p }) => ({
      ...p,
      startsOn: dateToYmd(startsAt),
      endsOn: dateToYmd(endsAt),
      updatedAt: updatedAt.toISOString(),
    }));
  },
  ["promotions-v1"],
  { tags: [PROMOTIONS_TAG], revalidate: 3600 }
);

/** What the public sees today (IST): /promotions, the detail pages, the sitemap. */
export async function getLivePromotions(): Promise<PromotionView[]> {
  const today = istToday();
  return (await getUnhiddenPromotions()).filter((p) => isPromotionLive(p, today));
}

/** One live promotion by slug, or null - hidden, scheduled and expired alike 404. */
export async function getLivePromotion(slug: string): Promise<PromotionView | null> {
  return (await getLivePromotions()).find((p) => p.slug === slug) ?? null;
}

/**
 * After any promotion write. `expire: 0` so the admin who just saved sees the
 * change on reload. The sitemap is force-dynamic and reads the same cache, so
 * the tag covers it.
 */
export function revalidatePromotions(slug?: string) {
  revalidateTag(PROMOTIONS_TAG, { expire: 0 });
  revalidatePath("/promotions");
  if (slug) revalidatePath(`/promotions/${slug}`);
  revalidatePath("/admin/promotions");
}

/**
 * The form's category against the database - not the cache, so a write is
 * never checked against a stale list. Returns the error to show, or null.
 */
export async function checkPromotionCategory(categoryKey: string | null): Promise<string | null> {
  if (!categoryKey) return null;
  const found = await prisma.directoryCategory.findUnique({
    where: { key: categoryKey },
    select: { key: true },
  });
  return found ? null : "Pick a category from the list";
}

/**
 * Removes images a promotion no longer uses. Runs after the database write, and
 * a failure only leaves an orphaned object behind - never a promotion pointing
 * at a missing image - so it is logged, not surfaced.
 */
export async function deletePromotionObjects(keys: string[]) {
  const results = await Promise.allSettled(keys.map((key) => deleteS3Object(key)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[promotions] could not delete S3 object ${keys[i]}`, r.reason);
  });
}

/**
 * A slug for a new promotion, unique against every existing one (hidden and
 * expired included - they still own their URL).
 */
export async function uniquePromotionSlug(name: string): Promise<string> {
  const base = promotionSlug(name);
  const taken = await prisma.promotion.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  return promotionSlug(name, taken.map((t) => t.slug));
}

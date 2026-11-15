import type { Prisma } from "@prisma/client";

/**
 * Photo order for a listing, shared by properties and marketplace items.
 *
 * Neither image table has a position column, so the lister's order is carried
 * by createdAt: writes give each row a strictly increasing timestamp in the
 * order sent. isPrimary leads so the thumbnail stays first for listings saved
 * before ordering was honoured; id breaks any exact-timestamp tie
 * deterministically.
 */
const LISTING_IMAGE_ORDER = [
  { isPrimary: "desc" },
  { createdAt: "asc" },
  { id: "asc" },
] satisfies Record<string, Prisma.SortOrder>[];

export const PROPERTY_IMAGE_ORDER: Prisma.PropertyImageOrderByWithRelationInput[] =
  LISTING_IMAGE_ORDER;

export const ITEM_IMAGE_ORDER: Prisma.ItemImageOrderByWithRelationInput[] =
  LISTING_IMAGE_ORDER;

/**
 * Image rows to write for a stills-only listing (marketplace items), in the
 * order given: createdAt 1 ms apart is what LISTING_IMAGE_ORDER reads back, and
 * photo 1 is the only primary whatever the client flagged. One write would
 * otherwise stamp every row with the same now().
 */
export function orderedImageRows(
  images: readonly { url: string; s3Key: string }[],
  base: number = Date.now()
) {
  return images.map((img, i) => ({
    url: img.url,
    s3Key: img.s3Key,
    isPrimary: i === 0,
    createdAt: new Date(base + i),
  }));
}

/**
 * The property equivalent of orderedImageRows. A property's media can open
 * with a video, and the lead must be a still (see markPrimary), so the first
 * row the client flagged keeps the primary role instead of photo 1 - still at
 * most one, and none for an all-video set.
 */
export function orderedPropertyImageRows(
  images: readonly { url: string; s3Key: string; isPrimary?: boolean }[],
  base: number = Date.now()
) {
  const primary = images.findIndex((img) => img.isPrimary);
  return orderedImageRows(images, base).map((row, i) => ({
    ...row,
    isPrimary: i === primary,
  }));
}

/**
 * Moves the item at `from` to `to`, shifting the items between them by one.
 * The result is always a permutation of the input, so positions can never
 * collide or leave gaps. Out-of-range indexes return the list unchanged.
 */
export function moveToPosition<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) {
    return next;
  }
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Flags the first still as primary and clears every other flag. Listing cards
 * need a still thumbnail, so a video in position 1 hands the role to the next
 * photo rather than leaving the listing without one.
 */
export function markPrimary<T extends { isPrimary: boolean }>(
  list: readonly T[],
  isVideo: (item: T) => boolean
): T[] {
  const lead = list.findIndex((m) => !isVideo(m));
  return list.map((m, i) =>
    m.isPrimary === (i === lead) ? m : { ...m, isPrimary: i === lead }
  );
}

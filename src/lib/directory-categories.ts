/**
 * Server side of the service-provider taxonomy: the cached category loader and
 * the checks every contact write runs. Pure helpers are in directory.ts.
 */
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { DirectoryCategoryView } from "@/lib/directory";

export const DIRECTORY_CATEGORIES_TAG = "directory-categories";

/** A category or subcategory name as the admin APIs accept it. */
export const directoryLabel = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1, "Enter a name").max(60, "Keep the name under 60 characters"));

/**
 * Every category with its subcategories, in display order. Read on every
 * public and admin render, written rarely, so it is cached across requests and
 * expired by revalidateDirectory() on each write; the hour is only a backstop.
 */
export const getDirectoryCategories = unstable_cache(
  async (): Promise<DirectoryCategoryView[]> =>
    prisma.directoryCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        key: true,
        label: true,
        icon: true,
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          select: { id: true, label: true },
        },
      },
    }),
  ["directory-categories-v1"],
  { tags: [DIRECTORY_CATEGORIES_TAG], revalidate: 3600 }
);

/**
 * After any category or subcategory write. `expire: 0` rather than
 * stale-while-revalidate: the admin who just made the change reloads the page
 * straight away and must see it. The paths are the pages that render the
 * taxonomy; /community is ISR, the admin pages are dynamic but read the cache.
 */
export function revalidateDirectory() {
  revalidateTag(DIRECTORY_CATEGORIES_TAG, { expire: 0 });
  revalidatePath("/community");
  revalidatePath("/admin/community");
  revalidatePath("/admin/categories");
}

/**
 * Validates a contact's category and optional subcategory against the
 * database - not the cache, so a write is never checked against a stale list.
 * Returns the error to show, or null when the pair is valid.
 */
export async function checkCategoryChoice(
  category: string,
  subcategoryId: string | null | undefined
): Promise<string | null> {
  const [cat, sub] = await Promise.all([
    prisma.directoryCategory.findUnique({ where: { key: category }, select: { key: true } }),
    subcategoryId
      ? prisma.directorySubcategory.findUnique({
          where: { id: subcategoryId },
          select: { categoryKey: true },
        })
      : null,
  ]);
  if (!cat) return "Pick a valid category";
  if (subcategoryId && sub?.categoryKey !== category) {
    return "That subcategory does not belong to the chosen category";
  }
  return null;
}

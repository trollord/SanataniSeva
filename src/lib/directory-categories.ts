/**
 * Server side of the service-provider taxonomy: the cached category and
 * contact loaders, their revalidation, and the checks every contact write
 * runs. Pure helpers are in directory.ts.
 */
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { DirectoryCategoryView } from "@/lib/directory";

export const DIRECTORY_CATEGORIES_TAG = "directory-categories";
export const DIRECTORY_CONTACTS_TAG = "directory-contacts";

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
 * After any contact create, edit, status change or delete. The per-category
 * pages are dynamic, so expiring the tag their loaders carry is enough.
 */
export function revalidateDirectoryContacts() {
  revalidateTag(DIRECTORY_CONTACTS_TAG, { expire: 0 });
  revalidatePath("/community");
  revalidatePath("/admin/community");
}

/** What the public directory shows: published, and with a number to call. */
const PUBLIC_CONTACT = {
  status: "ACTIVE",
  phones: { isEmpty: false },
} satisfies Prisma.CommunityContactWhereInput;

// Tagged with the categories tag too: deleting a subcategory un-assigns its
// contacts in the database without going through a contact write.
const CONTACT_CACHE = {
  tags: [DIRECTORY_CONTACTS_TAG, DIRECTORY_CATEGORIES_TAG],
  revalidate: 3600,
};

/** Published contacts per category key, for the crawlable category pages. */
export const getDirectoryCategoryCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const rows = await prisma.communityContact.groupBy({
      by: ["category"],
      where: PUBLIC_CONTACT,
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.category, r._count._all]));
  },
  ["directory-category-counts-v1"],
  CONTACT_CACHE
);

export type DirectoryCategoryContact = Awaited<
  ReturnType<typeof getDirectoryCategoryContacts>
>[number];

/** Every published contact in one category, by name: /community/[category]. */
export const getDirectoryCategoryContacts = unstable_cache(
  async (category: string) =>
    prisma.communityContact.findMany({
      where: { ...PUBLIC_CONTACT, category },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        contactPerson: true,
        subcategoryId: true,
        service: true,
        phones: true,
        whatsapp: true,
        locality: true,
        address: true,
        hours: true,
      },
    }),
  ["directory-category-contacts-v1"],
  CONTACT_CACHE
);

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

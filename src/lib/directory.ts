/**
 * Service-provider taxonomy: the shapes the DB categories travel in, and the
 * pure logic shared by the public directory, the admin screens and the APIs.
 *
 * No Prisma here - the public directory imports this on the client. The loader
 * lives in directory-categories.ts.
 */

export interface DirectorySubcategoryView {
  id: string;
  label: string;
}

export interface DirectoryCategoryView {
  key: string;
  label: string;
  /** lucide name; resolve with directoryIcon(), which falls back safely */
  icon: string;
  /** In display order */
  subcategories: DirectorySubcategoryView[];
}

export interface SubcategoryRef extends DirectorySubcategoryView {
  categoryKey: string;
}

export interface DirectoryIndex {
  byKey: Map<string, DirectoryCategoryView>;
  subById: Map<string, SubcategoryRef>;
}

export function indexDirectory(categories: DirectoryCategoryView[]): DirectoryIndex {
  const byKey = new Map(categories.map((c) => [c.key, c]));
  const subById = new Map<string, SubcategoryRef>();
  for (const c of categories) {
    for (const s of c.subcategories) subById.set(s.id, { ...s, categoryKey: c.key });
  }
  return { byKey, subById };
}

/**
 * "Health & Pharmacy · Dental", or just the category when no subcategory is
 * set. A key with no row (it should not happen - there is a foreign key - but
 * a stale cache can briefly disagree) shows as the raw key, never a crash.
 */
export function categoryText(
  index: DirectoryIndex,
  key: string,
  subcategoryId?: string | null
): string {
  const label = index.byKey.get(key)?.label ?? (key || "Other");
  const sub = subcategoryId ? index.subById.get(subcategoryId) : undefined;
  return sub && sub.categoryKey === key ? `${label} · ${sub.label}` : label;
}

/**
 * Key for a new category: a slug of its label, made unique against the keys in
 * use. Fixed after creation, so renaming a category never touches its contacts.
 */
export function slugifyCategoryKey(label: string, taken: Iterable<string> = []): string {
  const base =
    label
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // é -> e
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "category"; // a label in Devanagari alone slugs to nothing
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

/** Case- and space-insensitive label match, as the CSV import and duplicate checks use. */
export function sameLabel(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return norm(a) === norm(b);
}

export function findSubcategoryByLabel(
  category: DirectoryCategoryView | undefined,
  label: string
): DirectorySubcategoryView | undefined {
  if (!category || !label.trim()) return undefined;
  return category.subcategories.find((s) => sameLabel(s.label, label));
}

/* ── Directory filtering ────────────────────────────────────────────────── */

export interface CategoryChoice {
  /** Empty means every category */
  categories: ReadonlySet<string>;
  /** Subcategory ids; only meaningful under a ticked category */
  subcategories: ReadonlySet<string>;
}

export interface Categorised {
  category: string;
  subcategoryId?: string | null;
}

/**
 * Ticked categories combine. Ticking subcategories narrows only their own
 * category to those subcategories; a ticked category with none ticked keeps
 * all of its contacts, and the other categories are unaffected.
 */
export function categoryFilter(
  choice: CategoryChoice,
  subById: ReadonlyMap<string, SubcategoryRef>
): (c: Categorised) => boolean {
  if (choice.categories.size === 0) return () => true;

  const narrowed = new Map<string, Set<string>>();
  for (const id of choice.subcategories) {
    const sub = subById.get(id);
    if (!sub || !choice.categories.has(sub.categoryKey)) continue;
    const set = narrowed.get(sub.categoryKey) ?? new Set<string>();
    set.add(id);
    narrowed.set(sub.categoryKey, set);
  }

  return (c) => {
    if (!choice.categories.has(c.category)) return false;
    const subs = narrowed.get(c.category);
    return !subs || (c.subcategoryId != null && subs.has(c.subcategoryId));
  };
}

/**
 * Counts for the category list, taken over the contacts that pass every
 * filter except the category choice. A category's count ignores its own
 * subcategory ticks, and a subcategory's count is simply its contacts there:
 * subcategories within a category combine, so ticking one never changes what
 * another would add. Each count is therefore what that tick contributes.
 */
export function categoryCounts(
  contacts: Categorised[],
  subById: ReadonlyMap<string, SubcategoryRef>
): { byCategory: Record<string, number>; bySubcategory: Record<string, number> } {
  const byCategory: Record<string, number> = {};
  const bySubcategory: Record<string, number> = {};
  for (const c of contacts) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    // Counted only where the filter would match it, so a count is never a
    // dead end even if a contact's subcategory disagrees with its category.
    if (c.subcategoryId && subById.get(c.subcategoryId)?.categoryKey === c.category) {
      bySubcategory[c.subcategoryId] = (bySubcategory[c.subcategoryId] ?? 0) + 1;
    }
  }
  return { byCategory, bySubcategory };
}

/** Unticking a category also clears its subcategory ticks. */
export function toggleCategory(
  choice: CategoryChoice,
  key: string,
  subById: ReadonlyMap<string, SubcategoryRef>
): CategoryChoice {
  const categories = new Set(choice.categories);
  if (categories.delete(key)) {
    const subcategories = new Set(
      [...choice.subcategories].filter((id) => subById.get(id)?.categoryKey !== key)
    );
    return { categories, subcategories };
  }
  categories.add(key);
  return { categories, subcategories: choice.subcategories };
}

export function toggleSubcategory(choice: CategoryChoice, id: string): CategoryChoice {
  const subcategories = new Set(choice.subcategories);
  if (!subcategories.delete(id)) subcategories.add(id);
  return { categories: choice.categories, subcategories };
}

/* ── Admin ──────────────────────────────────────────────────────────────── */

/**
 * Why a category cannot be deleted yet, or null when it can. The admin page
 * shows this before calling the API, and the API returns the same text.
 */
export function categoryDeleteBlocker(
  label: string,
  contacts: number,
  subcategories: number
): string | null {
  if (contacts === 0 && subcategories === 0) return null;
  const parts = [
    contacts > 0 && `${contacts} ${contacts === 1 ? "contact" : "contacts"}`,
    subcategories > 0 &&
      `${subcategories} ${subcategories === 1 ? "subcategory" : "subcategories"}`,
  ].filter(Boolean);
  const todo = [
    contacts > 0 && "move its contacts to another category",
    subcategories > 0 && "delete its subcategories",
  ].filter(Boolean);
  const steps = todo.join(" and ");
  return `${label} still has ${parts.join(" and ")}. To delete it, first ${steps}.`;
}

/** The list with one item moved a step, or null when it is already at that end. */
export function moveStep<T>(list: readonly T[], index: number, direction: "up" | "down"): T[] | null {
  const to = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return null;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/**
 * The writes that make sortOrder 0..n-1 in the list's order, skipping rows
 * already right. Renumbering the whole list on every move, rather than
 * swapping two values, means tied or gappy orders heal instead of making a
 * move do nothing.
 */
export function orderWrites<T extends { sortOrder: number }>(
  list: readonly T[]
): { item: T; sortOrder: number }[] {
  return list
    .map((item, sortOrder) => ({ item, sortOrder }))
    .filter(({ item, sortOrder }) => item.sortOrder !== sortOrder);
}

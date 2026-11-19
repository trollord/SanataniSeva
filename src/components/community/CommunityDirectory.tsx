"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Phone,
  MapPin,
  BadgeCheck,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import SearchableSelect from "@/components/ui/searchable-select";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { parsePhone } from "@/lib/phone";
import {
  type CommunityContact,
  type DbCommunityContact,
  toDisplayContact,
} from "@/lib/community";
import {
  type CategoryChoice,
  type DirectoryCategoryView,
  type DirectoryIndex,
  categoryCounts,
  categoryFilter,
  categoryText,
  indexDirectory,
  toggleCategory as toggleCategoryIn,
  toggleSubcategory as toggleSubcategoryIn,
} from "@/lib/directory";
import { DIRECTORY_ICONS, directoryIconName } from "@/lib/directory-icons";

const NO_CHOICE: CategoryChoice = { categories: new Set(), subcategories: new Set() };

/** 300+ contacts is a lot to scroll; the table pages instead. */
const PER_PAGE = 25;

function buildSearchIndex(
  contacts: CommunityContact[],
  index: DirectoryIndex
): Record<string, string> {
  return Object.fromEntries(
    contacts.map((c) => {
      // Category and subcategory labels both, so "dental" finds the Dental
      // subcategory as well as anyone who mentions it in their service line.
      const label = categoryText(index, c.category, c.subcategoryId);
      return [
        c.id,
        [c.name, c.contactPerson ?? "", c.service, label, c.locality, c.address, ...c.phones, ...c.tags]
          .join(" ")
          .toLowerCase(),
      ];
    })
  );
}

export default function CommunityDirectory({
  dbContacts,
  categories,
}: {
  dbContacts: DbCommunityContact[];
  /** In display order, from the DB */
  categories: DirectoryCategoryView[];
}) {
  const contacts: CommunityContact[] = useMemo(
    () => dbContacts.map(toDisplayContact),
    [dbContacts]
  );

  const index = useMemo(() => indexDirectory(categories), [categories]);

  // A contact whose key has no category row still gets a row of its own,
  // under its raw key, so it can be found and filtered rather than vanishing.
  const railCategories = useMemo(() => {
    const extra = Array.from(new Set(contacts.map((c) => c.category)))
      .filter((key) => !index.byKey.has(key))
      .map((key): DirectoryCategoryView => ({ key, label: key || "Other", icon: "", subcategories: [] }));
    return [...categories, ...extra];
  }, [categories, contacts, index]);

  // Only offer localities that actually have listings - the shared
  // HIRANANDANI_LOCALITIES list covers property forms too and would show
  // filters that match nothing here.
  const localities = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.locality).filter(Boolean))).sort(),
    [contacts]
  );

  const searchIndex = useMemo(() => buildSearchIndex(contacts, index), [contacts, index]);

  const [query, setQuery] = useState("");
  /**
   * No categories ticked means "every category" - the All row, rather than a
   * set of every key. Subcategory ticks only ever sit under a ticked category.
   */
  const [choice, setChoice] = useState<CategoryChoice>(NO_CHOICE);
  const [locality, setLocality] = useState<string>("all");
  const [page, setPage] = useState(1);
  /** The category drawer that stands in for the rail below lg */
  const [panelOpen, setPanelOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  /**
   * Everything except the category choice. Category counts are measured
   * against this, so a count shown in the rail is what you would actually get
   * by clicking it - never a dead end, and never stale against the search box.
   */
  const preCategory = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return contacts.filter((c) => {
      if (locality !== "all" && c.locality !== locality) return false;
      if (terms.length === 0) return true;
      const haystack = searchIndex[c.id];
      return terms.every((t) => haystack.includes(t));
    });
  }, [query, locality, contacts, searchIndex]);

  const counts = useMemo(
    () => categoryCounts(preCategory, index.subById),
    [preCategory, index]
  );

  const results = useMemo(
    () => (choice.categories.size === 0 ? preCategory : preCategory.filter(categoryFilter(choice, index.subById))),
    [preCategory, choice, index]
  );

  /**
   * A ticked category's subcategories, minus any with nothing to show. One
   * that is ticked stays even at zero, so a search cannot hide a live filter.
   */
  function visibleSubcategories(c: DirectoryCategoryView) {
    return c.subcategories.filter(
      (s) => (counts.bySubcategory[s.id] ?? 0) > 0 || choice.subcategories.has(s.id)
    );
  }

  const hasFilters = query.trim() !== "" || choice.categories.size > 0 || locality !== "all";

  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  // Narrowing a filter can leave you past the end of the new result set, which
  // would render an empty table and look like "no matches". Each filter resets
  // the page itself; `safePage` still clamps, so a stale page can never render
  // an empty table.
  const safePage = Math.min(page, pageCount);
  const pageResults = results.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Changing a filter swaps the rows underneath the viewport; leaving the
  // table scrolled where it was shows the middle of a result set the resident
  // has not seen the start of.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [query, choice, locality]);

  function changeQuery(v: string) { setQuery(v); setPage(1); }
  function changeLocality(v: string) { setLocality(v); setPage(1); }

  function toggleCategory(key: string) {
    setChoice((prev) => toggleCategoryIn(prev, key, index.subById));
    setPage(1);
  }

  function toggleSubcategory(id: string) {
    setChoice((prev) => toggleSubcategoryIn(prev, id));
    setPage(1);
  }

  function clearCategories() {
    setChoice(NO_CHOICE);
    setPage(1);
  }

  /**
   * The drawer applies a pick and closes, so the resident sees the results at
   * once. The exception is ticking a category that has subcategories: the
   * drawer stays open on them, since it is the only place to choose one.
   */
  function pickAll(collapse: boolean) {
    clearCategories();
    if (collapse) setPanelOpen(false);
  }

  function pickCategory(c: DirectoryCategoryView, collapse: boolean) {
    const opensSubcategories =
      !choice.categories.has(c.key) &&
      c.subcategories.some((s) => (counts.bySubcategory[s.id] ?? 0) > 0);
    toggleCategory(c.key);
    if (collapse && !opensSubcategories) setPanelOpen(false);
  }

  function pickSubcategory(id: string, collapse: boolean) {
    toggleSubcategory(id);
    if (collapse) setPanelOpen(false);
  }

  /** The category list, shared by the wide-screen rail and the mobile drawer. */
  function categoryRows(collapse: boolean) {
    return (
      <>
        <RailRow
          active={choice.categories.size === 0}
          onClick={() => pickAll(collapse)}
          label="All categories"
          count={preCategory.length}
          roomy={collapse}
        />
        {railCategories.map((c) => {
          const active = choice.categories.has(c.key);
          return (
            <div key={c.key} className="space-y-0.5">
              <RailRow
                active={active}
                onClick={() => pickCategory(c, collapse)}
                label={c.label}
                count={counts.byCategory[c.key] ?? 0}
                selectable
                roomy={collapse}
              />
              {/* A ticked category opens to its subcategories */}
              {active &&
                visibleSubcategories(c).map((s) => (
                  <RailRow
                    key={s.id}
                    active={choice.subcategories.has(s.id)}
                    onClick={() => pickSubcategory(s.id, collapse)}
                    label={s.label}
                    count={counts.bySubcategory[s.id] ?? 0}
                    selectable
                    nested
                    roomy={collapse}
                  />
                ))}
            </div>
          );
        })}
      </>
    );
  }

  function clearAll() {
    setQuery("");
    setChoice(NO_CHOICE);
    setLocality("all");
    setPage(1);
  }

  /**
   * Paging keeps the scroll position by default, which drops the resident into
   * the middle of the new page. Reset the table, and below lg - where the
   * document scrolls rather than the table - bring the results back into view
   * so the next page starts where the eye already is.
   */
  function goToPage(n: number) {
    setPage(n);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (!window.matchMedia("(min-width: 768px)").matches) {
      resultsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0">
      {/* ── Search + locality ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Search carpenter, plumber, tiffin, shop name…"
            aria-label="Search the community directory"
            className="w-full bg-white border border-[#e4e9ea] rounded-full pl-11 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#FF5F15]/25 transition-colors [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => changeQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="sm:w-56 shrink-0">
          <SearchableSelect
            value={locality}
            onChange={changeLocality}
            variant="pill"
            leadingIcon={<MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
            options={[
              { value: "all", label: "All Localities" },
              ...localities.map((l) => ({ value: l, label: l })),
            ]}
            aria-label="Filter by locality"
          />
        </div>
      </div>

      {/* ── Filter rail + results ───────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 min-w-0 gap-5 mt-4">

        {/* Category rail - the wide-screen home of the filters. Scrolls on its
            own so a long taxonomy never pushes the table off the screen. */}
        <aside className="hidden lg:flex w-52 shrink-0 flex-col min-h-0 bg-white border border-[#e4e9ea] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#EBEBEB] shrink-0">
            <h2 className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold">
              Categories
            </h2>
            {choice.categories.size > 0 && (
              <button
                onClick={clearCategories}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {/* A thin scrollbar in its own reserved gutter, so it never sits on
              top of the counts at the right edge of each row. */}
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5 [scrollbar-width:thin] [scrollbar-gutter:stable] [scrollbar-color:#d9dfe0_transparent]">
            {categoryRows(false)}
          </div>
        </aside>

        {/* Results */}
        {/* pl clears the fixed Categories tab on the left edge below lg */}
        <div ref={resultsRef} className="flex flex-1 flex-col min-h-0 min-w-0 scroll-mt-24 pl-3 lg:pl-0">

          {/* Below lg the rail becomes a drawer, opened from a tab on the
              left edge so it is always in reach however far the list scrolls. */}
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetTrigger
              aria-label="Filter by category"
              className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 rounded-r-xl bg-[#FF5F15] text-white pl-1.5 pr-2 py-3.5 shadow-lg active:opacity-90 transition-opacity"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] [writing-mode:vertical-rl] rotate-180">
                Categories
              </span>
              {choice.categories.size > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-white text-[#FF5F15] text-[10px] font-bold tabular-nums flex items-center justify-center">
                  {choice.categories.size + choice.subcategories.size}
                </span>
              )}
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="lg:hidden z-[60] w-[82%] max-w-xs gap-0 bg-white p-0"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EBEBEB] shrink-0">
                <SheetTitle className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold">
                  Categories
                </SheetTitle>
                <div className="flex items-center gap-3">
                  {choice.categories.size > 0 && (
                    <button
                      onClick={clearCategories}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <SheetClose
                    aria-label="Close categories"
                    className="text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </SheetClose>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-0.5">
                {categoryRows(true)}
              </div>
              <div className="p-3 border-t border-[#EBEBEB] shrink-0">
                <SheetClose className="w-full rounded-full bg-[#FF5F15] text-white py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity">
                  Show {results.length} {results.length === 1 ? "contact" : "contacts"}
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {/* What the drawer has applied, so a closed drawer never hides a
              live filter. Each chip removes itself. */}
          {choice.categories.size > 0 && (
            <div className="lg:hidden flex flex-wrap gap-1.5 mb-2.5 shrink-0">
              {[...choice.categories].map((key) => (
                <ActiveChip
                  key={key}
                  label={railCategories.find((c) => c.key === key)?.label ?? key}
                  onRemove={() => toggleCategory(key)}
                />
              ))}
              {[...choice.subcategories].map((id) => (
                <ActiveChip
                  key={id}
                  label={index.subById.get(id)?.label ?? ""}
                  onRemove={() => toggleSubcategory(id)}
                />
              ))}
            </div>
          )}

          {/* Result count */}
          <div className="flex items-center justify-between gap-4 mb-2.5 shrink-0">
            <p className="text-xs text-zinc-500">
              {results.length === 0
                ? "No contacts found"
                : `${results.length} ${results.length === 1 ? "contact" : "contacts"} listed`}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors shrink-0"
              >
                Clear filters
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-16 text-zinc-400 bg-white border border-[#e4e9ea] rounded-2xl">
              <Search className="h-8 w-8 mb-4 opacity-40" />
              <p className="font-medium text-zinc-900 text-sm">
                Nothing matches that search.
              </p>
              <button
                onClick={clearAll}
                className="text-zinc-500 hover:text-zinc-900 text-xs mt-2 inline-block underline underline-offset-2"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {/* The card is the scroll container: the header stays put while
                  the rows move under it, so the columns are always labelled. */}
              <div className="flex-1 min-h-0 min-w-0 bg-white border border-[#e4e9ea] rounded-2xl overflow-hidden flex flex-col">
                {/* Only from md up, where this pane owns the scroll, does it
                    contain overscroll. Below md the document scrolls, and
                    overscroll-contain here stops a swipe that starts on a row
                    from reaching the page: Android Chrome then scrolls nothing. */}
                <div ref={scrollRef} className="flex-1 min-h-0 overflow-x-auto md:overflow-auto md:overscroll-contain">
                  <table className="w-full text-sm md:min-w-[640px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#F5F5F5] text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                        {/* Category leads from md up; below that its column is
                            hidden and the label folds in under the name. */}
                        <th scope="col" className="text-left font-semibold pl-5 pr-4 py-2.5 border-b border-[#EBEBEB] hidden md:table-cell">
                          Category
                        </th>
                        <th scope="col" className="text-left font-semibold px-4 sm:px-5 md:px-4 py-2.5 border-b border-[#EBEBEB]">
                          Contact
                        </th>
                        <th scope="col" className="text-left font-semibold px-4 py-2.5 border-b border-[#EBEBEB] hidden xl:table-cell">
                          Locality
                        </th>
                        <th scope="col" className="text-left font-semibold px-4 py-2.5 border-b border-[#EBEBEB]">
                          Phone
                        </th>
                        <th scope="col" className="text-right font-semibold px-4 sm:px-5 py-2.5 border-b border-[#EBEBEB]">
                          Call
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBEBEB]">
                      {pageResults.map((c) => (
                        <ContactRow key={c.id} contact={c} index={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-between gap-4 mt-3 shrink-0">
                  <p className="text-xs text-zinc-500">
                    Page {safePage} of {pageCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <PagerButton
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 1}
                      label="Previous"
                    />
                    <PagerButton
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage === pageCount}
                      label="Next"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Rail row ────────────────────────────────────────────────────────────── */
/**
 * One category in the rail. `selectable` rows carry a checkbox, which is what
 * tells a resident these combine rather than replace one another; the All row
 * is a reset, so it gets none. The count stays visible in both states - it is
 * the reason to pick a category, so hiding it behind the active style would
 * lose the information exactly when it is being used. A `nested` row is a
 * subcategory, indented so its checkbox lines up under its category's label.
 */
function RailRow({
  active,
  onClick,
  label,
  count,
  selectable = false,
  nested = false,
  roomy = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  selectable?: boolean;
  nested?: boolean;
  /** Finger-sized rows, for the mobile drawer */
  roomy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`w-full flex items-center gap-2 pr-2 ${nested ? "pl-[30px]" : "pl-2"} ${roomy ? "py-2.5 text-sm" : "py-1.5 text-[13px]"} rounded-lg text-left transition-colors ${
        active
          ? "bg-[#FF5F15]/10 text-[#0B0B0C] font-medium"
          : "text-zinc-600 hover:bg-[#f2f4f4] hover:text-zinc-900"
      }`}
    >
      {selectable && (
        <span
          aria-hidden
          className={`w-3.5 h-3.5 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
            active ? "bg-[#FF5F15] border-[#FF5F15]" : "border-[#d9dfe0] bg-white"
          }`}
        >
          {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </span>
      )}
      <span className="flex-1 min-w-0 truncate">{label}</span>
      <span
        className={`text-[11px] shrink-0 tabular-nums ${
          active ? "text-[#FF5F15]" : "text-zinc-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ─── Active filter chip ──────────────────────────────────────────────────── */
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="flex items-center gap-1 pl-3 pr-2 py-1 rounded-full text-xs font-medium bg-[#FF5F15]/10 text-[#0B0B0C] hover:bg-[#FF5F15]/15 transition-colors"
    >
      {label}
      <X className="w-3 h-3 text-[#FF5F15]" />
    </button>
  );
}

/* ─── Pager ───────────────────────────────────────────────────────────────── */
function PagerButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#e4e9ea] bg-white text-zinc-700 hover:bg-[#f2f4f4] hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

/* ─── Contact row ─────────────────────────────────────────────────────────── */
function ContactRow({ contact: c, index }: { contact: CommunityContact; index: DirectoryIndex }) {
  const Icon = DIRECTORY_ICONS[directoryIconName(index.byKey.get(c.category)?.icon)];
  // "Health & Pharmacy · Dental" when a subcategory is set
  const categoryLabel = categoryText(index, c.category, c.subcategoryId);
  // The page filters out numberless contacts, so there is always a primary.
  const primary = c.phones[0];
  // WhatsApp only exists on mobile numbers - offering it for a landline, a
  // toll-free line or an emergency short code produces a dead wa.me link.
  const canWhatsApp = c.whatsapp && parsePhone(primary).kind === "mobile";

  return (
    <tr className="hover:bg-[#f9fafa] transition-colors align-top">
      {/* Category */}
      <td className="pl-5 pr-4 py-2.5 hidden md:table-cell">
        <div className="flex items-start gap-2.5">
          <div className="bg-[#F5F5F5] rounded-lg p-1.5 shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#FF5F15]" />
          </div>
          <span className="text-xs text-zinc-600 pt-1">{categoryLabel}</span>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 sm:px-5 md:px-4 py-2.5">
        <div className="flex items-start gap-2.5">
          {/* The icon moves to the Category column once that is shown */}
          <div className="bg-[#F5F5F5] rounded-lg p-1.5 shrink-0 hidden sm:block md:hidden">
            <Icon className="w-3.5 h-3.5 text-[#FF5F15]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight text-[#0B0B0C]">{c.name}</span>
              {c.verified && (
                <BadgeCheck
                  className="w-3.5 h-3.5 text-[#FF5F15] shrink-0"
                  aria-label="Verified by Sanatani Seva"
                />
              )}
            </div>
            <p className="text-xs text-zinc-500 leading-snug">
              {c.service}
              {c.contactPerson && (
                <span className="text-zinc-400"> · Ask for {c.contactPerson}</span>
              )}
            </p>
            {/* Category and locality fold in here once their columns drop away */}
            <p className="text-[11px] text-zinc-400 md:hidden">
              {categoryLabel}
              {c.locality && <span className="text-zinc-300"> · {c.locality}</span>}
            </p>
          </div>
        </div>
      </td>

      {/* Locality */}
      <td className="px-4 py-2.5 hidden xl:table-cell">
        <span className="text-xs text-zinc-600">{c.locality}</span>
        {c.address && <p className="text-[11px] text-zinc-400">{c.address}</p>}
      </td>

      {/* Numbers - a vendor often has more than one */}
      <td className="px-4 py-2.5">
        <div className="space-y-0.5">
          {c.phones.map((p) => (
            <a
              key={p}
              href={`tel:${p.replace(/\s/g, "")}`}
              className="block text-xs font-medium text-zinc-700 hover:text-[#FF5F15] whitespace-nowrap transition-colors"
            >
              {p}
            </a>
          ))}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 sm:px-5 py-2.5">
        <div className="flex items-center justify-end gap-2">
          <a
            href={`tel:${primary.replace(/\s/g, "")}`}
            aria-label={`Call ${c.name}`}
            className="inline-flex items-center justify-center gap-1.5 bg-[#FF5F15] text-white rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call</span>
          </a>
          {canWhatsApp && (
            <a
              href={whatsAppContactUrl(
                primary,
                `Hi ${c.contactPerson ?? c.name}, I found you on the Sanatani Seva community directory for Hiranandani Estate.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${c.name} on WhatsApp`}
              className="inline-flex items-center justify-center rounded-full p-1.5 text-[#FF5F15] border border-[#FF5F15]/18 hover:bg-[#EBEBEB] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

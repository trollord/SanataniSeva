"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Phone,
  MapPin,
  BadgeCheck,
  Users,
  Check,
  Hammer,
  Wrench,
  Zap,
  AirVent,
  PaintRoller,
  Sparkles,
  ShoppingBag,
  ChefHat,
  Stethoscope,
  Scissors,
  Shirt,
  Truck,
  GraduationCap,
  Leaf,
  Building2,
  Car,
  Siren,
  Flame,
  Landmark,
  Briefcase,
  Palette,
  Printer,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import SearchableSelect from "@/components/ui/searchable-select";
import { parsePhone } from "@/lib/phone";
import {
  COMMUNITY_CATEGORIES,
  type CommunityContact,
  type DbCommunityContact,
  toDisplayContact,
} from "@/lib/community";

const ICONS: Record<string, LucideIcon> = {
  Hammer,
  Wrench,
  Zap,
  AirVent,
  PaintRoller,
  Sparkles,
  ShoppingBag,
  ChefHat,
  Stethoscope,
  Scissors,
  Shirt,
  Truck,
  GraduationCap,
  Leaf,
  Building2,
  Car,
  Siren,
  Flame,
  Landmark,
  Briefcase,
  Palette,
  Printer,
  HeartHandshake,
};

/** 300+ contacts is a lot to scroll; the table pages instead. */
const PER_PAGE = 25;

function buildSearchIndex(contacts: CommunityContact[]): Record<string, string> {
  return Object.fromEntries(
    contacts.map((c) => {
      const label =
        COMMUNITY_CATEGORIES.find((cat) => cat.key === c.category)?.label ?? "";
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
}: {
  dbContacts: DbCommunityContact[];
}) {
  const contacts: CommunityContact[] = useMemo(
    () => dbContacts.map(toDisplayContact),
    [dbContacts]
  );

  // Only offer localities that actually have listings - the shared
  // HIRANANDANI_LOCALITIES list covers property forms too and would show
  // filters that match nothing here.
  const localities = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.locality).filter(Boolean))).sort(),
    [contacts]
  );

  const searchIndex = useMemo(() => buildSearchIndex(contacts), [contacts]);

  const [query, setQuery] = useState("");
  /** Empty means "every category" - the All row, rather than a 24-key set. */
  const [categories, setCategories] = useState<ReadonlySet<string>>(new Set());
  const [locality, setLocality] = useState<string>("all");
  const [page, setPage] = useState(1);

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of preCategory) counts[c.category] = (counts[c.category] ?? 0) + 1;
    return counts;
  }, [preCategory]);

  const results = useMemo(
    () => (categories.size === 0 ? preCategory : preCategory.filter((c) => categories.has(c.category))),
    [preCategory, categories]
  );

  const hasFilters = query.trim() !== "" || categories.size > 0 || locality !== "all";

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
  }, [query, categories, locality]);

  function changeQuery(v: string) { setQuery(v); setPage(1); }
  function changeLocality(v: string) { setLocality(v); setPage(1); }

  function toggleCategory(key: string) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
    setPage(1);
  }

  function clearCategories() {
    setCategories(new Set());
    setPage(1);
  }

  function clearAll() {
    setQuery("");
    setCategories(new Set());
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
            {categories.size > 0 && (
              <button
                onClick={clearCategories}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
            <RailRow
              active={categories.size === 0}
              onClick={clearCategories}
              label="All categories"
              count={preCategory.length}
            />
            {COMMUNITY_CATEGORIES.map((c) => (
              <RailRow
                key={c.key}
                active={categories.has(c.key)}
                onClick={() => toggleCategory(c.key)}
                label={c.label}
                count={categoryCounts[c.key] ?? 0}
                selectable
              />
            ))}
          </div>
        </aside>

        {/* Results */}
        <div ref={resultsRef} className="flex flex-1 flex-col min-h-0 min-w-0 scroll-mt-24">

          {/* Category pills - the rail's stand-in below lg */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryPill
              active={categories.size === 0}
              onClick={clearCategories}
              Icon={Users}
              label="All"
              count={preCategory.length}
            />
            {COMMUNITY_CATEGORIES.map((c) => (
              <CategoryPill
                key={c.key}
                active={categories.has(c.key)}
                onClick={() => toggleCategory(c.key)}
                Icon={ICONS[c.icon]}
                label={c.label}
                count={categoryCounts[c.key] ?? 0}
              />
            ))}
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between gap-4 mt-3 lg:mt-0 mb-2.5 shrink-0">
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
                <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto overscroll-contain">
                  <table className="w-full text-sm md:min-w-[640px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#F5F5F5] text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                        <th scope="col" className="text-left font-semibold px-4 sm:px-5 py-2.5 border-b border-[#EBEBEB]">
                          Contact
                        </th>
                        <th scope="col" className="text-left font-semibold px-4 py-2.5 border-b border-[#EBEBEB] hidden md:table-cell">
                          Category
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
                        <ContactRow key={c.id} contact={c} />
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
 * lose the information exactly when it is being used.
 */
function RailRow({
  active,
  onClick,
  label,
  count,
  selectable = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  selectable?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[13px] transition-colors ${
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

/* ─── Category pill ───────────────────────────────────────────────────────── */
function CategoryPill({
  active,
  onClick,
  Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-[#FF5F15] text-white border-[#FF5F15]"
          : "bg-white text-zinc-600 border-[#e4e9ea] hover:bg-[#f2f4f4] hover:text-zinc-900"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={active ? "text-white/50" : "text-zinc-400"}>{count}</span>
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
function ContactRow({ contact: c }: { contact: CommunityContact }) {
  const meta = COMMUNITY_CATEGORIES.find((cat) => cat.key === c.category);
  const Icon = meta ? ICONS[meta.icon] : Users;
  // The page filters out numberless contacts, so there is always a primary.
  const primary = c.phones[0];
  // WhatsApp only exists on mobile numbers - offering it for a landline, a
  // toll-free line or an emergency short code produces a dead wa.me link.
  const canWhatsApp = c.whatsapp && parsePhone(primary).kind === "mobile";

  return (
    <tr className="hover:bg-[#f9fafa] transition-colors align-top">
      {/* Contact */}
      <td className="px-4 sm:px-5 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="bg-[#F5F5F5] rounded-lg p-1.5 shrink-0 hidden sm:block">
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
              {meta?.label}
              {c.locality && <span className="text-zinc-300"> · {c.locality}</span>}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-2.5 hidden md:table-cell">
        <span className="text-xs text-zinc-600">{meta?.label ?? c.category}</span>
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

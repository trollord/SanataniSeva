"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Phone,
  MapPin,
  BadgeCheck,
  Users,
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
  type LucideIcon,
} from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import SearchableSelect from "@/components/ui/searchable-select";
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
};

/** 250 contacts is a lot to scroll; the table pages instead. */
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

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        COMMUNITY_CATEGORIES.map((cat) => [
          cat.key,
          contacts.filter((c) => c.category === cat.key).length,
        ])
      ),
    [contacts]
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [locality, setLocality] = useState<string>("all");
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return contacts.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (locality !== "all" && c.locality !== locality) return false;
      if (terms.length === 0) return true;
      const haystack = searchIndex[c.id];
      return terms.every((t) => haystack.includes(t));
    });
  }, [query, category, locality, contacts, searchIndex]);

  const hasFilters = query.trim() !== "" || category !== "all" || locality !== "all";

  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  // Narrowing a filter can leave you past the end of the new result set, which
  // would render an empty table and look like "no matches".
  useEffect(() => setPage(1), [query, category, locality]);
  const safePage = Math.min(page, pageCount);
  const pageResults = results.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  function clearAll() {
    setQuery("");
    setCategory("all");
    setLocality("all");
    setPage(1);
  }

  return (
    <div>
      {/* ── Search + locality ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search carpenter, plumber, tiffin, shop name…"
            aria-label="Search the community directory"
            className="w-full bg-white border border-[#e4e9ea] rounded-full pl-11 pr-10 py-3 sm:py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#FF5F15]/25 transition-colors [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="sm:w-56">
          <SearchableSelect
            value={locality}
            onChange={setLocality}
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

      {/* ── Category pills ──────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mt-4 sm:mt-5 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryPill
          active={category === "all"}
          onClick={() => setCategory("all")}
          Icon={Users}
          label="All"
          count={contacts.length}
        />
        {COMMUNITY_CATEGORIES.map((c) => (
          <CategoryPill
            key={c.key}
            active={category === c.key}
            onClick={() => setCategory(c.key)}
            Icon={ICONS[c.icon]}
            label={c.label}
            count={categoryCounts[c.key] ?? 0}
          />
        ))}
      </div>

      {/* ── Result count ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mt-6 sm:mt-8 mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm text-zinc-500">
          {results.length === 0
            ? "No contacts found"
            : `${results.length} ${results.length === 1 ? "contact" : "contacts"} listed`}
        </p>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {results.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-zinc-400">
          <Search className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 opacity-40" />
          <p className="font-medium text-zinc-900 text-sm sm:text-base">
            Nothing matches that search.
          </p>
          <button
            onClick={clearAll}
            className="text-zinc-500 hover:text-zinc-900 text-xs sm:text-sm mt-2 inline-block underline underline-offset-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#e4e9ea] rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[#F5F5F5] text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  <th scope="col" className="text-left font-semibold px-4 sm:px-5 py-3">
                    Contact
                  </th>
                  <th scope="col" className="text-left font-semibold px-4 py-3 hidden md:table-cell">
                    Category
                  </th>
                  <th scope="col" className="text-left font-semibold px-4 py-3 hidden lg:table-cell">
                    Locality
                  </th>
                  <th scope="col" className="text-left font-semibold px-4 py-3">
                    Phone
                  </th>
                  <th scope="col" className="text-right font-semibold px-4 sm:px-5 py-3">
                    Call
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {pageResults.map((c, i) => (
                  <ContactRow key={c.id} contact={c} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-4 mt-5 sm:mt-6">
              <p className="text-xs text-zinc-500">
                Page {safePage} of {pageCount}
              </p>
              <div className="flex items-center gap-2">
                <PagerButton
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  label="Previous"
                />
                <PagerButton
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === pageCount}
                  label="Next"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
      className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all ${
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
      className="px-3.5 py-2 rounded-full text-xs font-medium border border-[#e4e9ea] bg-white text-zinc-700 hover:bg-[#f2f4f4] hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

/* ─── Contact row ─────────────────────────────────────────────────────────── */
function ContactRow({ contact: c, index }: { contact: CommunityContact; index: number }) {
  const meta = COMMUNITY_CATEGORIES.find((cat) => cat.key === c.category);
  const Icon = meta ? ICONS[meta.icon] : Users;
  const primary = c.phones[0];

  const rowRef = useRef<HTMLTableRowElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <tr
      ref={rowRef}
      className="hover:bg-[#f9fafa] transition-colors align-top"
      style={
        visible
          ? { animation: `rowIn 0.2s ease-out ${index * 25}ms both` }
          : { opacity: 0 }
      }
    >
      {/* Contact */}
      <td className="px-4 sm:px-5 py-3.5">
        <div className="flex items-start gap-3">
          <div className="bg-[#F5F5F5] rounded-lg p-2 shrink-0 hidden sm:block">
            <Icon className="w-4 h-4 text-[#FF5F15]" />
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
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{c.service}</p>
            {c.contactPerson && (
              <p className="text-[11px] text-zinc-400 mt-0.5">Ask for {c.contactPerson}</p>
            )}
            {/* Category and locality fold in here once their columns drop away */}
            <p className="text-[11px] text-zinc-400 mt-1 md:hidden">
              {meta?.label}
              {c.locality && <span className="text-zinc-300"> · {c.locality}</span>}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-xs text-zinc-600">{meta?.label ?? c.category}</span>
      </td>

      {/* Locality */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-xs text-zinc-600">{c.locality}</span>
        {c.address && <p className="text-[11px] text-zinc-400 mt-0.5">{c.address}</p>}
      </td>

      {/* Numbers - a vendor often has more than one */}
      <td className="px-4 py-3.5">
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
      <td className="px-4 sm:px-5 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <a
            href={`tel:${primary.replace(/\s/g, "")}`}
            aria-label={`Call ${c.name}`}
            className="inline-flex items-center justify-center gap-1.5 bg-[#FF5F15] text-white rounded-full px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call</span>
          </a>
          {c.whatsapp && (
            <a
              href={whatsAppContactUrl(
                primary,
                `Hi ${c.contactPerson ?? c.name}, I found you on the Sanatani Seva community directory for Hiranandani Estate.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${c.name} on WhatsApp`}
              className="inline-flex items-center justify-center rounded-full p-2 text-[#FF5F15] border border-[#FF5F15]/18 hover:bg-[#EBEBEB] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

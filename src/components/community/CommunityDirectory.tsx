"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Phone,
  MapPin,
  Clock,
  Star,
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
  type LucideIcon,
} from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_CONTACTS,
  COMMUNITY_LOCALITIES,
  CATEGORY_COUNTS,
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
};

function buildSearchIndex(contacts: CommunityContact[]): Record<string, string> {
  return Object.fromEntries(
    contacts.map((c) => {
      const label =
        COMMUNITY_CATEGORIES.find((cat) => cat.key === c.category)?.label ?? "";
      return [
        c.id,
        [c.name, c.contactPerson ?? "", c.service, label, c.locality, c.address, c.phone, ...c.tags]
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
    () =>
      dbContacts.length > 0
        ? dbContacts.map(toDisplayContact)
        : COMMUNITY_CONTACTS,
    [dbContacts]
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

  function clearAll() {
    setQuery("");
    setCategory("all");
    setLocality("all");
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

        <div className="relative sm:w-56">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <select
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            aria-label="Filter by locality"
            className="w-full appearance-none bg-white border border-[#e4e9ea] rounded-full pl-10 pr-9 py-3 sm:py-3.5 text-sm font-medium text-zinc-700 cursor-pointer hover:bg-[#f2f4f4] focus:outline-none transition-all"
          >
            <option value="all">All Localities</option>
            {COMMUNITY_LOCALITIES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
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
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {results.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 28, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
              >
                <ContactCard contact={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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

/* ─── Contact card ────────────────────────────────────────────────────────── */
function ContactCard({ contact: c }: { contact: CommunityContact }) {
  const meta = COMMUNITY_CATEGORIES.find((cat) => cat.key === c.category);
  const Icon = meta ? ICONS[meta.icon] : Users;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-gray-300 transition-all flex flex-col">
      {/* Head */}
      <div className="flex items-start gap-3.5">
        <div className="bg-[#F5F5F5] rounded-xl p-2.5 shrink-0">
          <Icon className="w-5 h-5 text-[#FF5F15]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="font-bold tracking-tight text-[#0B0B0C] text-base sm:text-lg leading-snug">
              {c.name}
            </h3>
            {c.verified && (
              <span
                title="Verified by Sanatani Community"
                className="inline-flex items-center gap-1 shrink-0 mt-0.5 px-2 py-0.5 rounded-full bg-[#EBEBEB] text-[9px] font-bold uppercase tracking-[0.1em] text-gray-500"
              >
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
            {c.service}
          </p>

          <div className="flex items-center gap-2 mt-2 text-[11px] sm:text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 font-medium text-[#FF5F15]">
              <Star className="w-3 h-3 fill-current" />
              {c.rating.toFixed(1)}
            </span>
            <span className="text-zinc-300">·</span>
            <span>{c.reviews} reviews</span>
            <span className="text-zinc-300">·</span>
            <span>Since {c.since}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-1.5 text-[11px] sm:text-xs text-zinc-500">
        <p className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            {c.address}
            <span className="text-zinc-300"> · </span>
            {c.locality}
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{c.hours}</span>
        </p>
        {c.contactPerson && (
          <p className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>Ask for {c.contactPerson}</span>
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-4 mb-5">
        {c.tags.map((t) => (
          <span
            key={t}
            className="px-2.5 py-1 rounded-full bg-[#F5F5F5] text-[10px] sm:text-[11px] font-medium text-gray-500"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 mt-auto pt-4 border-t border-gray-100">
        <a
          href={`tel:${c.phone.replace(/\s/g, "")}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#FF5F15] text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Phone className="w-3.5 h-3.5" />
          {c.phone}
        </a>
        {c.whatsapp && (
          <a
            href={whatsAppContactUrl(
              c.phone,
              `Hi ${c.contactPerson ?? c.name}, I found you on the Sanatani Community community directory for Hiranandani Estate.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Message ${c.name} on WhatsApp`}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#FF5F15] border border-[#FF5F15]/18 hover:bg-[#EBEBEB] transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
}

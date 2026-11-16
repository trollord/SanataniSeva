"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Megaphone, Phone, Search, Store, X } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { DIRECTORY_ICONS, directoryIconName } from "@/lib/directory-icons";
import {
  canWhatsApp,
  matchesPromotionSearch,
  telHref,
  type PromotionView,
} from "@/lib/promotions";
import { CategoryChip, OUTLINE_BTN, OfferBadge, PRIMARY_BTN, whatsAppMessageUrl } from "./PromotionActions";

export interface PromotionCategory {
  key: string;
  label: string;
  icon: string;
}

/**
 * Category chips, search and the card grid. Every live promotion is already
 * on the page (there are a handful), so filtering is instant and client-side.
 */
export default function PromotionsBrowser({
  promotions,
  categories,
}: {
  promotions: PromotionView[];
  /** Only categories with a live promotion, in directory order */
  categories: PromotionCategory[];
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const labels = useMemo(() => new Map(categories.map((c) => [c.key, c.label])), [categories]);
  const labelOf = (p: PromotionView) => (p.categoryKey ? (labels.get(p.categoryKey) ?? null) : null);

  // Chip counts follow the search, so a chip never promises results it hides.
  const searched = promotions.filter((p) => matchesPromotionSearch(p, labelOf(p), query));
  const shown = category ? searched.filter((p) => p.categoryKey === category) : searched;
  const countIn = (key: string) => searched.filter((p) => p.categoryKey === key).length;

  if (promotions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#EDE5D8] bg-white px-6 py-16 text-center">
        <Megaphone className="mx-auto mb-3 h-8 w-8 text-[#D8CDBE]" />
        <p className="text-sm font-semibold text-[#1C1C1C]">No promotions running right now.</p>
        <p className="mt-1 text-xs text-[#8A8178]">
          Offers from local businesses will appear here. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Search ────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8178]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a business, offer or category…"
          aria-label="Search promotions"
          className="h-12 w-full rounded-full border border-[#EDE5D8] bg-white pl-11 pr-11 text-[15px] text-[#1C1C1C] placeholder:text-[#8A8178] transition-colors focus:border-[#C8541A]/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#8A8178] transition-colors hover:text-[#1C1C1C]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Category chips: one scrolling row on phones, wrapped above ─── */}
      {categories.length > 0 && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Chip active={category === null} onClick={() => setCategory(null)} label="All" count={searched.length} />
          {categories.map((c) => (
            <Chip
              key={c.key}
              active={category === c.key}
              onClick={() => setCategory(category === c.key ? null : c.key)}
              icon={c.icon}
              label={c.label}
              count={countIn(c.key)}
            />
          ))}
        </div>
      )}

      {/* ── Cards ─────────────────────────────────────────────────────── */}
      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#EDE5D8] bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#1C1C1C]">No promotions match.</p>
          <button
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
            className="mt-3 inline-flex h-11 items-center px-4 text-sm font-semibold text-[#C8541A] hover:underline underline-offset-2"
          >
            Show all promotions
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <PromotionCard key={p.id} promotion={p} categoryLabel={labelOf(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  /** lucide name from the category; omitted for "All" */
  icon?: string;
  label: string;
  count: number;
}) {
  const Icon = icon ? DIRECTORY_ICONS[directoryIconName(icon)] : null;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors ${
        active
          ? "border-[#C8541A] bg-[#C8541A] text-white"
          : "border-[#EDE5D8] bg-white text-[#6B6B6B] hover:border-[#C8541A]/40 hover:text-[#1C1C1C]"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <span className={active ? "text-white/60" : "text-[#B8AC9B]"}>{count}</span>
    </button>
  );
}

/**
 * The card body links to the detail page; Call and WhatsApp sit outside that
 * link (links cannot nest) along the bottom edge.
 */
function PromotionCard({ promotion: p, categoryLabel }: { promotion: PromotionView; categoryLabel: string | null }) {
  // The first photo, else the logo (shown smaller: it is a mark, not a scene).
  const isPhoto = p.imageUrls.length > 0;
  const cover = p.imageUrls[0] ?? p.logoUrl;
  const whatsApp = canWhatsApp(p);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#EDE5D8] bg-white transition-shadow hover:shadow-[0_2px_16px_rgba(28,10,0,0.06)]">
      <Link href={`/promotions/${p.slug}`} className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#C8541A]">
        <div className="relative flex h-44 items-center justify-center bg-[#F7F3EC] p-3">
          {cover ? (
            <Image
              src={cover}
              alt={p.name}
              width={400}
              height={566}
              sizes="(max-width: 640px) 100vw, 320px"
              className={`w-auto max-w-full object-contain ${isPhoto ? "h-full rounded-md" : "h-24 rounded-xl"}`}
            />
          ) : (
            <Store className="h-7 w-7 text-[#B8AC9B]" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {categoryLabel && (
            <div className="flex">
              <CategoryChip label={categoryLabel} />
            </div>
          )}
          <h3 className="mt-2.5 font-semibold leading-snug tracking-tight text-[#1C1C1C] line-clamp-2 group-hover:text-[#A8410F]">
            {p.name}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6B6B] line-clamp-2">{p.tagline}</p>
          {p.offer && <OfferBadge offer={p.offer} className="mt-3 self-start" />}
        </div>
      </Link>

      {p.phone && (
        <div className={`grid gap-2 border-t border-[#EDE5D8] p-3 ${whatsApp ? "grid-cols-2" : "grid-cols-1"}`}>
          <a href={telHref(p.phone)} aria-label={`Call ${p.name}`} className={PRIMARY_BTN}>
            <Phone className="h-4 w-4" />
            Call
          </a>
          {whatsApp && (
            <a
              href={whatsAppMessageUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message ${p.name} on WhatsApp`}
              className={OUTLINE_BTN}
            >
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </article>
  );
}

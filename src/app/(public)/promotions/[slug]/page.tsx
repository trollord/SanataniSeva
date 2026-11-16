import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AtSign, Clock, Globe, MapPin, Navigation } from "lucide-react";
import PromotionActions, {
  CategoryChip,
  OUTLINE_BTN,
  OfferBadge,
} from "@/components/promotions/PromotionActions";
import { getDirectoryCategories } from "@/lib/directory-categories";
import {
  directionsUrl,
  formatYmd,
  instagramLabel,
  websiteLabel,
} from "@/lib/promotions";
import { getLivePromotion } from "@/lib/promotions-data";

// Live-ness is decided per request against today's IST date (see /promotions).
export const dynamic = "force-dynamic";

const PF = "font-[family-name:var(--font-playfair)]";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getLivePromotion(slug);
  if (!p) return { title: "Not found" };

  const description = [p.tagline, p.offer].filter(Boolean).join(" · ").slice(0, 160);
  const image = p.imageUrls[0] ?? p.logoUrl;
  return {
    title: `${p.name} - Promotions`, // the root layout appends "| Sanatani Seva"
    description,
    alternates: { canonical: `/promotions/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PromotionPage({ params }: Props) {
  const { slug } = await params;
  const [p, categories] = await Promise.all([getLivePromotion(slug), getDirectoryCategories()]);
  if (!p) notFound();

  const category = p.categoryKey ? categories.find((c) => c.key === p.categoryKey)?.label : undefined;
  const place = [p.address, p.locality === "Others" ? null : p.locality].filter(Boolean).join(", ");
  const hasLinks = Boolean(p.website || p.instagram);
  // With neither photos nor a description there is nothing for a left
  // column, so the contact card stands alone rather than pushed right.
  const twoColumns = p.imageUrls.length > 0 || Boolean(p.description);

  return (
    <article className="bg-[#FAF8F5] px-4 pt-24 pb-20 text-[#1C1C1C] sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/promotions"
          className="inline-flex h-11 items-center gap-1.5 text-sm text-[#6B6B6B] transition-colors hover:text-[#1C1C1C]"
        >
          <ArrowLeft className="h-4 w-4" />
          All promotions
        </Link>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="mt-2 flex items-start gap-4">
          {p.logoUrl && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#EDE5D8] bg-white sm:h-16 sm:w-16">
              <Image src={p.logoUrl} alt={`${p.name} logo`} fill sizes="64px" className="object-contain p-1.5" />
            </div>
          )}
          <div className="min-w-0">
            {category && (
              <div className="flex">
                <CategoryChip label={category} />
              </div>
            )}
            <h1 className={`${PF} mt-2.5 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[42px]`}>
              {p.name}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-[#6B6B6B] sm:text-lg">{p.tagline}</p>
          </div>
        </header>

        <div
          className={`mt-8 grid gap-8 lg:gap-10 ${twoColumns ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "max-w-md"}`}
        >
          {/* ── Photos ────────────────────────────────────────────────── */}
          {p.imageUrls.length > 0 && (
            <div className="min-w-0 lg:col-start-1">
              {/* One list: a swipeable row on phones, the lead photo over a
                  grid above. Contained, never cropped - many are flyers whose
                  value is the text on them - and each opens full size. */}
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
                {p.imageUrls.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open photo ${i + 1} of ${p.imageUrls.length} full size`}
                    className={`relative h-72 shrink-0 snap-center overflow-hidden rounded-2xl border border-[#EDE5D8] bg-[#F7F3EC] sm:w-auto ${
                      p.imageUrls.length === 1 ? "w-full" : "w-[85%]"
                    } ${i === 0 ? "sm:col-span-3 sm:h-[420px]" : "sm:h-40"}`}
                  >
                    <Image
                      src={url}
                      alt={i === 0 ? p.name : `${p.name}, photo ${i + 1}`}
                      fill
                      sizes={i === 0 ? "(max-width: 1024px) 100vw, 620px" : "(max-width: 640px) 85vw, 210px"}
                      className="rounded-xl object-contain p-2"
                      priority={i === 0}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Reach: beside the photos on wide screens, under them on phones ── */}
          <aside className={twoColumns ? "lg:col-start-2 lg:row-span-2 lg:row-start-1" : ""}>
            <div className="space-y-5 rounded-2xl border border-[#EDE5D8] bg-white p-5 sm:p-6 lg:sticky lg:top-28">
              {p.offer && (
                <div>
                  <OfferBadge offer={p.offer} />
                  {p.endsOn && (
                    <p className="mt-2 text-xs text-[#8A8178]">Valid till {formatYmd(p.endsOn)}</p>
                  )}
                </div>
              )}

              <PromotionActions promotion={p} className="[&>a]:flex-1" />

              {hasLinks && (
                <div className="flex flex-wrap gap-2">
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${OUTLINE_BTN} min-w-0 flex-1`}
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{websiteLabel(p.website)}</span>
                    </a>
                  )}
                  {p.instagram && (
                    <a
                      href={p.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${OUTLINE_BTN} min-w-0 flex-1`}
                    >
                      <AtSign className="h-4 w-4 shrink-0" />
                      <span className="truncate">{instagramLabel(p.instagram)}</span>
                    </a>
                  )}
                </div>
              )}

              {(p.hours || place) && (
                <dl className="space-y-3 border-t border-[#EDE5D8] pt-5 text-sm">
                  {p.hours && (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#9E6B3F]" />
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8178]">Hours</dt>
                        <dd className="mt-0.5 text-[#1C1C1C]">{p.hours}</dd>
                      </div>
                    </div>
                  )}
                  {place && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9E6B3F]" />
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8178]">Address</dt>
                        <dd className="mt-0.5 text-[#1C1C1C]">{place}</dd>
                        {p.address && (
                          <a
                            href={directionsUrl(p.address, p.locality)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-[#C8541A] hover:underline underline-offset-2"
                          >
                            <Navigation className="h-4 w-4" />
                            Get directions
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </aside>

          {/* ── About ─────────────────────────────────────────────────── */}
          {p.description && (
            <section className="min-w-0 lg:col-start-1">
              <h2 className={`${PF} text-2xl font-bold`}>About</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#3D3D3D]">
                {p.description}
              </p>
            </section>
          )}
        </div>

        <div className="mt-14 border-t border-[#EDE5D8] pt-6">
          <Link
            href="/promotions"
            className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-[#C8541A] hover:underline underline-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All promotions
          </Link>
        </div>
      </div>
    </article>
  );
}

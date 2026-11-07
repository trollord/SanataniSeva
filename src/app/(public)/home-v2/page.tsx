export const dynamic = "force-dynamic";

import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import {
  ShieldCheck,
  UserCheck,
  Ban,
  ArrowRight,
  Home,
  ShoppingBag,
  Users,
  Newspaper,
  Hammer,
  Wrench,
  UtensilsCrossed,
  Bug,
} from "lucide-react";
import StackedCards from "@/components/ui/stacked-cards";
import HeroMosaic from "@/components/home-v2/HeroMosaic";
import ListPropertyCTA from "@/components/property/ListPropertyCTA";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ProcessSection from "@/components/ui/ProcessSection";
import NewsBannerStrip from "@/components/newspaper/NewsBannerStrip";

const getHomeData = unstable_cache(
  async () => {
    const [stats, marketplaceItems, newsItems] = await Promise.all([
      Promise.all([
        prisma.property.count({ where: { status: "ACTIVE" } }),
        prisma.inquiry.count({ where: { status: "COMPLETED" } }),
        prisma.user.count({ where: { role: "OWNER" } }),
      ]),
      prisma.item.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          title: true,
          price: true,
          category: true,
          images: {
            select: { url: true, isPrimary: true },
            orderBy: { isPrimary: "desc" },
            take: 1,
          },
        },
      }),
      prisma.newsItem.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { headline: true, category: true },
      }),
    ]);
    return { stats, marketplaceItems, newsItems };
  },
  ["home-data"],
  { revalidate: 60 },
);

const PF = "font-[family-name:var(--font-playfair)]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px w-8 shrink-0 bg-[#C8541A]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8541A]">
        {children}
      </span>
    </div>
  );
}

const ADVANTAGE_CARDS = [
  {
    label: "Homes",
    title: "Zero Brokerage.\nDirect from Owners.",
    description:
      "Browse verified rentals and sales directly from owners. No middlemen, no commissions — just honest listings and direct contact.",
  },
  {
    label: "Marketplace",
    title: "Buy & Sell\nWith Neighbours.",
    description:
      "Second-hand furniture, electronics, vehicles and more — listed by residents of Hiranandani Estate. Zero fees, direct deals.",
  },
  {
    label: "Community Directory",
    title: "Trusted Local\nVendors & Services.",
    description:
      "A curated list of trusted tradespeople, doctors, tutors and local businesses serving Hiranandani Estate — all verified.",
  },
  {
    label: "News & Events",
    title: "Stay in the\nLoop.",
    description:
      "Weekly editions covering neighbourhood news, notices and local events — everything happening inside the estate, delivered free.",
  },
];

export default async function HomeV2Page() {
  const { stats, marketplaceItems, newsItems } = await getHomeData();
  const [activeListings, completedDeals, owners] = stats;

  return (
    <div className="bg-[#FAF8F5] text-[#1C1C1C]">

      <NewsBannerStrip items={newsItems} />

      {/* ══════════════════════════════════════════════════════════════════
          HERO  — two-col, warm cream bg
      ══════════════════════════════════════════════════════════════════ */}
      <section className="min-h-[calc(100vh-172px)] flex items-center px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1440px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* Left: copy */}
            <div>
              <SectionLabel>Your Community Hub</SectionLabel>

              <h1 className={`${PF} text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5 sm:mb-6`}>
                Everything you need,{" "}
                <em className="text-[#C8541A]">all in one place.</em>
              </h1>

              <p className="text-[#6B6B6B] text-base sm:text-lg leading-relaxed max-w-lg mb-8 sm:mb-10">
                Homes, second-hand deals, local services and community contacts — all built for residents of Hiranandani Estate. Free, always.
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 bg-[#C8541A] text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  Explore Homes
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 text-[#1C1C1C] font-semibold text-sm hover:text-[#C8541A] transition-colors"
                >
                  Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right: feature mosaic — desktop only */}
            <div className="hidden lg:block lg:max-h-[520px]">
              <HeroMosaic />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ADVANTAGE  — 2-col: feature list + stacked cards
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-10 sm:gap-16 lg:gap-20 items-start">

          {/* Left: feature list */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-32">
            <SectionLabel>Why Choose Us</SectionLabel>
            <h2 className={`${PF} text-2xl sm:text-4xl md:text-5xl font-bold leading-tight mb-7 sm:mb-10`}>
              The platform built for{" "}
              <em className="text-[#C8541A]">real people.</em>
            </h2>
            <div className="space-y-5 sm:space-y-8">
              {[
                { icon: Home,        title: "Homes",               desc: "Browse verified rentals and sales directly from owners. Zero brokerage, always free." },
                { icon: ShoppingBag, title: "Marketplace",         desc: "Buy and sell second-hand goods with your neighbours — furniture, electronics, vehicles and more." },
                { icon: Users,       title: "Community Directory", desc: "A curated list of trusted local vendors, services, and tradespeople serving Hiranandani Estate." },
                { icon: Newspaper,   title: "News & Events",       desc: "Stay up to date with the neighbourhood — weekly editions and local announcements." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#F0E9DF]">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#C8541A]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[#1C1C1C] mb-0.5">{title}</h4>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stacked cards — desktop only; simple list on mobile */}
          <div className="w-full lg:w-[55%]">
            {/* Desktop stacked scroll */}
            <div className="hidden sm:block">
              <StackedCards cards={ADVANTAGE_CARDS} />
            </div>

            {/* Mobile: plain card list */}
            <div className="sm:hidden space-y-3 mt-2">
              {ADVANTAGE_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 border border-[#EDE5D8] bg-white"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8541A]">
                    {card.label}
                  </span>
                  <h3 className={`${PF} text-lg font-bold text-[#1C1C1C] mt-2 mb-2 whitespace-pre-line leading-snug`}>
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-[#F0E9DF] px-5 sm:px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            <AnimatedCounter key="listings" end={activeListings} suffix="+" label="Active Listings" />,
            <AnimatedCounter key="deals" end={completedDeals} suffix="+" label="Deals Closed" />,
            <AnimatedCounter key="owners" end={owners} suffix="+" label="Verified Owners" />,
            <div key="free">
              <div className={`${PF} text-3xl sm:text-4xl font-bold text-[#C8541A] tracking-tight mb-1`}>Always</div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#9E6B3F]">Free</div>
            </div>,
          ].map((child, i) => (
            <div key={i} className="bg-white rounded-xl p-5 sm:p-8 border border-[#EDE5D8]">
              {child}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURE HIGHLIGHTS  — numbered bento cards
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 bg-[#FAF8F5]">
        <div className="max-w-[1440px] mx-auto">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-16">
            <div>
              <SectionLabel>The Hiranandani Advantage</SectionLabel>
              <h2 className={`${PF} text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight`}>
                A little different,{" "}
                <em className="text-[#C8541A]">from the rest.</em>
              </h2>
            </div>
            <p className="text-[#6B6B6B] text-sm sm:text-base leading-relaxed lg:max-w-sm">
              We&apos;ve built the only platform in Hiranandani Estate that connects
              you directly with verified property owners — at zero cost.
            </p>
          </div>

          {/* 3 bento cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                icon: ShieldCheck,
                title: "Manually Verified",
                desc: "Every listing is scrutinized by our curation team to ensure accuracy and authenticity.",
                label: "TRUST",
                warm: true,
              },
              {
                num: "02",
                icon: UserCheck,
                title: "Owner Only",
                desc: "We maintain a direct ecosystem where only property owners are permitted to list.",
                label: "DIRECT",
                warm: false,
              },
              {
                num: "03",
                icon: Ban,
                title: "Zero Brokerage",
                desc: "Deal directly with verified owners — you never pay a rupee in brokerage or commissions.",
                label: "FREE",
                warm: false,
              },
            ].map(({ num, icon: Icon, title, desc, label, warm }) => (
              <div
                key={title}
                className={`rounded-2xl p-6 sm:p-8 relative flex flex-col justify-between min-h-[220px] sm:min-h-[260px] ${
                  warm ? "bg-[#F0E9DF]" : "bg-white border border-[#EDE5D8]"
                }`}
              >
                <div>
                  <span className="absolute top-5 right-5 sm:top-6 sm:right-7 text-xs text-[#9E6B3F] font-medium">{num}</span>
                  <Icon
                    className="text-[#C8541A]/60 mb-5 sm:mb-7"
                    style={{ width: 28, height: 28 }}
                    strokeWidth={1.4}
                  />
                  <h3 className={`${PF} text-xl sm:text-2xl font-bold text-[#1C1C1C] mb-2`}>{title}</h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed">{desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9E6B3F] mt-6">{label}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SIMPLE PROCESS
      ══════════════════════════════════════════════════════════════════ */}
      <ProcessSection />

      {/* ══════════════════════════════════════════════════════════════════
          MARKETPLACE + COMMUNITY  — two-col, warm beige bg
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 bg-[#F0E9DF]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

          {/* Left — Marketplace */}
          <div className="bg-[#FAF8F5] rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <SectionLabel>Marketplace</SectionLabel>
              <h2 className={`${PF} text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4`}>
                Good things,{" "}
                <em className="text-[#C8541A]">made nearby.</em>
              </h2>
              <p className="text-[#6B6B6B] text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                Buy and sell second-hand goods with your neighbours — furniture,
                electronics, vehicles and more. No commissions, direct contact.
              </p>

              {/* Item preview cards */}
              <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8">
                {marketplaceItems.length > 0 ? (
                  marketplaceItems.map((item) => {
                    const img = item.images[0];
                    return (
                      <Link
                        key={item.id}
                        href={`/marketplace/${item.id}`}
                        className="group rounded-xl overflow-hidden border border-[#EDE5D8] bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-[4/3] bg-[#F0E9DF]">
                          {img ? (
                            <Image
                              src={img.url}
                              alt={item.title}
                              fill
                              sizes="(max-width: 640px) 40vw, 200px"
                              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-[#9E6B3F]/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 sm:p-3">
                          <p className="text-xs font-semibold text-[#1C1C1C] leading-tight line-clamp-1">{item.title}</p>
                          <p className="text-xs font-bold text-[#C8541A] mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  [
                    { label: "Wooden study table", price: "4,500" },
                    { label: "iPhone 13 Pro", price: "52,000" },
                  ].map((p) => (
                    <div key={p.label} className="rounded-xl overflow-hidden border border-[#EDE5D8] bg-white">
                      <div className="aspect-[4/3] bg-[#F0E9DF] flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-[#9E6B3F]/40" />
                      </div>
                      <div className="p-2.5 sm:p-3">
                        <p className="text-xs font-semibold text-[#1C1C1C] leading-tight">{p.label}</p>
                        <p className="text-xs font-bold text-[#C8541A] mt-1">₹{p.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-[#C8541A] text-white px-5 sm:px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-95 transition-all self-start"
            >
              Browse marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right — Community Directory */}
          <div className="bg-[#EDE0CC] rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <SectionLabel>Community Directory</SectionLabel>
              <h2 className={`${PF} text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4 text-[#1C1C1C]`}>
                People you can{" "}
                <em className="text-[#C8541A]">count on.</em>
              </h2>
              <p className="text-[#6B6B6B] text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                A curated list of trusted local vendors, tradespeople, and service
                providers who know Hiranandani Estate inside out.
              </p>

              {/* Preview rows */}
              <div className="space-y-2.5 sm:space-y-3">
                {[
                  { label: "Carpenters & Woodwork",   icon: Hammer          },
                  { label: "Plumbers & Electricians", icon: Wrench          },
                  { label: "Tiffin & Home Food",      icon: UtensilsCrossed },
                  { label: "Pest Control",            icon: Bug             },
                ].map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-[#FAF8F5] rounded-xl px-3.5 sm:px-4 py-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#F0E9DF] flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-[#C8541A]" strokeWidth={1.6} />
                    </div>
                    <span className="text-[#1C1C1C] text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/community"
              className="inline-flex items-center gap-2 border border-[#1C1C1C]/20 text-[#1C1C1C] px-5 sm:px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#FAF8F5] active:scale-95 transition-all self-start mt-6 sm:mt-8"
            >
              View directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          OWNER CTA  — dark split banner
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-24 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="bg-[#1C1C1C] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 p-6 sm:p-12 lg:p-20">
            <h2 className={`${PF} text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-6`}>
              Own a property in Hiranandani?
            </h2>
            <p className="text-white/70 text-sm sm:text-lg mb-6 sm:mb-10 leading-relaxed max-w-md">
              List it for free and reach thousands of verified seekers directly.
              We help you find the best tenants or buyers without commissions.
            </p>
            <ListPropertyCTA />
          </div>
          <div className="w-full md:w-1/2 h-44 sm:h-64 md:h-auto self-stretch">
            <img
              src="/images/hiranandanilol.jpeg"
              alt="Hiranandani Estate"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA  — dark closing section
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-32 px-5 sm:px-8 bg-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-5 sm:mb-6">
            <div className="h-px w-8 bg-[#C8541A]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8541A]">
              Your Next Move
            </span>
            <div className="h-px w-8 bg-[#C8541A]" />
          </div>
          <h2 className={`${PF} text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 sm:mb-6`}>
            Ready to find your{" "}
            <em className="text-[#C8541A]">home?</em>
          </h2>
          <p className="text-white/60 text-sm sm:text-lg max-w-md sm:max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed">
            Hundreds of verified listings, zero brokerage — everything you need
            to find your next home in Hiranandani Estate.
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 bg-[#C8541A] text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Explore listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}

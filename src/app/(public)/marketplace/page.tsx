import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MarketplaceGrid from "@/components/marketplace/MarketplaceGrid";
import type { MarketplaceItemCard } from "@/components/marketplace/ItemCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace - Buy and sell used items in Hiranandani Estate",
  description:
    "Browse used furniture, electronics, computers and vehicles from your neighbours in Hiranandani Estate. Zero commissions, direct seller contact.",
  alternates: { canonical: "/marketplace" },
};

export default async function MarketplacePage() {
  const rows = await prisma.item.findMany({
    where: { status: { in: ["ACTIVE", "SOLD"] } },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      vehicleType: true,
      condition: true,
      status: true,
      price: true,
      priceNegotiable: true,
      pickupLocality: true,
      createdAt: true,
      images: {
        select: { url: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  const items: MarketplaceItemCard[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt,
  }));

  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3">
              Marketplace
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl font-bold text-[#0B0B0C] mb-4">
              Buy &amp; Sell in the Estate
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl">
              Furniture, electronics, vehicles and more - listed by your
              neighbours in Hiranandani Estate. No commissions, no middlemen.
            </p>
          </div>
          <Link
            href="/dashboard/items/new"
            className="shrink-0 inline-flex items-center gap-2 bg-[#FF5F15] text-white
                       px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                       hover:opacity-90 transition-opacity mt-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Sell an item</span>
            <span className="sm:hidden">Sell</span>
          </Link>
        </div>

        {/* Grid + filters */}
        <MarketplaceGrid items={items} />

        {/* Mobile CTA */}
        <Link
          href="/dashboard/items/new"
          className="sm:hidden inline-flex items-center justify-center gap-2 bg-[#FF5F15] text-white px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity w-full mt-8"
        >
          <PlusCircle className="w-4 h-4" /> Sell an item
        </Link>

        {/* Notice */}
        <p className="flex items-start gap-2 text-[11px] sm:text-xs text-gray-400 leading-relaxed mt-10 sm:mt-14">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            Prices and condition descriptions are provided by sellers. Verify
            the item in person before paying. Sanatani Community is a listing platform
            and does not mediate transactions.
          </span>
        </p>

        {/* CTA */}
        <div className="bg-[#1C0A00] rounded-2xl p-6 sm:p-10 mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3">
              Have something to sell?
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-3xl font-bold text-white mb-2">
              List it in under 3 minutes
            </h2>
            <p className="text-white/45 text-xs sm:text-sm leading-relaxed max-w-md">
              Add a few photos, set a price, and reach every resident of
              Hiranandani Estate. Free, always.
            </p>
          </div>
          <Link
            href="/dashboard/items/new"
            className="inline-flex items-center gap-2 bg-white text-[#FF5F15] px-6 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shrink-0 self-start sm:self-auto"
          >
            Post an item
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

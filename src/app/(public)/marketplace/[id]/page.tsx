import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { Phone, MapPin, CalendarClock, Tag, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import PropertyGallery from "@/components/property/PropertyGallery";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import { formatPrice, formatDate } from "@/lib/utils/formatters";
import ItemContactSection from "@/components/marketplace/ItemContactSection";
import ItemCard, {
  type MarketplaceItemCard,
} from "@/components/marketplace/ItemCard";
import {
  ITEM_CATEGORY_LABELS,
  ITEM_CONDITION_LABELS,
  VEHICLE_TYPE_LABELS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/constants";

export const revalidate = 3600;

const getItem = cache(async (id: string) => {
  return prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      title: true,
      description: true,
      category: true,
      vehicleType: true,
      condition: true,
      brand: true,
      yearPurchased: true,
      price: true,
      priceNegotiable: true,
      phonePublic: true,
      pickupLocality: true,
      pickupArea: true,
      createdAt: true,
      images: {
        select: { id: true, url: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
      },
      seller: { select: { id: true, name: true, phone: true, image: true, createdAt: true } },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return { title: "Item not found" };
  const categoryLabel = ITEM_CATEGORY_LABELS[item.category] ?? item.category;
  return {
    title: `${item.title} - ${formatPrice(item.price)} · ${SITE_NAME} Marketplace`,
    description: `${categoryLabel} · ${item.condition} condition · Pickup in ${item.pickupLocality}. ${item.description.slice(0, 140)}`,
    alternates: { canonical: `/marketplace/${item.id}` },
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, session] = await Promise.all([getItem(id), auth()]);
  if (!item || item.status !== "ACTIVE") notFound();

  const categoryLabel = ITEM_CATEGORY_LABELS[item.category] ?? item.category;
  const conditionLabel = ITEM_CONDITION_LABELS[item.condition] ?? item.condition;
  const vehicleLabel = item.vehicleType
    ? VEHICLE_TYPE_LABELS[item.vehicleType]
    : null;

  const sellerName = item.seller.name ?? "Seller";
  const sellerPhone = item.seller.phone ?? "";
  const sellerSince = new Date(item.seller.createdAt).getFullYear();

  const whatsAppMsg =
    `Hi ${sellerName.split(" ")[0]}, I saw your listing "${item.title}" ` +
    `on ${SITE_NAME} and I'd like to know more.\n\n${SITE_URL}/marketplace/${item.id}`;

  // Similar listings
  const similar = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
      category: item.category,
      id: { not: item.id },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      category: true,
      vehicleType: true,
      condition: true,
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

  const similarCards: MarketplaceItemCard[] = similar;

  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-5">
          <Link href="/marketplace" className="hover:text-gray-700 transition-colors">
            Marketplace
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{categoryLabel}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <PropertyGallery images={item.images} title={item.title} />
          </div>

          {/* Price card */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-28 bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 space-y-5">
              {/* Title + chips */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Chip>{categoryLabel}</Chip>
                  {vehicleLabel && <Chip>{vehicleLabel}</Chip>}
                  <Chip>{conditionLabel}</Chip>
                </div>
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {item.title}
                </h1>
              </div>

              {/* Price */}
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FF5F15]">
                  {formatPrice(item.price)}
                </p>
                {item.priceNegotiable && (
                  <p className="text-xs text-gray-500 mt-1">Negotiable</p>
                )}
              </div>

              {/* Meta rows */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                {item.brand && (
                  <MetaRow icon={<Tag className="w-4 h-4" />} label="Brand" value={item.brand} />
                )}
                {item.yearPurchased && (
                  <MetaRow
                    icon={<CalendarClock className="w-4 h-4" />}
                    label="Year purchased"
                    value={String(item.yearPurchased)}
                  />
                )}
                <MetaRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Pickup"
                  value={
                    item.pickupArea
                      ? `${item.pickupArea}, ${item.pickupLocality}`
                      : item.pickupLocality
                  }
                />
              </div>

              {/* Seller */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-2">
                  Posted by
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {sellerName}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Member since {sellerSince}
                </p>
              </div>

              {/* Contact section */}
              <ItemContactSection
                itemId={item.id}
                itemTitle={item.title}
                sellerName={sellerName}
                sellerPhone={sellerPhone}
                whatsAppMsg={whatsAppMsg}
                phonePublic={item.phonePublic}
                isLoggedIn={!!session}
                isSeller={session?.user?.id === item.seller.id}
              />

              {/* Posted date */}
              <p className="text-[11px] text-gray-400 text-center">
                Posted on {formatDate(item.createdAt)}
              </p>
            </div>
          </aside>
        </div>

        {/* Description */}
        <section className="mt-10 sm:mt-14 max-w-3xl">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900 mb-4">
            About this item
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
        </section>

        {/* Trust note */}
        <section className="bg-[#F5F5F5] rounded-2xl p-5 sm:p-6 mt-8 flex items-start gap-3 max-w-3xl">
          <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Transact safely
            </p>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              Inspect the item in person before paying. Prefer cash or UPI on
              handover. Sanatani Community does not hold funds or guarantee item
              condition.
            </p>
          </div>
        </section>

        {/* Similar */}
        {similarCards.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#FF5F15]">
                More in {categoryLabel}
              </h2>
              <Link
                href="/marketplace"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 hover:text-[#FF5F15] transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {similarCards.map((s) => (
                <ItemCard key={s.id} item={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 bg-[#EBEBEB] px-3 py-1 rounded-full">
      {children}
    </span>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

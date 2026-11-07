import Link from "next/link";
import Image from "next/image";
import {
  ITEM_CATEGORY_LABELS,
  VEHICLE_TYPE_LABELS,
  ITEM_CONDITION_LABELS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils/formatters";

export interface MarketplaceItemCard {
  id: string;
  title: string;
  category: string;
  vehicleType?: string | null;
  condition: string;
  status?: string;
  price: number;
  priceNegotiable: boolean;
  pickupLocality: string;
  createdAt: Date | string;
  images: { url: string; isPrimary: boolean }[];
}

function daysAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function ItemCard({ item }: { item: MarketplaceItemCard }) {
  const primary = item.images.find((i) => i.isPrimary) ?? item.images[0];
  const categoryLabel = ITEM_CATEGORY_LABELS[item.category] ?? item.category;
  const vehicleLabel = item.vehicleType
    ? VEHICLE_TYPE_LABELS[item.vehicleType]
    : null;
  const conditionLabel = ITEM_CONDITION_LABELS[item.condition] ?? item.condition;
  const sold = item.status === "SOLD";

  return (
    <Link
      href={`/marketplace/${item.id}`}
      className="group relative block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Sold overlay */}
      {sold && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1.5px] flex items-center justify-center rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 bg-white border border-gray-300 px-3.5 py-1.5 rounded-full shadow-sm">
            Sold
          </span>
        </div>
      )}
      <div className="relative aspect-[4/3] bg-[#F5F5F5]">
        {primary ? (
          <Image
            src={primary.url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] uppercase tracking-widest text-gray-400">
            No photo
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600 px-2.5 py-1 rounded-full">
          {vehicleLabel ?? categoryLabel}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-[#0B0B0C] leading-tight line-clamp-2 min-h-[2.6em]">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500 bg-[#EBEBEB] px-2 py-0.5 rounded-full">
            {conditionLabel}
          </span>
          {vehicleLabel && (
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500 bg-[#EBEBEB] px-2 py-0.5 rounded-full">
              {categoryLabel}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between mt-4 gap-2">
          <div>
            <p className="font-extrabold tracking-tight text-[#0B0B0C] text-lg sm:text-xl">
              {formatPrice(item.price)}
            </p>
            {item.priceNegotiable && (
              <p className="text-[10px] text-gray-400 mt-0.5">Negotiable</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
              {item.pickupLocality}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {daysAgo(item.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";

import { formatPrice, formatArea, isVideoUrl } from "@/lib/utils/formatters";
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, FURNISHED_LABELS } from "@/lib/constants";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { ImageOff, BedDouble } from "lucide-react";

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface PropertyCardData {
  id: string;
  title: string;
  type: string;
  listingType: string;
  locality: string;
  building: string;
  bedrooms: number | null;
  areaSqft: number;
  furnished: string;
  price: number;
  deposit: number | null;
  availableFrom?: string | null;
  images: PropertyImage[];
}

interface Props {
  property: PropertyCardData;
  variant?: "grid" | "list";
}

export default function PropertyCard({ property, variant = "grid" }: Props) {
  const stills = property.images.filter((i) => !isVideoUrl(i.url));
  const primaryImage = stills.find((i) => i.isPrimary) ?? stills[0];
  const isRent = property.listingType === "RENT";
  const availabilityLabel =
    property.availableFrom === "IMMEDIATE"
      ? "Ready to Move"
      : property.availableFrom
      ? `From ${new Date(`${property.availableFrom}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : null;

  if (variant === "list") {
    return (
      <Link href={`/listings/${property.id}`} className="block group">
        <div className="bg-white rounded-xl overflow-hidden flex flex-row shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)] transition-shadow duration-200 border border-zinc-100">

          {/* Thumbnail - fixed small */}
          <div className="relative w-[110px] sm:w-[160px] h-[90px] sm:h-[110px] flex-shrink-0 self-stretch">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={property.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 110px, 160px"
              />
            ) : (
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                <ImageOff className="w-5 h-5 text-zinc-300" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <span className="bg-[#0B0B0C] text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                {LISTING_TYPE_LABELS[property.listingType] ?? property.listingType}
              </span>
              {availabilityLabel && (
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  {availabilityLabel}
                </span>
              )}
            </div>
          </div>

          {/* Info - compact two-row layout */}
          <div className="flex flex-col justify-center flex-1 px-3 sm:px-4 py-2.5 min-w-0 gap-1">

            {/* Row 1: title + price */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 leading-snug line-clamp-1 min-w-0">
                {property.title}
              </h3>
              <span className="text-sm sm:text-base font-black text-zinc-900 leading-none shrink-0 whitespace-nowrap">
                {formatPrice(property.price)}
                {isRent && <span className="text-[11px] font-medium text-zinc-400 ml-0.5">/mo</span>}
              </span>
            </div>

            {/* Row 2: location */}
            <p className="flex items-center gap-1 text-zinc-400 text-xs truncate">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">
                {property.building ? `${property.building}, ` : ""}{property.locality}
              </span>
            </p>

            {/* Row 3: stats chips */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium flex-wrap">
              {property.bedrooms && (
                <span className="flex items-center gap-0.5">
                  <BedDouble className="w-3 h-3 flex-shrink-0" />
                  {property.bedrooms} BHK
                </span>
              )}
              <span className="text-zinc-300">·</span>
              <span>{formatArea(property.areaSqft)}</span>
              <span className="text-zinc-300">·</span>
              <span>{FURNISHED_LABELS[property.furnished] ?? property.furnished}</span>
              <span className="hidden sm:flex items-center gap-0.5 ml-auto text-zinc-400 group-hover:text-zinc-600 transition-colors">
                <span className="text-[10px] font-semibold">{PROPERTY_TYPE_LABELS[property.type] ?? property.type}</span>
                <span className="ml-1">→</span>
              </span>
            </div>

          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (unchanged)
  return (
    <CardContainer containerClassName="w-full h-full">
      <CardBody className="w-full h-full">
        <Link href={`/listings/${property.id}`} className="block h-full">
          <div className="bg-white rounded-xl overflow-visible flex flex-col h-full shadow-[0_4px_20px_rgba(0,0,0,0.04)]">

            <CardItem translateZ={60} className="relative z-0 w-full flex-shrink-0 rounded-t-xl overflow-hidden">
              <div className="relative h-52 sm:h-60 lg:h-64 w-full">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex flex-col items-center justify-center gap-2">
                    <ImageOff className="w-7 h-7 text-zinc-300" />
                    <span className="text-xs text-zinc-400 font-medium">No photos</span>
                  </div>
                )}

                <CardItem translateZ={80} className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-[#0B0B0C] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {LISTING_TYPE_LABELS[property.listingType] ?? property.listingType}
                  </span>
                  <span className="bg-white/80 backdrop-blur-md text-zinc-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
                  </span>
                  {availabilityLabel && (
                    <span className="bg-emerald-600/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {availabilityLabel}
                    </span>
                  )}
                </CardItem>
              </div>
            </CardItem>

            <div className="relative z-10 p-5 sm:p-6 flex flex-col flex-grow overflow-visible">

              <CardItem translateZ={40} className="w-full mb-1">
                <div className="relative group/title">
                  <h3 className="line-clamp-1 text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 leading-snug cursor-default">
                    {property.title}
                  </h3>
                  <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-50 opacity-0 group-hover/title:opacity-100 transition-opacity duration-200">
                    <div className="bg-[#FF5F15] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-[260px] leading-snug break-words">
                      {property.title}
                    </div>
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-zinc-900 ml-3 mt-0" />
                  </div>
                </div>
              </CardItem>

              <CardItem translateZ={30} className="w-full">
                <p className="flex items-center gap-1 text-zinc-500 text-sm h-[1.375rem] mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">
                    {property.building ? `${property.building}, ` : ""}
                    {property.locality}
                  </span>
                </p>
              </CardItem>

              <CardItem translateZ={20} className="w-full mt-auto pt-4 border-t border-zinc-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base md:text-lg font-black text-zinc-900 leading-none truncate">
                    {formatPrice(property.price)}
                    {isRent && (
                      <span className="text-xs sm:text-sm font-medium text-zinc-400 ml-1">/mo</span>
                    )}
                  </span>
                  <div className="flex gap-2 sm:gap-3 text-xs font-medium text-zinc-500 shrink-0">
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" />
                        {property.bedrooms}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      {formatArea(property.areaSqft)}
                    </span>
                  </div>
                </div>
              </CardItem>

            </div>
          </div>
        </Link>
      </CardBody>
    </CardContainer>
  );
}

import { formatPrice, formatArea } from "./formatters";
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  FURNISHED_LABELS,
} from "@/lib/constants";

export interface ShareableProperty {
  id: string;
  title: string;
  type: string;
  listingType: string;
  building: string;
  locality: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqft: number;
  furnished: string;
  price: number;
  deposit?: number | null;
}

/** Builds a WhatsApp-formatted message (uses *bold* and _italic_ markup). */
export function buildWhatsAppMessage(p: ShareableProperty, propertyUrl: string): string {
  const isRent = p.listingType === "RENT";
  const typeLabel = PROPERTY_TYPE_LABELS[p.type] ?? p.type;
  const listingLabel = LISTING_TYPE_LABELS[p.listingType] ?? p.listingType;
  const furnishedLabel = FURNISHED_LABELS[p.furnished] ?? p.furnished;

  const specs = [
    p.bedrooms ? `🛏 ${p.bedrooms} Bed${p.bedrooms > 1 ? "s" : ""}` : null,
    p.bathrooms ? `🛁 ${p.bathrooms} Bath${p.bathrooms > 1 ? "s" : ""}` : null,
    `📐 ${formatArea(p.areaSqft)}`,
  ].filter(Boolean).join(" · ");

  const lines = [
    `🏠 *${p.title}*`,
    ``,
    `📍 ${p.building}, ${p.locality}, Thane`,
    `🏷 ${typeLabel} for ${listingLabel} · ${furnishedLabel}`,
    specs,
    `💰 *${formatPrice(p.price)}${isRent ? "/month" : ""}*${
      isRent && p.deposit ? ` (Deposit: ${formatPrice(p.deposit)})` : ""
    }`,
    ``,
    `✨ View photos & full details:`,
    propertyUrl,
    ``,
    `_Listed on Sanatani Community - zero brokerage, 100% verified._`,
  ];

  return lines.join("\n");
}

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Direct chat link to a phone number. Normalizes Indian numbers to E.164 (no +). */
export function whatsAppContactUrl(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

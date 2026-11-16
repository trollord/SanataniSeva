import { BadgePercent, Navigation, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import { canWhatsApp, directionsUrl, telHref, type PromotionView } from "@/lib/promotions";

/*
 * Shared by the spotlight slider, the cards and the detail page. No hooks and
 * no "use client", so the server-rendered detail page and the client slider
 * import the same markup.
 */

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8541A]";

/** 44px tall: these are tapped on phones far more often than clicked. */
export const PRIMARY_BTN = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#C8541A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#B34A16] ${FOCUS}`;
export const OUTLINE_BTN = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#EDE5D8] bg-white px-4 text-sm font-semibold text-[#1C1C1C] transition-colors hover:border-[#C8541A] hover:text-[#A8410F] ${FOCUS}`;

type Reach = Pick<PromotionView, "name" | "phone" | "whatsapp" | "address" | "locality">;

export function whatsAppMessageUrl(p: Pick<PromotionView, "name" | "phone">): string {
  return whatsAppContactUrl(
    p.phone ?? "",
    `Hi ${p.name}, I saw your promotion on Sanatani Seva (Hiranandani Estate).`
  );
}

/**
 * Call / WhatsApp / Directions, each only when there is something behind it.
 * `compact` keeps Call's label but drops the others' below sm, for the slider's
 * narrow column on a phone.
 */
export default function PromotionActions({
  promotion: p,
  directions = false,
  compact = false,
  className = "",
}: {
  promotion: Reach;
  directions?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const showWhatsApp = canWhatsApp(p);
  const showDirections = directions && Boolean(p.address);
  if (!p.phone && !showDirections) return null;

  const label = compact ? "hidden sm:inline" : "";
  const iconOnly = compact ? "w-11 px-0 sm:w-auto sm:px-4" : "";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {p.phone && (
        <a href={telHref(p.phone)} aria-label={`Call ${p.name}`} className={PRIMARY_BTN}>
          <Phone className="h-4 w-4" />
          Call
        </a>
      )}
      {showWhatsApp && (
        <a
          href={whatsAppMessageUrl(p)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Message ${p.name} on WhatsApp`}
          className={`${OUTLINE_BTN} ${iconOnly}`}
        >
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          <span className={label}>WhatsApp</span>
        </a>
      )}
      {showDirections && (
        <a
          href={directionsUrl(p.address, p.locality)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Directions to ${p.name}`}
          className={`${OUTLINE_BTN} ${iconOnly}`}
        >
          <Navigation className="h-4 w-4" />
          <span className={label}>Directions</span>
        </a>
      )}
    </div>
  );
}

/** The offer, as the accent badge every surface uses. */
export function OfferBadge({ offer, className = "" }: { offer: string; className?: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#FDDCC8] bg-[#FFF3EC] px-2.5 py-1 text-[12px] font-semibold text-[#C8541A] ${className}`}
    >
      <BadgePercent className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{offer}</span>
    </span>
  );
}

/** Small uppercase category label, matching the news chips. */
export function CategoryChip({ label }: { label: string }) {
  return (
    <span className="max-w-full truncate rounded-full border border-[#EDE5D8] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A4F2A]">
      {label}
    </span>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Heart, CheckCircle2 } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import ItemInterestModal from "@/components/marketplace/ItemInterestModal";

interface Props {
  itemId: string;
  itemTitle: string;
  sellerName: string;
  sellerPhone: string;
  whatsAppMsg: string;
  phonePublic: boolean;
  isLoggedIn: boolean;
  isSeller: boolean;
}

export default function ItemContactSection({
  itemId,
  itemTitle,
  sellerName,
  sellerPhone,
  whatsAppMsg,
  phonePublic,
  isLoggedIn,
  isSeller,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [sent, setSent] = useState(false);

  if (phonePublic) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
        <a
          href={`tel:${sellerPhone.replace(/\s/g, "")}`}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#FF5F15] text-white px-3 py-3 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
        <a
          href={whatsAppContactUrl(sellerPhone || "+91 9000000000", whatsAppMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white border border-gray-300 text-[#FF5F15] px-3 py-3 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap hover:border-gray-400 transition-colors"
        >
          <WhatsAppIcon className="w-4 h-4" /> WhatsApp
        </a>
      </div>
    );
  }

  // Private — message-based inquiry
  if (sent) {
    return (
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pt-2">
        <CheckCircle2 className="h-5 w-5 text-[#FF5F15] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#FF5F15]">Message sent!</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {sellerName.split(" ")[0]} has been notified and will reach out to you.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=/marketplace/${itemId}`}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#FF5F15] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity pt-2"
      >
        <Heart className="w-4 h-4" /> I&apos;m Interested
      </Link>
    );
  }

  if (isSeller) {
    return (
      <p className="text-xs text-gray-400 text-center pt-2">This is your listing.</p>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#FF5F15] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity pt-2"
      >
        <Heart className="w-4 h-4" /> I&apos;m Interested
      </button>

      {showModal && (
        <ItemInterestModal
          itemId={itemId}
          itemTitle={itemTitle}
          sellerName={sellerName}
          onSuccess={() => { setShowModal(false); setSent(true); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import {
  buildWhatsAppMessage,
  whatsAppShareUrl,
  type ShareableProperty,
} from "@/lib/utils/whatsapp";

export function WhatsAppShareModal({
  open,
  onClose,
  property,
  title = "Share this property",
  subtitle = "WhatsApp Message",
  description = "Copy the ready-made message below or open WhatsApp to share it directly.",
}: {
  open: boolean;
  onClose: () => void;
  property: ShareableProperty;
  title?: string;
  subtitle?: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);

  const message = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.hiranandaniproperties.in";
    return buildWhatsAppMessage(property, `${origin}/listings/${property.id}`);
  }, [property]);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied - paste it anywhere!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy - please select and copy manually");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} description={description}>
      <div className="bg-[#f5f5f5] border border-gray-150 rounded-xl p-4 text-[13px] leading-relaxed text-gray-700 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
        {message}
      </div>

      <div className="flex flex-col gap-3 mt-5">
        <a
          href={whatsAppShareUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium tracking-wide bg-[#25D366] hover:bg-[#1fb958] text-white transition-colors"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Share on WhatsApp
        </a>
        <button
          onClick={copyMessage}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-[#FF5F15] hover:text-[#FF5F15] text-sm font-medium py-2.5 rounded-full transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Message"}
        </button>
      </div>
    </Modal>
  );
}

export function WhatsAppShareButton({ property }: { property: ShareableProperty }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-[#25D366] hover:text-[#25D366] text-sm font-medium py-2.5 rounded-full transition-colors"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Share on WhatsApp
      </button>
      <WhatsAppShareModal open={open} onClose={() => setOpen(false)} property={property} />
    </>
  );
}

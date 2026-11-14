"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import Modal from "@/components/ui/Modal";

/**
 * Overlay for one tile in the listing photo grid: a position picker on the
 * left, view and discard on the right. Always visible (no hover reveal) and
 * sized for fingers, since most listers upload from a phone.
 *
 * Render it after the tile's uploading / error overlays so it stays on top -
 * a photo can be reordered or discarded while it is still uploading.
 */
export default function PhotoTileControls({
  index,
  count,
  src,
  isVideo,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  src: string;
  isVideo: boolean;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const [viewing, setViewing] = useState(false);
  const label = `${isVideo ? "Video" : "Photo"} ${index + 1}`;

  return (
    <>
      <select
        value={index}
        onChange={(e) => onMove(Number(e.target.value))}
        aria-label={`Position of ${label.toLowerCase()}`}
        className="absolute top-1.5 left-1.5 h-8 rounded-full bg-white/90 pl-2.5 pr-1 text-xs font-semibold text-gray-900 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
      >
        {Array.from({ length: count }, (_, i) => (
          <option key={i} value={i}>
            {i + 1}
          </option>
        ))}
      </select>

      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <button
          type="button"
          onClick={() => setViewing(true)}
          aria-label={`View ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 hover:bg-gray-900 hover:text-white transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Modal open={viewing} onClose={() => setViewing(false)} title={label} size="lg">
        {isVideo ? (
          <video
            src={src}
            className="w-full max-h-[70dvh] rounded-xl bg-black object-contain"
            controls
            playsInline
          />
        ) : (
          /* Blob previews for fresh uploads, so next/image is skipped */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={label}
            className="w-full max-h-[70dvh] rounded-xl bg-gray-50 object-contain"
          />
        )}
      </Modal>
    </>
  );
}

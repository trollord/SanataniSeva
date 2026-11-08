"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, X, AlertCircle } from "lucide-react";

/**
 * Drag-and-drop image upload straight to S3.
 *
 * Uses the same two-step flow the listing and marketplace forms use - ask
 * /api/upload for a presigned URL, PUT the file to S3 from the browser - so no
 * image passes through the server and there is no new upload surface. The
 * caller only ever sees the resulting public URLs.
 *
 * Limits are the ones /api/upload enforces: 2 MB per image, jpeg/png/webp/heic,
 * 20 uploads per user per day.
 */

const MAX_BYTES = 2 * 1024 * 1024;

type Pending = {
  id: string;
  preview: string;
  error?: string;
};

export default function ImageDropzone({
  value,
  onChange,
  max = 6,
  disabled = false,
}: {
  /** Public S3 URLs already uploaded. */
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<Pending[]>([]);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const room = max - value.length - pending.length;
      if (room <= 0) {
        toast.error(`Up to ${max} images.`);
        return;
      }

      const tooBig = accepted.filter((f) => f.size > MAX_BYTES);
      tooBig.forEach((f) => toast.error(`"${f.name}" is over 2 MB.`));

      const files = accepted.filter((f) => f.size <= MAX_BYTES).slice(0, room);
      if (!files.length) return;

      // Show previews immediately; the uploads resolve behind them.
      const started: Pending[] = files.map((f, i) => ({
        id: `${Date.now()}-${i}-${f.name}`,
        preview: URL.createObjectURL(f),
      }));
      setPending((p) => [...p, ...started]);

      const uploaded = await Promise.all(
        files.map(async (file, i) => {
          const id = started[i].id;
          try {
            const res = await fetch(
              `/api/upload?filename=${encodeURIComponent(file.name)}` +
                `&contentType=${encodeURIComponent(file.type)}&fileSize=${file.size}`
            );
            if (!res.ok) {
              const e = await res.json().catch(() => ({}));
              throw new Error(e.error ?? "Could not get an upload URL");
            }
            const { presignedUrl, publicUrl } = await res.json();

            const put = await fetch(presignedUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            });
            if (!put.ok) {
              const body = await put.text().catch(() => "");
              throw new Error(
                body.match(/<Message>(.*?)<\/Message>/)?.[1] ?? `S3 error ${put.status}`
              );
            }
            return { id, url: publicUrl as string };
          } catch (e) {
            const message = e instanceof Error ? e.message : "Upload failed";
            toast.error(`"${file.name}": ${message}`);
            return { id, url: null };
          }
        })
      );

      const ok = uploaded.filter((u) => u.url).map((u) => u.url as string);
      if (ok.length) onChange([...value, ...ok]);

      // Clear every preview this batch created, successful or not - failures
      // were reported by toast and should not linger as ghost tiles.
      const ids = new Set(started.map((s) => s.id));
      setPending((p) => {
        p.filter((x) => ids.has(x.id)).forEach((x) => URL.revokeObjectURL(x.preview));
        return p.filter((x) => !ids.has(x.id));
      });
    },
    [value, onChange, max, pending.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
    },
    disabled: disabled || value.length + pending.length >= max,
  });

  const full = value.length + pending.length >= max;

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
          isDragActive
            ? "border-[#FF5F15] bg-[#FF5F15]/5"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        } ${full || disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <ImagePlus className="mb-2 h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "Drop to upload" : "Drag images here, or click to choose"}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          JPEG, PNG, WebP or HEIC · up to 2 MB each · {value.length + pending.length} of {max}
        </p>
      </div>

      {(value.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {value.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              <Image
                src={url}
                alt={i === 0 ? "Lead image" : `Image ${i + 1}`}
                fill
                sizes="160px"
                className="object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                  Lead
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove image ${i + 1}`}
                className="absolute top-1 right-1 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {pending.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              {/* Blob preview, so next/image optimisation is skipped here */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                {p.error ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length > 1 && (
        <p className="text-[11px] text-gray-400">
          The first image is used as the lead; remove and re-add to change it.
        </p>
      )}
    </div>
  );
}

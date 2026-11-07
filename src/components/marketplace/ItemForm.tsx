"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Upload, X, Loader2,
  Briefcase, Home, Zap, Monitor, Car, Package, Camera,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ITEM_CATEGORY_LABELS, ITEM_CATEGORIES,
  ITEM_CONDITION_LABELS, ITEM_CONDITIONS,
  VEHICLE_TYPE_LABELS, VEHICLE_TYPES,
  HIRANANDANI_LOCALITIES,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils/formatters";
import type { LucideIcon } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export interface UploadedImage {
  file?: File;
  preview: string;
  url: string;
  s3Key: string;
  isPrimary: boolean;
  uploading: boolean;
  error?: string;
}

/* ── Schema ──────────────────────────────────────────────────────────────────── */

const detailsSchema = z
  .object({
    category:        z.enum(ITEM_CATEGORIES as [string, ...string[]]),
    vehicleType:     z.enum(VEHICLE_TYPES as [string, ...string[]]).optional().or(z.literal("")),
    condition:       z.enum(ITEM_CONDITIONS as [string, ...string[]]),
    title:           z.string().min(5, "At least 5 characters").max(120),
    description:     z.string().min(20, "Describe the item in at least 20 characters").max(2000),
    brand:           z.string().max(80).optional().or(z.literal("")),
    yearPurchased:   z.coerce.number().int().min(1950).max(new Date().getFullYear()).optional().or(z.literal(0)).or(z.nan()),
    pickupLocality:  z.string().min(2, "Required").max(80),
    pickupArea:      z.string().max(120).optional().or(z.literal("")),
    price:           z.coerce.number().positive("Enter a selling price").max(100_000_000),
    priceNegotiable: z.boolean().default(false),
    phonePublic:     z.boolean().default(true),
  })
  .refine(
    (d) => d.category !== "VEHICLES" || !!d.vehicleType,
    { message: "Pick a vehicle type", path: ["vehicleType"] }
  );

export type DetailsData = z.infer<typeof detailsSchema>;

/* ── Constants ───────────────────────────────────────────────────────────────── */

const STEPS = [
  { label: "Details",  hint: "Category, description & price" },
  { label: "Photos",   hint: "Add clear photos to attract buyers" },
  { label: "Review",   hint: "Check everything before posting" },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  OFFICE_FURNITURE: Briefcase,
  HOME_FURNITURE:   Home,
  ELECTRONICS:      Zap,
  COMPUTERS:        Monitor,
  VEHICLES:         Car,
  OTHERS:           Package,
};

const CATEGORY_SHORT: Record<string, string> = {
  OFFICE_FURNITURE: "Office",
  HOME_FURNITURE:   "Home",
  ELECTRONICS:      "Electronics",
  COMPUTERS:        "Computers",
  VEHICLES:         "Vehicles",
  OTHERS:           "Others",
};

/* ── Step bar ────────────────────────────────────────────────────────────────── */

function StepBar({ current }: { current: number }) {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex gap-2 mb-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= current ? "bg-[#C8541A]" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-[#0B0B0C]">{STEPS[current].label}</p>
          <p className="text-sm text-gray-400 mt-0.5">{STEPS[current].hint}</p>
        </div>
        <span className="text-sm text-gray-400 shrink-0 mt-0.5">
          {current + 1} / {STEPS.length}
        </span>
      </div>
    </div>
  );
}

/* ── Step 1: Details + Pricing ───────────────────────────────────────────────── */

function DetailsStep({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<DetailsData>;
  onNext: (data: DetailsData) => void;
}) {
  const {
    register, control, handleSubmit, watch,
    formState: { errors },
  } = useForm<DetailsData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(detailsSchema) as any,
    defaultValues: { priceNegotiable: false, ...defaultValues },
  });

  const category    = watch("category");
  const description = watch("description") ?? "";
  const priceRaw    = watch("price");
  const priceNum    = Number(priceRaw);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-7">

      {/* Category cards */}
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold">Category *</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2.5">
              {ITEM_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const active = field.value === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => field.onChange(cat)}
                    className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all active:scale-95 ${
                      active
                        ? "border-[#C8541A] bg-[#FFF3EC] text-[#C8541A]"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    <span className="text-xs font-semibold text-center leading-tight">
                      {CATEGORY_SHORT[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
      </div>

      {/* Vehicle type pills */}
      {category === "VEHICLES" && (
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold">Vehicle Type *</Label>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
            <div className="flex gap-2.5 w-max sm:w-auto sm:flex-wrap">
              {VEHICLE_TYPES.map((vt) => (
                <Controller
                  key={vt}
                  control={control}
                  name="vehicleType"
                  render={({ field }) => {
                    const active = field.value === vt;
                    return (
                      <button
                        type="button"
                        onClick={() => field.onChange(vt)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 whitespace-nowrap transition-all active:scale-95 ${
                          active
                            ? "border-[#C8541A] bg-[#FFF3EC] text-[#C8541A]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {VEHICLE_TYPE_LABELS[vt]}
                      </button>
                    );
                  }}
                />
              ))}
            </div>
          </div>
          {errors.vehicleType && <p className="text-sm text-red-500">{errors.vehicleType.message}</p>}
        </div>
      )}

      {/* Condition pills */}
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold">Condition *</Label>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
          <div className="flex gap-2.5 w-max sm:w-auto sm:flex-wrap">
            {ITEM_CONDITIONS.map((cond) => (
              <Controller
                key={cond}
                control={control}
                name="condition"
                render={({ field }) => {
                  const active = field.value === cond;
                  return (
                    <button
                      type="button"
                      onClick={() => field.onChange(cond)}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 whitespace-nowrap transition-all active:scale-95 ${
                        active
                          ? "border-[#C8541A] bg-[#FFF3EC] text-[#C8541A]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {ITEM_CONDITION_LABELS[cond]}
                    </button>
                  );
                }}
              />
            ))}
          </div>
        </div>
        {errors.condition && <p className="text-sm text-red-500">{errors.condition.message}</p>}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Title *</Label>
        <Input
          {...register("title")}
          placeholder="e.g. Herman Miller Aeron chair – Size B"
          className="text-base h-12"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Description *</Label>
          <span className={`text-xs tabular-nums ${description.length > 1800 ? "text-orange-500" : "text-gray-400"}`}>
            {description.length}/2000
          </span>
        </div>
        <Textarea
          {...register("description")}
          placeholder="Age, usage, scratches, what's included, reason for selling…"
          rows={5}
          className="text-base"
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Brand + Year */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Brand <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input {...register("brand")} placeholder="e.g. Sony, IKEA" className="text-base h-12" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Year bought <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input
            {...register("yearPurchased")}
            type="number"
            min={1950}
            max={new Date().getFullYear()}
            placeholder="e.g. 2022"
            className="text-base h-12"
          />
        </div>
      </div>

      {/* Locality + Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Pickup locality *</Label>
          <Controller
            control={control}
            name="pickupLocality"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="h-12 text-base" aria-invalid={!!errors.pickupLocality}>
                  <SelectValue placeholder="Select locality" />
                </SelectTrigger>
                <SelectContent>
                  {HIRANANDANI_LOCALITIES.map((loc) => (
                    <SelectItem key={loc} value={loc} className="text-base">{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.pickupLocality && <p className="text-sm text-red-500">{errors.pickupLocality.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Tower / landmark <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input {...register("pickupArea")} placeholder="e.g. Tower B, 3rd floor" className="text-base h-12" />
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Asking Price *</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-base select-none">₹</span>
          <Input
            {...register("price")}
            type="number"
            min={1}
            className="pl-8 text-base h-12"
            placeholder="e.g. 25000"
            aria-invalid={!!errors.price}
          />
        </div>
        {priceNum > 0 && (
          <p className="text-sm text-gray-500">
            Shows as{" "}
            <span className="font-semibold text-[#0B0B0C]">{formatPrice(priceNum)}</span>
          </p>
        )}
        {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
      </div>

      {/* Negotiable toggle */}
      <Controller
        control={control}
        name="priceNegotiable"
        render={({ field }) => (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-4 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-[#0B0B0C]">Open to negotiation</p>
              <p className="text-sm text-gray-400 mt-0.5">Buyers can make offers</p>
            </div>
            <button
              type="button"
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                field.value ? "bg-[#C8541A]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  field.value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}
      />

      {/* Phone visibility toggle */}
      <Controller
        control={control}
        name="phonePublic"
        render={({ field }) => (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-4 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-[#0B0B0C]">Show my phone number</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {field.value !== false ? "Buyers can call you directly" : "Buyers send a message instead"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => field.onChange(field.value === false ? true : false)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                field.value !== false ? "bg-[#C8541A]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  field.value !== false ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}
      />

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-[#C8541A] hover:bg-[#B34A16] active:scale-[0.97] text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-all"
        >
          Next: Photos <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

/* ── Step 2: Photos ──────────────────────────────────────────────────────────── */

function PhotosStep({
  images,
  onImagesChange,
  onNext,
  onBack,
}: {
  images: UploadedImage[];
  onImagesChange: (imgs: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const MAX = 2 * 1024 * 1024;
      const oversized = acceptedFiles.filter((f) => f.size > MAX);
      oversized.forEach((f) => toast.error(`"${f.name}" exceeds 2 MB.`));
      const valid = acceptedFiles.filter((f) => f.size <= MAX);
      if (!valid.length) return;

      const newImgs: UploadedImage[] = valid.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        url: "", s3Key: "", isPrimary: false, uploading: true,
      }));
      if (!images.some((i) => i.isPrimary)) newImgs[0].isPrimary = true;
      onImagesChange([...images, ...newImgs]);

      const results = await Promise.all(
        newImgs.map(async (img, idx) => {
          try {
            const res = await fetch(
              `/api/upload?filename=${encodeURIComponent(img.file!.name)}&contentType=${encodeURIComponent(img.file!.type)}&fileSize=${img.file!.size}`
            );
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? "Upload URL failed"); }
            const { presignedUrl, s3Key, publicUrl } = await res.json();
            const put = await fetch(presignedUrl, { method: "PUT", body: img.file, headers: { "Content-Type": img.file!.type } });
            if (!put.ok) { const b = await put.text().catch(() => ""); throw new Error(b.match(/<Message>(.*?)<\/Message>/)?.[1] ?? `S3 error ${put.status}`); }
            return { idx, url: publicUrl, s3Key, error: undefined };
          } catch (e) {
            return { idx, url: "", s3Key: "", error: e instanceof Error ? e.message : "Upload failed" };
          }
        })
      );

      onImagesChange((prev) => {
        const updated = [...prev];
        const start = prev.length - newImgs.length;
        results.forEach(({ idx, url, s3Key, error }) => {
          const i = start + idx;
          if (i < updated.length) updated[i] = { ...updated[i], uploading: false, url, s3Key, error };
        });
        return updated;
      });
    },
    [images, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/heic": [] },
    maxFiles: 6,
  });

  const remove = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (images[idx].isPrimary && updated.length > 0) updated[0] = { ...updated[0], isPrimary: true };
    onImagesChange(updated);
  };

  const setPrimary = (idx: number) =>
    onImagesChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })));

  const hasUploading = images.some((i) => i.uploading);
  const hasError     = images.some((i) => i.error);

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-[#C8541A] bg-[#FFF3EC]"
            : "border-gray-200 bg-[#FAFAF9] hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
          isDragActive ? "bg-[#FFF3EC]" : "bg-gray-100"
        }`}>
          <Upload className={`h-6 w-6 ${isDragActive ? "text-[#C8541A]" : "text-gray-400"}`} />
        </div>
        <p className="text-base font-semibold text-gray-700">
          {isDragActive ? "Drop your photos here" : "Drag photos here, or tap to browse"}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          JPG, PNG, WEBP · max 2 MB each · 1–6 photos
        </p>
        {images.length > 0 && (
          <span className="absolute top-3 right-4 text-xs font-bold text-gray-400">
            {images.length}/6
          </span>
        )}
      </div>

      {/* Photo grid */}
      {images.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-3">Tap a photo to set it as the cover</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => !img.uploading && !img.error && setPrimary(idx)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  img.isPrimary ? "border-[#C8541A]" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt="" className="w-full aspect-square object-cover" />

                {img.uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#C8541A]" />
                  </div>
                )}
                {img.error && (
                  <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center p-2">
                    <p className="text-xs text-red-600 text-center leading-snug">{img.error}</p>
                  </div>
                )}

                {img.isPrimary && (
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-[#C8541A] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    Cover
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(idx); }}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-6 py-3.5 rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (hasUploading) return toast.error("Wait for uploads to finish.");
            if (hasError) return toast.error("Remove failed photos and try again.");
            if (!images.length) return toast.error("Add at least 1 photo.");
            if (images.length > 6) return toast.error("Maximum 6 photos allowed.");
            onNext();
          }}
          disabled={hasUploading || hasError || !images.length}
          className="inline-flex items-center gap-2 bg-[#C8541A] hover:bg-[#B34A16] disabled:opacity-40 active:scale-[0.97] text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-all"
        >
          Next: Review <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Review ──────────────────────────────────────────────────────────── */

function ReviewStep({
  details,
  images,
  onBack,
  onSubmit,
  submitting,
  submitLabel,
}: {
  details: DetailsData;
  images: UploadedImage[];
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const cover = images.find((i) => i.isPrimary) ?? images[0];

  return (
    <div className="space-y-6">

      {/* Listing card preview */}
      <div>
        <p className="text-sm text-gray-400 mb-3 uppercase tracking-[0.15em] font-semibold">How it looks</p>
        <div className="max-w-xs mx-auto bg-white border border-[#EDE5D8] rounded-2xl overflow-hidden shadow-sm">
          <div className="relative aspect-[4/3] bg-[#F5F0E8]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.preview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="h-10 w-10 text-gray-300" />
              </div>
            )}
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold uppercase tracking-[0.14em] text-gray-600 px-2.5 py-1 rounded-full">
              {CATEGORY_SHORT[details.category]}
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-[#0B0B0C] leading-snug line-clamp-2">{details.title}</h3>
            <span className="inline-block mt-2 text-xs font-medium uppercase tracking-[0.1em] text-gray-500 bg-[#EBEBEB] px-2.5 py-0.5 rounded-full">
              {ITEM_CONDITION_LABELS[details.condition]}
            </span>
            <div className="flex items-end justify-between mt-3 gap-2">
              <div>
                <p className="font-extrabold text-[#0B0B0C] text-xl">{formatPrice(Number(details.price))}</p>
                {details.priceNegotiable && <p className="text-xs text-gray-400 mt-0.5">Negotiable</p>}
              </div>
              <p className="text-sm text-gray-400 text-right">{details.pickupLocality}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
        <p className="text-base font-semibold text-[#0B0B0C] mb-1.5">{details.title}</p>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{details.description}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t border-gray-200">
          {[
            ["Photos",    `${images.length} added`],
            ["Category",  CATEGORY_SHORT[details.category]],
            ["Condition", ITEM_CONDITION_LABELS[details.condition]],
            ["Price",     `${formatPrice(Number(details.price))}${details.priceNegotiable ? " · Neg." : ""}`],
            ["Pickup",    details.pickupLocality],
            ...(details.brand ? [["Brand", details.brand]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm">
              <span className="text-gray-400 shrink-0 min-w-[64px]">{k}</span>
              <span className="font-medium text-gray-800 truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-6 py-3.5 rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-[#C8541A] hover:bg-[#B34A16] disabled:opacity-50 active:scale-[0.97] text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-all"
        >
          {submitting
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Posting…</>
            : submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Main ItemForm ────────────────────────────────────────────────────────────── */

export interface ItemFormDefaults {
  details?: Partial<DetailsData>;
  images?: UploadedImage[];
}

interface ItemFormProps {
  defaults?: ItemFormDefaults;
  onSubmit: (details: DetailsData, images: UploadedImage[]) => Promise<void>;
  submitLabel?: string;
  submitting: boolean;
}

export default function ItemForm({
  defaults,
  onSubmit,
  submitLabel = "Post Listing",
  submitting,
}: ItemFormProps) {
  const [step,    setStep]    = useState(0);
  const [details, setDetails] = useState<Partial<DetailsData>>(defaults?.details ?? {});
  const [images,  setImages]  = useState<UploadedImage[]>(defaults?.images ?? []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8">
      <StepBar current={step} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {step === 0 && (
            <DetailsStep
              defaultValues={details}
              onNext={(d) => { setDetails(d); setStep(1); }}
            />
          )}
          {step === 1 && (
            <PhotosStep
              images={images}
              onImagesChange={setImages}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <ReviewStep
              details={details as DetailsData}
              images={images}
              onBack={() => setStep(1)}
              onSubmit={() => onSubmit(details as DetailsData, images)}
              submitting={submitting}
              submitLabel={submitLabel}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

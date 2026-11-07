"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { isVideoUrl } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HIRANANDANI_LOCALITIES,
  AMENITIES_LIST,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  FURNISHED_LABELS,
  BHK_OPTIONS,
  LOCK_IN_OPTIONS,
} from "@/lib/constants";
import { propertyStep1Schema, propertyStep3Schema } from "@/lib/validations/property";
import { parseAmenities } from "@/lib/utils/formatters";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Star,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type Step1Data = z.infer<typeof propertyStep1Schema>;
type Step3Data = z.infer<typeof propertyStep3Schema>;

interface UploadedImage {
  file?: File;
  preview: string;
  url: string;
  s3Key: string;
  isPrimary: boolean;
  uploading: boolean;
  error?: string;
}

// Video detection works for fresh uploads (File) and server-loaded media (URL)
function isVideoMedia(m: { file?: File | null; preview: string }): boolean {
  return m.file?.type?.startsWith("video/") ?? isVideoUrl(m.preview);
}

interface WizardData {
  step1: Partial<Step1Data>;
  images: UploadedImage[];
  step3: Partial<Step3Data>;
}

const STEPS = ["Property Details", "Photos", "Pricing", "Review & Submit"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
              i < current
                ? "bg-blue-600 text-white"
                : i === current
                ? "bg-blue-600 text-white ring-2 ring-blue-200"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium hidden sm:inline ${
              i === current ? "text-blue-700" : "text-gray-400"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<Step1Data>;
  onNext: (data: Step1Data) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1Data>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertyStep1Schema) as any,
    defaultValues: { amenities: [], ...defaultValues },
  });

  const watchedAmenities = watch("amenities") ?? [];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Property Type *</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Listing Type *</Label>
          <Controller
            control={control}
            name="listingType"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.listingType}>
                  <SelectValue placeholder="Rent or Sale" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LISTING_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.listingType && <p className="text-xs text-red-500">{errors.listingType.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Locality *</Label>
          <Controller
            control={control}
            name="locality"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.locality}>
                  <SelectValue placeholder="Select locality" />
                </SelectTrigger>
                <SelectContent>
                  {HIRANANDANI_LOCALITIES.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.locality && <p className="text-xs text-red-500">{errors.locality.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Furnished Status *</Label>
          <Controller
            control={control}
            name="furnished"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.furnished}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FURNISHED_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.furnished && <p className="text-xs text-red-500">{errors.furnished.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input {...register("title")} placeholder="e.g. Spacious 2BHK in Regent Hill" aria-invalid={!!errors.title} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Description *</Label>
        <Textarea {...register("description")} placeholder="Describe the property..." rows={4} aria-invalid={!!errors.description} />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Address *</Label>
          <Input {...register("address")} placeholder="Street / Society address" aria-invalid={!!errors.address} />
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Building Name *</Label>
          <Input {...register("building")} placeholder="e.g. Regent Hill Tower A" aria-invalid={!!errors.building} />
          {errors.building && <p className="text-xs text-red-500">{errors.building.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Flat Number</Label>
          <Input {...register("flatNumber")} placeholder="e.g. 1203" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label>Bedrooms</Label>
          <Controller
            control={control}
            name="bedrooms"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="BHK" /></SelectTrigger>
                <SelectContent>
                  {BHK_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} BHK</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bathrooms</Label>
          <Input {...register("bathrooms")} type="number" min={1} max={10} placeholder="e.g. 2" />
        </div>
        <div className="space-y-1.5">
          <Label>Area (sq.ft) *</Label>
          <Input {...register("areaSqft")} type="number" placeholder="e.g. 950" aria-invalid={!!errors.areaSqft} />
          {errors.areaSqft && <p className="text-xs text-red-500">{errors.areaSqft.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Floor</Label>
          <Input {...register("floor")} type="number" min={0} placeholder="e.g. 12" />
        </div>
        <div className="space-y-1.5">
          <Label>Total Floors</Label>
          <Input {...register("totalFloors")} type="number" min={1} placeholder="e.g. 20" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES_LIST.map((amenity) => {
            const checked = watchedAmenities.includes(amenity);
            return (
              <Controller
                key={amenity}
                control={control}
                name="amenities"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600"
                      checked={checked}
                      onChange={(e) => {
                        const current = field.value ?? [];
                        if (e.target.checked) {
                          field.onChange([...current, amenity]);
                        } else {
                          field.onChange(current.filter((a) => a !== amenity));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                )}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="gap-2">
          Next: Photos <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function Step2({
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
      const maxFor = (f: File) =>
        f.type.startsWith("video/") ? 50 * 1024 * 1024 : 2 * 1024 * 1024;
      const oversized = acceptedFiles.filter((f) => f.size > maxFor(f));
      if (oversized.length > 0) {
        oversized.forEach((f) =>
          toast.error(`"${f.name}" exceeds ${f.type.startsWith("video/") ? "50" : "2"} MB and was removed.`)
        );
      }
      const validFiles = acceptedFiles.filter((f) => f.size <= maxFor(f));
      if (validFiles.length === 0) return;

      const newImages: UploadedImage[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        url: "",
        s3Key: "",
        isPrimary: false,
        uploading: true,
      }));

      if (!images.some((i) => i.isPrimary)) {
        const firstPhoto = newImages.find((mm) => !mm.file?.type.startsWith("video/"));
        if (firstPhoto) firstPhoto.isPrimary = true;
      }

      onImagesChange([...images, ...newImages]);

      const uploadPromises = newImages.map(async (img, idx) => {
        try {
          const res = await fetch(
            `/api/upload?filename=${encodeURIComponent(img.file!.name)}&contentType=${encodeURIComponent(img.file!.type)}&fileSize=${img.file!.size}`
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? "Failed to get upload URL");
          }
          const { presignedUrl, s3Key, publicUrl } = await res.json();
          await fetch(presignedUrl, {
            method: "PUT",
            body: img.file,
            headers: { "Content-Type": img.file!.type },
          });
          return { idx, url: publicUrl, s3Key, error: undefined };
        } catch (err) {
          return { idx, url: "", s3Key: "", error: err instanceof Error ? err.message : "Upload failed" };
        }
      });

      const results = await Promise.all(uploadPromises);

      onImagesChange((prev: UploadedImage[]) => {
        const updated = [...prev];
        const startIdx = prev.length - newImages.length;
        results.forEach(({ idx, url, s3Key, error }) => {
          const i = startIdx + idx;
          if (i < updated.length) {
            updated[i] = { ...updated[i], uploading: false, url, s3Key, error };
          }
        });
        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/heic": [], "video/mp4": [], "video/webm": [], "video/quicktime": [] },
    maxFiles: 10,
  });

  const removeImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (images[idx].isPrimary && updated.length > 0) {
      updated[0] = { ...updated[0], isPrimary: true };
    }
    onImagesChange(updated);
  };

  const setPrimary = (idx: number) => {
    onImagesChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })));
  };

  const hasUploading = images.some((i) => i.uploading);
  const hasError = images.some((i) => i.error);
  const canProceed = images.length >= 1 && !hasUploading && !hasError;

  const handleNext = () => {
    if (images.length === 0) { toast.error("Please upload at least one photo."); return; }
    if (hasUploading) { toast.error("Please wait for all photos to finish uploading."); return; }
    if (hasError) { toast.error("Some photos failed to upload. Please remove them and try again."); return; }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "Drop photos or videos here" : "Drag & drop photos or videos here"}
        </p>
        <p className="text-xs text-gray-500 mt-1">or click to browse · images up to 2 MB · MP4/WebM/MOV videos up to 50 MB · 10 files max</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                img.isPrimary ? "border-blue-500" : "border-gray-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {isVideoMedia(img) ? (
                <video src={img.preview} className="w-full h-32 object-cover" muted playsInline controls preload="metadata" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={img.preview} alt={`Photo ${idx + 1}`} className="w-full h-32 object-cover" />
              )}
              {img.uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center p-2">
                  <p className="text-xs text-red-600 text-center">{img.error}</p>
                </div>
              )}
              {!img.uploading && !img.error && (
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {!isVideoMedia(img) && (
                  <button type="button" onClick={() => setPrimary(idx)} title="Set as primary"
                    className={`p-1 rounded-full transition-colors ${img.isPrimary ? "bg-blue-500 text-white" : "bg-white/80 text-gray-600 hover:bg-yellow-400 hover:text-white"}`}>
                    <Star className="h-3 w-3" />
                  </button>
                )}
                  <button type="button" onClick={() => removeImage(idx)}
                    className="p-1 rounded-full bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {img.isPrimary && !img.uploading && !img.error && (
                <div className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Primary</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="gap-2">
          Next: Pricing <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Step3({
  defaultValues,
  listingType,
  onNext,
  onBack,
}: {
  defaultValues: Partial<Step3Data>;
  listingType: string;
  onNext: (data: Step3Data) => void;
  onBack: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step3Data>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertyStep3Schema) as any,
    defaultValues: { rentNegotiable: false, lockInNegotiable: false, ...defaultValues },
  });

  const isRent = listingType === "RENT";
  const lockInMonths = watch("lockInMonths");
  const hasLockIn = lockInMonths !== undefined && Number(lockInMonths) > 0;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{isRent ? "Expected Monthly Rent (₹) *" : "Sale Price (₹) *"}</Label>
          <Input {...register("price")} type="number" min={1000} placeholder={isRent ? "e.g. 40000" : "e.g. 12500000"} aria-invalid={!!errors.price} />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
        </div>
        {isRent && (
          <div className="space-y-1.5">
            <Label>Security Deposit (₹)</Label>
            <Input {...register("deposit")} type="number" min={0} placeholder="e.g. 120000" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="rentNegotiable"
          render={({ field }) => (
            <input
              type="checkbox"
              id="rentNegotiable"
              className="rounded border-gray-300 text-blue-600"
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <Label htmlFor="rentNegotiable" className="cursor-pointer font-normal">
          {isRent ? "Rent is negotiable" : "Price is negotiable"}
        </Label>
      </div>

      {/* Available From (optional) */}
      <div className="space-y-1.5">
        <Label>
          Available From <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <Controller
          control={control}
          name="availableFrom"
          render={({ field }) => {
            const value = field.value ?? "";
            const mode = value === "" ? "NONE" : value === "IMMEDIATE" ? "IMMEDIATE" : "DATE";
            return (
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={mode}
                  onValueChange={(m) =>
                    field.onChange(
                      m === "NONE" ? "" : m === "IMMEDIATE" ? "IMMEDIATE" : new Date().toISOString().slice(0, 10)
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not specified</SelectItem>
                    <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                    <SelectItem value="DATE">From a specific date</SelectItem>
                  </SelectContent>
                </Select>
                {mode === "DATE" && (
                  <Input
                    type="date"
                    className="w-full sm:w-48"
                    value={value}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              </div>
            );
          }}
        />
      </div>

      {isRent && (
        <>
          <div className="space-y-1.5">
            <Label>Minimum Lock-in Period</Label>
            <Controller
              control={control}
              name="lockInMonths"
              render={({ field }) => (
                <Select
                  value={field.value !== undefined ? String(field.value) : "0"}
                  onValueChange={(v) => field.onChange(v ? parseInt(v) : 0)}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select lock-in period" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCK_IN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {hasLockIn && (
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="lockInNegotiable"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="lockInNegotiable"
                    className="rounded border-gray-300 text-blue-600"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Label htmlFor="lockInNegotiable" className="cursor-pointer font-normal">Lock-in is negotiable</Label>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button type="submit" className="gap-2">
          Next: Review <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function Step4({
  step1, images, step3, onBack, onSubmit, submitting,
}: {
  step1: Partial<Step1Data>;
  images: UploadedImage[];
  step3: Partial<Step3Data>;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const lockInLabel = LOCK_IN_OPTIONS.find((o) => o.value === step3.lockInMonths)?.label;

  const rows: [string, string | number | undefined][] = [
    ["Type", PROPERTY_TYPE_LABELS[step1.type ?? ""] ?? step1.type],
    ["Listing", LISTING_TYPE_LABELS[step1.listingType ?? ""] ?? step1.listingType],
    ["Locality", step1.locality],
    ["Building", step1.building],
    ["Flat No.", step1.flatNumber ?? "-"],
    ["Address", step1.address],
    ["Bedrooms", step1.bedrooms ? `${step1.bedrooms} BHK` : "-"],
    ["Bathrooms", step1.bathrooms ?? "-"],
    ["Area", step1.areaSqft ? `${step1.areaSqft} sq.ft` : "-"],
    ["Floor", step1.floor !== undefined ? step1.floor : "-"],
    ["Total Floors", step1.totalFloors ?? "-"],
    ["Furnished", FURNISHED_LABELS[step1.furnished ?? ""] ?? step1.furnished],
    ["Price", step3.price
      ? `₹${Number(step3.price).toLocaleString("en-IN")}${step3.rentNegotiable ? " (Negotiable)" : ""}`
      : "-"],
    ...(step1.listingType === "RENT"
      ? [["Deposit", step3.deposit ? `₹${Number(step3.deposit).toLocaleString("en-IN")}` : "-"] as [string, string]]
      : []),
    ...(step1.listingType === "RENT" && lockInLabel
      ? [["Lock-in", `${lockInLabel}${step3.lockInNegotiable ? " (Negotiable)" : ""}`] as [string, string]]
      : []),
    ["Available From",
      step3.availableFrom === "IMMEDIATE"
        ? "Immediate"
        : step3.availableFrom
        ? new Date(`${step3.availableFrom}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "Not specified"],
  ];

  return (
    <div className="space-y-6">
      {/* Review notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Saving changes will re-submit your listing for admin review. It will be temporarily unavailable until approved.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">{step1.title}</h3>
        <p className="text-sm text-gray-600">{step1.description}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-2 text-sm">
              <span className="text-gray-500 min-w-[90px] shrink-0">{label}:</span>
              <span className="font-medium text-gray-900">{String(value ?? "-")}</span>
            </div>
          ))}
        </div>
        {(step1.amenities?.length ?? 0) > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-1.5">Amenities:</p>
            <div className="flex flex-wrap gap-1.5">
              {step1.amenities?.map((a) => (
                <span key={a} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Photos ({images.length})</p>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {isVideoMedia(img) ? (
                <video src={img.preview} className="h-16 w-20 object-cover rounded-lg border border-gray-200" muted playsInline preload="metadata" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={img.preview} alt={`Photo ${i + 1}`} className="h-16 w-20 object-cover rounded-lg border border-gray-200" />
              )}
              {img.isPrimary && (
                <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-blue-500 text-white px-1 rounded">Primary</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={submitting} className="gap-2">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

export default function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: propertyId } = params;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<WizardData>({
    step1: {},
    images: [],
    step3: {},
  });

  // Load existing property data
  useEffect(() => {
    async function loadProperty() {
      try {
        const res = await fetch(`/api/dashboard/properties/${propertyId}`);
        if (!res.ok) {
          toast.error("Failed to load property");
          router.push("/dashboard");
          return;
        }
        const { property } = await res.json();

        const step1: Partial<Step1Data> = {
          title: property.title,
          description: property.description,
          type: property.type,
          listingType: property.listingType,
          address: property.address,
          building: property.building,
          flatNumber: property.flatNumber ?? undefined,
          locality: property.locality,
          bedrooms: property.bedrooms ?? undefined,
          bathrooms: property.bathrooms ?? undefined,
          areaSqft: property.areaSqft,
          floor: property.floor ?? undefined,
          totalFloors: property.totalFloors ?? undefined,
          furnished: property.furnished,
          amenities: parseAmenities(property.amenities),
        };

        const step3: Partial<Step3Data> = {
          price: property.price,
          deposit: property.deposit ?? undefined,
          rentNegotiable: property.rentNegotiable ?? false,
          lockInMonths: property.lockInMonths ?? 0,
          lockInNegotiable: property.lockInNegotiable ?? false,
          availableFrom: property.availableFrom ?? "",
        };

        const images: UploadedImage[] = (property.images ?? []).map(
          (img: { url: string; s3Key: string; isPrimary: boolean }) => ({
            preview: img.url,
            url: img.url,
            s3Key: img.s3Key,
            isPrimary: img.isPrimary,
            uploading: false,
          })
        );

        setData({ step1, images, step3 });
      } catch {
        toast.error("Failed to load property");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId, router]);

  const handleStep1Next = (step1Data: Step1Data) => {
    setData((d) => ({ ...d, step1: step1Data }));
    setStep(1);
  };

  const handleImagesChange = (imgs: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => {
    setData((d) => ({
      ...d,
      images: typeof imgs === "function" ? imgs(d.images) : imgs,
    }));
  };

  const handleStep3Next = (step3Data: Step3Data) => {
    setData((d) => ({ ...d, step3: step3Data }));
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { lockInMonths, ...restStep3 } = data.step3;
      const body = {
        ...data.step1,
        ...restStep3,
        lockInMonths: lockInMonths && lockInMonths > 0 ? lockInMonths : null,
        amenities: data.step1.amenities ?? [],
        images: data.images.map((img) => ({
          url: img.url,
          s3Key: img.s3Key,
          isPrimary: img.isPrimary,
        })),
      };

      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }

      toast.success("Changes saved! Your listing is pending review.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your property details on Sanatani Community
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <StepIndicator current={step} />

        {step === 0 && <Step1 defaultValues={data.step1} onNext={handleStep1Next} />}
        {step === 1 && (
          <Step2
            images={data.images}
            onImagesChange={handleImagesChange}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step3
            defaultValues={data.step3}
            listingType={data.step1.listingType ?? "SALE"}
            onNext={handleStep3Next}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step4
            step1={data.step1}
            images={data.images}
            step3={data.step3}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

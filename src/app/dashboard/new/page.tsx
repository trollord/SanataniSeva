"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { isVideoUrl } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { WhatsAppShareModal } from "@/components/property/WhatsAppShare";
import NewListingTour from "@/components/tour/NewListingTour";
import type { ShareableProperty } from "@/lib/utils/whatsapp";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Star,
  CheckCircle2,
  Loader2,
  ImageOff,
  Camera,
} from "lucide-react";
import MapPicker from "@/components/map/MapPicker";
import LocationInput from "@/components/map/LocationInput";

// ─── types ───────────────────────────────────────────────────────────────────

type Step1Data = z.infer<typeof propertyStep1Schema>;
type Step3Data = z.infer<typeof propertyStep3Schema>;

interface UploadedImage {
  file: File;
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

// ─── step indicator (used in steps 2-4) ──────────────────────────────────────

const STEPS = ["Property Details", "Photos", "Pricing", "Review & Submit"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${i < current
              ? "bg-[#FF5F15] text-white"
              : i === current
                ? "bg-[#FF5F15] text-white ring-2 ring-[#FF5F15]/30"
                : "bg-gray-100 text-gray-400"
              }`}
          >
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium hidden sm:inline ${i === current ? "text-gray-900" : "text-gray-400"
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

// ─── Step 1: Property Details ─────────────────────────────────────────────────

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
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertyStep1Schema) as any,
    defaultValues: {
      amenities: [],
      ...defaultValues,
    },
  });

  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const watchedAmenities = watch("amenities") ?? [];
  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");

  const visibleAmenities = showAllAmenities
    ? AMENITIES_LIST
    : AMENITIES_LIST.slice(0, 6);

  const inputCls =
    "w-full bg-[#f2f4f4] border-none rounded-lg px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF5F15] transition-all";
  const selectCls =
    "w-full bg-[#f2f4f4] border-none rounded-lg px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#FF5F15] transition-all appearance-none cursor-pointer";
  const sectionHeadCls =
    "text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8";

  return (
    <form id="step1-form" onSubmit={handleSubmit(onNext)}>
      <div className="grid grid-cols-12 gap-8 pb-28">

        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-7 space-y-8">

          {/* Basic Information */}
          <section data-tour="np-basic" className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className={sectionHeadCls}>Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Property Type */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Property Type</label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <select
                      className={selectCls}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="" disabled>Select type</option>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
              </div>

              {/* Listing Type */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Listing Type</label>
                <Controller
                  control={control}
                  name="listingType"
                  render={({ field }) => (
                    <select
                      className={selectCls}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="" disabled>Rent or Sale</option>
                      {Object.entries(LISTING_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.listingType && <p className="text-xs text-red-500">{errors.listingType.message}</p>}
              </div>

              {/* Property Title */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Property Title</label>
                <input
                  {...register("title")}
                  className={inputCls}
                  placeholder="e.g. Luxurious 3BHK overlooking Central Park"
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Description</label>
                <textarea
                  {...register("description")}
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder="Describe the property, neighborhood, and unique features..."
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

            </div>
          </section>

          {/* Location Details */}
          <section className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className={sectionHeadCls.replace("mb-8", "")}>Location Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Building Name */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Building Name</label>
                <input
                  {...register("building")}
                  className={inputCls}
                  placeholder="e.g. Regent Hill"
                />
                {errors.building && <p className="text-xs text-red-500">{errors.building.message}</p>}
              </div>

              {/* Locality */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Locality</label>
                <Controller
                  control={control}
                  name="locality"
                  render={({ field }) => (
                    <select
                      className={selectCls}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="" disabled>Select locality</option>
                      {HIRANANDANI_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.locality && <p className="text-xs text-red-500">{errors.locality.message}</p>}
              </div>

              {/* Detailed Address */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Detailed Address</label>
                <input
                  {...register("address")}
                  className={inputCls}
                  placeholder="Street name, landmark, etc."
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>

              {/* Flat Number */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Flat / House Number</label>
                <input
                  {...register("flatNumber")}
                  className={inputCls}
                  placeholder="e.g. 1204, Wing A"
                />
              </div>


            </div>

            {/* Address search autocomplete */}
            <div className="mt-6">
              <label className="text-[12px] font-semibold text-gray-800 block mb-2">Search Address</label>
              <LocationInput
                onSelect={(place) => {
                  setValue("latitude", place.lat);
                  setValue("longitude", place.lng);
                }}
              />
            </div>

            {/* Map */}
            <div className="mt-4">
              <MapPicker
                value={watchedLat && watchedLng ? { lat: watchedLat, lng: watchedLng } : null}
                onChange={(lat: number, lng: number) => {
                  setValue("latitude", lat);
                  setValue("longitude", lng);
                }}
              />
              {(errors.latitude || errors.longitude) && (
                <p className="text-xs text-red-500 mt-1.5">Pin the property location on the map</p>
              )}
            </div>
          </section>

        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-5 space-y-8">

          {/* Configurations */}
          <section data-tour="np-config" className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className={sectionHeadCls}>Configurations</h3>
            <div className="space-y-6">

              {/* Bedrooms */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bedrooms</label>
                <Controller
                  control={control}
                  name="bedrooms"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex bg-[#f2f4f4] rounded-lg p-1 gap-1">
                        {BHK_OPTIONS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => field.onChange(n)}
                            className={`flex-1 py-2 text-[12px] font-bold rounded-md transition-all ${(n < 5 && field.value === n) || (n === 5 && Number(field.value) >= 5)
                              ? "bg-white shadow-sm text-gray-900"
                              : "text-gray-400 hover:text-gray-600"
                              }`}
                          >
                            {n === 5 ? "5+" : n}
                          </button>
                        ))}
                      </div>
                      {Number(field.value) >= 5 && (
                        <input
                          type="number"
                          min={5}
                          max={20}
                          autoFocus
                          value={field.value ?? 5}
                          onChange={(e) => field.onChange(Math.max(5, parseInt(e.target.value) || 5))}
                          className={inputCls}
                          placeholder="Enter exact number of bedrooms"
                        />
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Bathrooms */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bathrooms</label>
                <Controller
                  control={control}
                  name="bathrooms"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex bg-[#f2f4f4] rounded-lg p-1 gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => field.onChange(n)}
                            className={`flex-1 py-2 text-[12px] font-bold rounded-md transition-all ${(n < 5 && Number(field.value) === n) || (n === 5 && Number(field.value) >= 5)
                              ? "bg-white shadow-sm text-gray-900"
                              : "text-gray-400 hover:text-gray-600"
                              }`}
                          >
                            {n === 5 ? "5+" : n}
                          </button>
                        ))}
                      </div>
                      {Number(field.value) >= 5 && (
                        <input
                          type="number"
                          min={5}
                          max={20}
                          autoFocus
                          value={field.value ?? 5}
                          onChange={(e) => field.onChange(Math.max(5, parseInt(e.target.value) || 5))}
                          className={inputCls}
                          placeholder="Enter exact number of bathrooms"
                        />
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Total Area */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Total Area (Sq.ft)</label>
                <input
                  {...register("areaSqft")}
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 1850"
                />
                {errors.areaSqft && <p className="text-xs text-red-500">{errors.areaSqft.message}</p>}
              </div>

              {/* Floor + Total Floors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-gray-800">Floor</label>
                  <input
                    {...register("floor")}
                    type="number"
                    className={inputCls}
                    placeholder="e.g. 12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-gray-800">Total Floors</label>
                  <input
                    {...register("totalFloors")}
                    type="number"
                    className={inputCls}
                    placeholder="e.g. 24"
                  />
                </div>
              </div>

              {/* Furnished Status */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-800">Furnished Status</label>
                <Controller
                  control={control}
                  name="furnished"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(FURNISHED_LABELS).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => field.onChange(val)}
                          className={`py-3 px-1 text-[10px] font-bold uppercase tracking-tight rounded-lg transition-all ${field.value === val
                            ? "bg-[#FF5F15] text-white"
                            : "border border-gray-200 text-gray-500 hover:border-gray-400"
                            }`}
                        >
                          {label.replace(" Furnished", "").replace("Unfurnished", "Unfurnished")}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.furnished && <p className="text-xs text-red-500">{errors.furnished.message}</p>}
              </div>

            </div>
          </section>

          {/* Amenities */}
          <section data-tour="np-amenities" className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className={sectionHeadCls}>Amenities</h3>
            <div className="grid grid-cols-2 gap-1">
              {visibleAmenities.map((amenity) => {
                const checked = watchedAmenities.includes(amenity);
                return (
                  <Controller
                    key={amenity}
                    control={control}
                    name="amenities"
                    render={({ field }) => (
                      <label className="cursor-pointer flex items-center gap-3 p-3 rounded-xl hover:bg-[#f2f4f4] transition-colors">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-gray-900 focus:ring-0"
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
                        <span className="text-[11px] font-medium text-gray-700">{amenity}</span>
                      </label>
                    )}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              className="w-full mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
            >
              {showAllAmenities
                ? "− Show Less"
                : `+ View All ${AMENITIES_LIST.length} Amenities`}
            </button>
          </section>

        </div>
      </div>
    </form>
  );
}

// ─── Step 2: Photos ───────────────────────────────────────────────────────────

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
          toast.error(
            `"${f.name}" exceeds ${f.type.startsWith("video/") ? "50" : "2"} MB and was removed.`
          )
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

      // Mark the first *photo* as primary if nothing is primary yet
      // (videos can't be primary - listing cards need a still thumbnail)
      if (!images.some((i) => i.isPrimary)) {
        const firstPhoto = newImages.find((m) => !m.file?.type.startsWith("video/"));
        if (firstPhoto) firstPhoto.isPrimary = true;
      }

      onImagesChange([...images, ...newImages]);

      // Upload each file
      const uploadPromises = newImages.map(async (img, idx) => {
        try {
          const res = await fetch(
            `/api/upload?filename=${encodeURIComponent(img.file.name)}&contentType=${encodeURIComponent(img.file.type)}&fileSize=${img.file.size}`
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? "Failed to get upload URL");
          }
          const { presignedUrl, s3Key, publicUrl } = await res.json();

          await fetch(presignedUrl, {
            method: "PUT",
            body: img.file,
            headers: { "Content-Type": img.file.type },
          });

          return { idx, url: publicUrl, s3Key, error: undefined };
        } catch (err) {
          return {
            idx,
            url: "",
            s3Key: "",
            error: err instanceof Error ? err.message : "Upload failed",
          };
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
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
      "video/mp4": [],
      "video/webm": [],
      "video/quicktime": [],
    },
    maxFiles: 10,
  });

  const removeImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    // Re-assign primary if needed
    if (images[idx].isPrimary && updated.length > 0) {
      updated[0] = { ...updated[0], isPrimary: true };
    }
    onImagesChange(updated);
  };

  const setPrimary = (idx: number) => {
    onImagesChange(
      images.map((img, i) => ({ ...img, isPrimary: i === idx }))
    );
  };

  const hasUploading = images.some((i) => i.uploading);
  const hasError = images.some((i) => i.error);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const handleNext = () => {
    if (hasUploading) {
      toast.error("Please wait for all photos to finish uploading.");
      return;
    }
    if (hasError) {
      toast.error("Some photos failed to upload. Please remove them and try again.");
      return;
    }
    if (images.length === 0) {
      setShowSkipDialog(true);
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Tip banner */}
      <div className="flex items-start gap-3 bg-[#FF5F15]/10 border border-[#FF5F15]/30 rounded-xl px-4 py-3">
        <Camera className="h-4 w-4 text-[#FF5F15] mt-0.5 shrink-0" />
        <p className="text-sm text-[#555555] leading-relaxed">
          <span className="font-semibold">Photos are optional</span> - but listings with photos get significantly more attention. Adding clear photos helps serious buyers and tenants find you faster.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive
          ? "border-[#FF5F15] bg-[#FF5F15]/5"
          : "border-gray-200 hover:border-gray-300 bg-gray-50"
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? "Drop photos or videos here" : "Drag & drop photos or videos here"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          or click to browse · images up to 2 MB · MP4/WebM/MOV videos up to 50 MB · 10 files max
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden border-2 transition-colors ${img.isPrimary ? "border-gray-900" : "border-gray-200"
                }`}
            >
              {isVideoMedia(img) ? (
                <video
                  src={img.preview}
                  className="w-full h-32 object-cover"
                  muted
                  playsInline
                  controls
                  preload="metadata"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={img.preview}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-32 object-cover"
                />
              )}

              {/* Uploading overlay */}
              {img.uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-900" />
                </div>
              )}

              {/* Error overlay */}
              {img.error && (
                <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center p-2">
                  <p className="text-xs text-red-600 text-center">{img.error}</p>
                </div>
              )}

              {/* Actions */}
              {!img.uploading && !img.error && (
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {!isVideoMedia(img) && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      title="Set as primary"
                      className={`p-1 rounded-full transition-colors ${img.isPrimary
                        ? "bg-[#FF5F15] text-white"
                        : "bg-white/80 text-gray-600 hover:bg-yellow-400 hover:text-white"
                        }`}
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1 rounded-full bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Primary label */}
              {img.isPrimary && !img.uploading && !img.error && (
                <div className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-[#FF5F15] text-white px-1.5 py-0.5 rounded-full">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={hasUploading || hasError}
          className="gap-2 bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white"
        >
          Next: Pricing <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Skip-without-photos confirmation dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="inline-flex p-3 rounded-full bg-amber-50">
                <ImageOff className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-gray-900">
              No photos added
            </DialogTitle>
            <DialogDescription className="text-center leading-relaxed">
              Listings with photos receive <span className="font-semibold text-gray-900">significantly more interest</span> from serious buyers and tenants. Adding even one photo makes your listing stand out.
              <br /><br />
              You can still list without photos and add them later from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 border-0 bg-transparent p-0 mt-2">
            <Button
              className="w-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2"
              onClick={() => setShowSkipDialog(false)}
            >
              <Camera className="h-4 w-4" /> Add Photos
            </Button>
            <Button
              variant="outline"
              className="w-full text-gray-500"
              onClick={() => { setShowSkipDialog(false); onNext(); }}
            >
              Skip for now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Step 3: Pricing ──────────────────────────────────────────────────────────

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
    defaultValues: {
      rentNegotiable: false,
      lockInNegotiable: false,
      ...defaultValues,
    },
  });

  const isRent = listingType === "RENT";
  const lockInMonths = watch("lockInMonths");
  const hasLockIn = lockInMonths !== undefined && Number(lockInMonths) > 0;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{isRent ? "Expected Monthly Rent (₹) *" : "Sale Price (₹) *"}</Label>
          <Input
            {...register("price")}
            type="number"
            min={1000}
            placeholder={isRent ? "e.g. 40000" : "e.g. 12500000"}
            aria-invalid={!!errors.price}
          />
          {errors.price && (
            <p className="text-xs text-red-500">{errors.price.message}</p>
          )}
        </div>

        {isRent && (
          <div className="space-y-1.5">
            <Label>Security Deposit (₹)</Label>
            <Input
              {...register("deposit")}
              type="number"
              min={0}
              placeholder="e.g. 120000"
            />
          </div>
        )}
      </div>

      {/* Negotiable toggle */}
      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="rentNegotiable"
          render={({ field }) => (
            <input
              type="checkbox"
              id="rentNegotiable"
              className="rounded border-gray-300 text-gray-900"
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

      {/* Lock-in (rent only) */}
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
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
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
                    className="rounded border-gray-300 text-gray-900"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <Label htmlFor="lockInNegotiable" className="cursor-pointer font-normal">
                Lock-in is negotiable
              </Label>
            </div>
          )}
        </>
      )}

      {/* Phone visibility toggle */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-1">
        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="phonePublic"
            render={({ field }) => (
              <input
                type="checkbox"
                id="phonePublic"
                className="rounded border-gray-300 text-gray-900"
                checked={field.value !== false}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Label htmlFor="phonePublic" className="cursor-pointer font-medium">
            Show my phone number publicly
          </Label>
        </div>
        <p className="text-xs text-gray-400 pl-7">
          If unchecked, interested buyers send you a message instead — your number stays private.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button type="submit" className="gap-2 bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white">
          Next: Review <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4({
  step1,
  images,
  step3,
  onBack,
  onSubmit,
  submitting,
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
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">{step1.title}</h3>
        <p className="text-sm text-gray-600">{step1.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
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
                <span
                  key={a}
                  className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photos preview */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Photos ({images.length})
        </p>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {isVideoMedia(img) ? (
                <video
                  src={img.preview}
                  className="h-16 w-20 object-cover rounded-lg border border-gray-200"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={img.preview}
                  alt={`Photo ${i + 1}`}
                  className="h-16 w-20 object-cover rounded-lg border border-gray-200"
                />
              )}
              {img.isPrimary && (
                <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-[#FF5F15] text-white px-1 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="gap-2 bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit for Review"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function NewListingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WizardData>({
    step1: {},
    images: [],
    step3: {},
  });
  const [shareProperty, setShareProperty] = useState<ShareableProperty | null>(null);

  // Guard: only OWNER, MANAGER, ADMIN may list properties
  if (session && !["OWNER", "ADMIN"].includes(session.user?.role ?? "")) {
    router.replace("/become-owner");
    return null;
  }

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
      const body = {
        ...data.step1,
        ...data.step3,
        images: data.images.map((img) => ({
          url: img.url,
          s3Key: img.s3Key,
          isPrimary: img.isPrimary,
        })),
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }

      const { property } = await res.json();

      if (data.images.length > 0) {
        await Promise.allSettled(
          data.images.map((img) =>
            fetch(`/api/properties/${property.id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: img.url,
                s3Key: img.s3Key,
                isPrimary: img.isPrimary,
              }),
            })
          )
        );
      }

      toast.success("Listing submitted for review!");

      // Offer a ready-made WhatsApp message before leaving the page
      const s1 = data.step1 as Step1Data;
      const s3 = data.step3 as Step3Data;
      setShareProperty({
        id: property.id,
        title: s1.title,
        type: s1.type,
        listingType: s1.listingType,
        building: s1.building,
        locality: s1.locality,
        bedrooms: s1.bedrooms,
        bathrooms: s1.bathrooms,
        areaSqft: s1.areaSqft,
        furnished: s1.furnished,
        price: s3.price,
        deposit: s3.deposit,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">

      {/* ── First-visit walkthrough (targets live on step 1) ── */}
      {step === 0 && <NewListingTour />}

      {/* ── Post-submit share popup ── */}
      {shareProperty && (
        <WhatsAppShareModal
          open
          onClose={() => router.push("/dashboard")}
          property={shareProperty}
          subtitle="Listing Submitted"
          title="Share your property"
          description="Want to copy a ready-made WhatsApp message for your listing? The link goes live as soon as your property is approved."
        />
      )}

      {/* ── Step 1: full two-column layout ── */}
      {step === 0 && (
        <Step1 defaultValues={data.step1} onNext={handleStep1Next} />
      )}

      {/* ── Steps 2-4: card layout ── */}
      {step !== 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-8">
          <StepIndicator current={step} />
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
      )}

      {/* ── Fixed footer (Step 1 only) ── */}
      {step === 0 && (
        <footer data-tour="np-footer" className="fixed bottom-0 left-0 md:left-64 right-0 bg-[#f5f5f5]/90 backdrop-blur-xl border-t border-black/5 px-4 sm:px-12 py-4 sm:py-5 flex justify-between items-center gap-3 z-50">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-8 bg-[#FF5F15]" : "w-8 bg-gray-200"
                    }`}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Step 1 of 4
            </span>
          </div>
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-[12px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
            >
              Cancel Listing
            </button>
            <button
              form="step1-form"
              type="submit"
              className="bg-[#FF5F15] text-white px-10 py-4 rounded-xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              Next: Photos
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      )}

    </div>
  );
}

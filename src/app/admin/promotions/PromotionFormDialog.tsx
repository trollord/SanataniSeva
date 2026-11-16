"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/Modal";
import SearchableSelect, { type SelectOption } from "@/components/ui/searchable-select";
import ImageDropzone from "@/components/ui/ImageDropzone";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";
import {
  MAX_PROMOTION_PHOTOS,
  PROMOTION_TAGLINE_MAX,
  promotionFormSchema,
  type PromotionFormValues,
} from "@/lib/promotions";

const LOCALITY_OPTIONS: SelectOption[] = [
  { value: "", label: "Not set" },
  ...HIRANANDANI_LOCALITIES.map((l) => ({ value: l, label: l })),
];

export const EMPTY_PROMOTION: PromotionFormValues = {
  name: "",
  tagline: "",
  categoryKey: "",
  offer: "",
  description: "",
  phone: "",
  whatsapp: true,
  website: "",
  instagram: "",
  address: "",
  locality: "Hiranandani Estate",
  hours: "",
  logoUrl: "",
  imageUrls: [],
  spotlight: false,
  startsOn: "",
  endsOn: "",
};

/** Label above control, consistent gap, error underneath (as the contact dialog). */
function Field({
  label,
  htmlFor,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-2 text-[13px] font-medium text-gray-700">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[11px] text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Add and Edit share this form; `id` is null when adding. Unlike the contact
 * dialog it stays open until the save succeeds: it carries uploaded photos and
 * a long description, and a server-side rejection must not throw those away.
 */
export default function PromotionFormDialog({
  id,
  initial,
  categories,
  open,
  onClose,
}: {
  id: string | null;
  initial: PromotionFormValues;
  categories: SelectOption[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: initial,
  });

  const categoryOptions: SelectOption[] = [{ value: "", label: "No category" }, ...categories];
  const formId = id ? `edit-promotion-${id}` : "add-promotion";

  async function onSubmit(values: PromotionFormValues) {
    setServerError(null);
    try {
      const res = await fetch(id ? `/api/admin/promotions/${id}` : "/api/admin/promotions", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save. Please try again.");
      toast.success(id ? `Saved ${values.name}` : `Added ${values.name}`);
      router.refresh();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save. Please try again.";
      setServerError(msg);
      toast.error(msg);
    }
  }

  const inputClass = "h-10";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={id ? "Edit promotion" : "Add promotion"}
      description="Shows on /promotions as soon as you save, unless it is hidden or its dates say otherwise."
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {/* Lives outside the <form>, so it submits by id */}
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {id ? "Save changes" : "Add promotion"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* What */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field label="Business name *" htmlFor="name" error={errors.name?.message}>
            <Input id="name" className={inputClass} {...register("name")} placeholder="e.g. Raju's Kitchen" />
          </Field>
          <Field label="Category" error={errors.categoryKey?.message}>
            <Controller
              control={control}
              name="categoryKey"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={categoryOptions}
                  aria-label="Category"
                />
              )}
            />
          </Field>
        </div>

        <Field
          label="Tagline *"
          htmlFor="tagline"
          error={errors.tagline?.message}
          hint={`One line under the name, up to ${PROMOTION_TAGLINE_MAX} characters`}
        >
          <Input
            id="tagline"
            className={inputClass}
            maxLength={PROMOTION_TAGLINE_MAX}
            {...register("tagline")}
            placeholder="e.g. Home-style thalis, delivered across the estate"
          />
        </Field>

        <Field
          label="Offer"
          htmlFor="offer"
          error={errors.offer?.message}
          hint="Shown as a badge on the card"
        >
          <Input
            id="offer"
            className={inputClass}
            {...register("offer")}
            placeholder="e.g. 10% off for estate residents"
          />
        </Field>

        <Field label="About" htmlFor="description" error={errors.description?.message}>
          <Textarea
            id="description"
            rows={5}
            className="min-h-28 resize-y leading-relaxed"
            {...register("description")}
            placeholder="What they offer, specialities, anything a resident should know"
          />
        </Field>

        {/* Reach */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field
            label="Phone"
            htmlFor="phone"
            error={errors.phone?.message ?? errors.whatsapp?.message}
            hint="Mobile or landline, e.g. 98765 43210 or 022 2597 2040"
          >
            <Input
              id="phone"
              className={inputClass}
              inputMode="tel"
              {...register("phone")}
              placeholder="98765 43210"
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input type="checkbox" {...register("whatsapp")} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-xs text-gray-600">Reachable on WhatsApp</span>
            </label>
          </Field>
          <Field label="Hours" htmlFor="hours" error={errors.hours?.message}>
            <Input
              id="hours"
              className={inputClass}
              {...register("hours")}
              placeholder="e.g. Mon to Sat, 10am to 9pm"
            />
          </Field>
          <Field label="Website" htmlFor="website" error={errors.website?.message}>
            <Input
              id="website"
              className={inputClass}
              inputMode="url"
              {...register("website")}
              placeholder="example.com"
            />
          </Field>
          <Field label="Instagram" htmlFor="instagram" error={errors.instagram?.message}>
            <Input
              id="instagram"
              className={inputClass}
              {...register("instagram")}
              placeholder="@shopname or profile link"
            />
          </Field>
        </div>

        {/* Where */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field
            label="Address"
            htmlFor="address"
            error={errors.address?.message}
            hint="Used for the Get directions link"
          >
            <Input
              id="address"
              className={inputClass}
              {...register("address")}
              placeholder="Shop 4, Rodas Enclave"
            />
          </Field>
          <Field label="Locality" error={errors.locality?.message}>
            <Controller
              control={control}
              name="locality"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={LOCALITY_OPTIONS}
                  aria-label="Locality"
                />
              )}
            />
          </Field>
        </div>

        {/* Images */}
        <Field label="Logo" hint="Square works best. Shown when there are no photos.">
          <Controller
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <ImageDropzone
                value={field.value ? [field.value] : []}
                onChange={(urls) => field.onChange(urls[0] ?? "")}
                max={1}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>
        <Field label={`Photos (up to ${MAX_PROMOTION_PHOTOS})`} error={errors.imageUrls?.message}>
          <Controller
            control={control}
            name="imageUrls"
            render={({ field }) => (
              <ImageDropzone
                value={field.value}
                onChange={field.onChange}
                max={MAX_PROMOTION_PHOTOS}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>

        {/* Run */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field label="Starts on" htmlFor="startsOn" error={errors.startsOn?.message} hint="Empty = live now">
            <Input id="startsOn" type="date" className={inputClass} {...register("startsOn")} />
          </Field>
          <Field label="Ends on" htmlFor="endsOn" error={errors.endsOn?.message} hint="Empty = no end. Shown until the end of this day.">
            <Input id="endsOn" type="date" className={inputClass} {...register("endsOn")} />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 px-3 py-3">
          <input type="checkbox" {...register("spotlight")} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
          <span>
            <span className="block text-sm font-medium text-gray-800">Spotlight</span>
            <span className="block text-[11px] text-gray-500">
              Also feature it in the slider at the top of the page
            </span>
          </span>
        </label>

        {serverError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {serverError}
          </p>
        )}
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/searchable-select";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";
import { PHONE_EXTENSIONS, combinePhone, formatPhone, parsePhone } from "@/lib/phone";

const CATEGORY_KEYS = COMMUNITY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

const CATEGORY_OPTIONS = COMMUNITY_CATEGORIES.map((c) => ({
  value: c.key,
  label: c.label,
}));
const LOCALITY_OPTIONS = HIRANANDANI_LOCALITIES.map((l) => ({ value: l, label: l }));
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active — visible on the public directory" },
  { value: "PENDING", label: "Pending — hidden until reviewed" },
  { value: "REJECTED", label: "Rejected — hidden" },
];

// react-hook-form needs objects, not bare strings, to track a dynamic list -
// useFieldArray keys off a stable id per row. Unwrapped on submit.
const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  contactPerson: z.string().trim().max(80),
  category: z.enum(CATEGORY_KEYS),
  service: z.string().trim().min(2, "Describe the service").max(200),
  phones: z
    .array(
      z
        .object({
          extension: z.string(),
          number: z.string().trim().min(1, "Enter a number"),
        })
        // combinePhone, not a raw concatenation: it tolerates a pasted whole
        // number and rejects a code paired with a short code. Same function the
        // API and the CSV importer use, so the dialog cannot accept something
        // the server will reject.
        .superRefine((v, ctx) => {
          const r = combinePhone(v.extension, v.number);
          if (!r.valid) {
            ctx.addIssue({
              code: "custom",
              message: r.reason ?? "Not a valid Indian number for that code",
              path: ["number"],
            });
          }
        })
    )
    .min(1, "At least one number")
    .max(5, "At most five numbers"),
  whatsapp: z.boolean(),
  locality: z.string().min(1, "Pick a locality"),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(100),
  verified: z.boolean(),
  status: z.enum(["ACTIVE", "PENDING", "REJECTED"]),
  notes: z.string().trim().max(2000),
});

type FormValues = z.infer<typeof schema>;

export interface ContactRecord {
  id: string;
  name: string;
  contactPerson: string | null;
  category: string;
  service: string;
  phones: string[];
  whatsapp: boolean;
  locality: string;
  address: string;
  hours: string;
  verified: boolean;
  status: string;
  notes: string | null;
}

/** Label above control, consistent gap, error underneath. */
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

export default function ContactFormDialog({
  contact,
}: {
  /** Omitted for the "Add contact" button; supplied when editing a row. */
  contact?: ContactRecord;
}) {
  const isEdit = Boolean(contact);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: contact?.name ?? "",
      contactPerson: contact?.contactPerson ?? "",
      category: (contact?.category as FormValues["category"]) ?? "health",
      service: contact?.service ?? "",
      phones: contact?.phones.length
        ? contact.phones.map((raw) => {
            const parsed = parsePhone(raw);
            return { extension: parsed.extension, number: parsed.number };
          })
        : [{ extension: "+91", number: "" }],
      whatsapp: contact?.whatsapp ?? false,
      locality: contact?.locality ?? "Hiranandani Estate",
      address: contact?.address ?? "",
      hours: contact?.hours ?? "",
      verified: contact?.verified ?? false,
      status: (contact?.status as FormValues["status"]) ?? "ACTIVE",
      notes: contact?.notes ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "phones" });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = {
      ...values,
      phones: values.phones
        .map((p) => formatPhone(p.extension, p.number))
        .filter(Boolean),
      contactPerson: values.contactPerson || null,
      notes: values.notes || null,
    };

    // The write itself is ~17ms in Postgres; the wait the admin feels is the
    // round trip to the database's region plus any serverless cold start.
    // Blocking the dialog on that makes a fast save look broken, so the dialog
    // closes immediately and a toast carries the outcome - including failure,
    // so nothing is silently lost.
    const request = fetch(
      isEdit ? `/api/admin/community/${contact!.id}` : "/api/admin/community",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? payload : { ...payload, contactPerson: values.contactPerson }
        ),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save. Please try again.");
      }
      router.refresh();
      return res;
    });

    toast.promise(request, {
      loading: isEdit ? "Saving changes…" : "Adding contact…",
      success: isEdit ? `Saved ${values.name}` : `Added ${values.name}`,
      error: (e: Error) => e.message,
    });

    setOpen(false);
    if (!isEdit) reset();
  }

  const inputClass = "h-10";

  const formId = isEdit ? `edit-contact-${contact!.id}` : "add-contact";

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add contact
        </Button>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setServerError(null);
        }}
        size="lg"
        title={isEdit ? "Edit contact" : "Add contact"}
        description={
          isEdit
            ? "Changes go live on the public directory as soon as you save."
            : "Added straight to the directory - no review step."
        }
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {/* Lives outside the <form>, so it submits by id */}
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add contact"}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Who */}
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name?.message}>
              <Input
                id="name"
                className={inputClass}
                {...register("name")}
                placeholder="Shop or person's name"
              />
            </Field>
            <Field label="Contact person" htmlFor="contactPerson">
              <Input
                id="contactPerson"
                className={inputClass}
                {...register("contactPerson")}
                placeholder="e.g. Ramesh"
              />
            </Field>
          </div>

          {/* Numbers */}
          <Field
            label="Phone numbers"
            error={
              errors.phones?.message ??
              errors.phones?.find?.((e) => e?.number?.message)?.number?.message
            }
          >
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                  <div className="w-[150px] shrink-0">
                    <Controller
                      control={control}
                      name={`phones.${i}.extension` as const}
                      render={({ field: ext }) => (
                        <SearchableSelect
                          value={ext.value}
                          onChange={(v) => {
                            ext.onChange(v);
                            // The error lives on the sibling `number` field, so
                            // changing the code has to re-run its validation -
                            // otherwise a fixed row keeps showing a stale error.
                            void trigger(`phones.${i}.number` as const);
                          }}
                          options={PHONE_EXTENSIONS.map((e) => ({ value: e.value, label: e.label }))}
                          searchable={false}
                          aria-label={`Dialling code for number ${i + 1}`}
                        />
                      )}
                    />
                  </div>
                  <Input
                    className={inputClass}
                    {...register(`phones.${i}.number` as const)}
                    placeholder="98765 43210"
                    inputMode="tel"
                    aria-label={`Phone number ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    aria-label={`Remove number ${i + 1}`}
                    className="shrink-0 rounded-md p-2.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {fields.length < 5 ? (
                <button
                  type="button"
                  onClick={() => append({ extension: "+91", number: "" })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add another number
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">Maximum of five numbers</span>
              )}

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  {...register("whatsapp")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Reachable on WhatsApp</span>
              </label>
            </div>
          </Field>

          {/* What and where */}
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <Field label="Category">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={CATEGORY_OPTIONS}
                    aria-label="Category"
                  />
                )}
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

          <Field
            label="Service"
            htmlFor="service"
            error={errors.service?.message}
            hint="Shown under the name on the public directory"
          >
            <Input
              id="service"
              className={inputClass}
              {...register("service")}
              placeholder="e.g. AC repair and servicing"
            />
          </Field>

          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <Field label="Address" htmlFor="address">
              <Input
                id="address"
                className={inputClass}
                {...register("address")}
                placeholder="Shop / building / landmark"
              />
            </Field>
            <Field label="Hours" htmlFor="hours">
              <Input
                id="hours"
                className={inputClass}
                {...register("hours")}
                placeholder="e.g. Mon to Sat, 9am to 8pm"
              />
            </Field>
          </div>

          {/* Publishing */}
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <Field label="Status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={STATUS_OPTIONS}
                    searchable={false}
                    aria-label="Status"
                  />
                )}
              />
            </Field>
            <Field label="Verification">
              <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3">
                <input
                  type="checkbox"
                  {...register("verified")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Verified by the team</span>
              </label>
            </Field>
          </div>

          <Field label="Internal notes" htmlFor="notes" hint="Never shown publicly">
            <Textarea
              id="notes"
              rows={4}
              className="min-h-24 resize-y leading-relaxed"
              {...register("notes")}
            />
          </Field>

          {serverError && (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {serverError}
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}

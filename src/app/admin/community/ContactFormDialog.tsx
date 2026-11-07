"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";

const CATEGORY_KEYS = COMMUNITY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

// react-hook-form needs objects, not bare strings, to track a dynamic list -
// useFieldArray keys off a stable id per row. Unwrapped on submit.
const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  contactPerson: z.string().trim().max(80),
  category: z.enum(CATEGORY_KEYS),
  service: z.string().trim().min(2, "Describe the service").max(200),
  phones: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(3, "Enter a valid number")
          .max(20)
          .regex(/^[+\d\s\-()]+$/, "Digits, spaces, + - ( ) only"),
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: contact?.name ?? "",
      contactPerson: contact?.contactPerson ?? "",
      category: (contact?.category as FormValues["category"]) ?? "health",
      service: contact?.service ?? "",
      phones: contact?.phones.length
        ? contact.phones.map((value) => ({ value }))
        : [{ value: "" }],
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
      phones: values.phones.map((p) => p.value).filter(Boolean),
      contactPerson: values.contactPerson || null,
      notes: values.notes || null,
    };

    const res = await fetch(
      isEdit ? `/api/admin/community/${contact!.id}` : "/api/admin/community",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? payload : { ...payload, contactPerson: values.contactPerson }
        ),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Could not save. Please try again.");
      return;
    }

    setOpen(false);
    if (!isEdit) reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setServerError(null);
      }}
    >
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add contact
        </Button>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} placeholder="Shop or person's name" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input id="contactPerson" {...register("contactPerson")} placeholder="e.g. Ramesh" />
            </div>
          </div>

          {/* Phone numbers — repeatable */}
          <div>
            <Label>Phone numbers</Label>
            <div className="space-y-2 mt-1.5">
              {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`phones.${i}.value` as const)}
                    placeholder="98765 43210"
                    inputMode="tel"
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    aria-label="Remove number"
                    className="px-2.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {fields.length < 5 && (
              <button
                type="button"
                onClick={() => append({ value: "" })}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another number
              </button>
            )}
            {errors.phones && (
              <p className="text-xs text-red-600 mt-1">
                {errors.phones.message ??
                  errors.phones.find?.((e) => e?.value?.message)?.value?.message ??
                  "Check the numbers entered"}
              </p>
            )}
            <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
              <input type="checkbox" {...register("whatsapp")} className="rounded border-gray-300" />
              <span className="text-xs text-gray-600">Reachable on WhatsApp</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNITY_CATEGORIES.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Locality</Label>
              <Controller
                control={control}
                name="locality"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select locality" />
                    </SelectTrigger>
                    <SelectContent>
                      {HIRANANDANI_LOCALITIES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="service">Service</Label>
            <Input id="service" {...register("service")} placeholder="e.g. AC repair and servicing" />
            {errors.service && (
              <p className="text-xs text-red-600 mt-1">{errors.service.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="Shop / building / landmark" />
            </div>
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" {...register("hours")} placeholder="e.g. Mon–Sat, 9am–8pm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  {...register("verified")}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Verified by the team</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" rows={2} {...register("notes")} placeholder="Not shown publicly" />
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {isEdit ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

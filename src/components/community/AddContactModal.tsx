"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, CheckCircle2, Plus } from "lucide-react";
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
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";

const CATEGORY_KEYS = COMMUNITY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

const schema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  category: z.enum(CATEGORY_KEYS, { message: "Pick a category" }),
  service: z.string().min(5, "Describe the service (min 5 chars)").max(200),
  locality: z.string().refine((v) => (HIRANANDANI_LOCALITIES as readonly string[]).includes(v), {
    message: "Pick a locality",
  }),
  address: z.string().max(200).optional().default(""),
  contactPerson: z.string().max(80).optional(),
  hours: z.string().max(100).optional().default(""),
  whatsapp: z.boolean().default(false),
  submittedBy: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function AddContactModal() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { whatsapp: false },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/community/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      reset();
    }, 300);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 rounded-xl"
      >
        <Plus className="h-4 w-4" />
        Add a contact
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal */}
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900">Add a contact</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitted entries are reviewed before going live.
                </p>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              {done ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Thanks for the submission!
                  </h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    We&apos;ll verify the details and add them to the directory
                    once approved.
                  </p>
                  <Button onClick={close} className="mt-2 rounded-xl">
                    Close
                  </Button>
                </div>
              ) : (
                <form
                  id="add-contact-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Name *</Label>
                      <Input
                        {...register("name")}
                        placeholder="Shop or person's name"
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label>Phone *</Label>
                      <Input
                        {...register("phone")}
                        placeholder="+91 98765 43210"
                        type="tel"
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5 flex items-end pb-0.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Controller
                          control={control}
                          name="whatsapp"
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          )}
                        />
                        <span className="text-sm text-gray-700">
                          Available on WhatsApp
                        </span>
                      </label>
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <Label>Category *</Label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger aria-invalid={!!errors.category}>
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
                      {errors.category && (
                        <p className="text-xs text-red-500">{errors.category.message}</p>
                      )}
                    </div>

                    {/* Locality */}
                    <div className="space-y-1.5">
                      <Label>Locality *</Label>
                      <Controller
                        control={control}
                        name="locality"
                        render={({ field }) => (
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger aria-invalid={!!errors.locality}>
                              <SelectValue placeholder="Select locality" />
                            </SelectTrigger>
                            <SelectContent>
                              {(HIRANANDANI_LOCALITIES as readonly string[]).map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.locality && (
                        <p className="text-xs text-red-500">{errors.locality.message}</p>
                      )}
                    </div>

                    {/* Service description */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>What do they do? *</Label>
                      <Textarea
                        {...register("service")}
                        placeholder="e.g. Full home carpentry, custom wardrobes and furniture repair"
                        rows={2}
                        aria-invalid={!!errors.service}
                      />
                      {errors.service && (
                        <p className="text-xs text-red-500">{errors.service.message}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        Address / landmark{" "}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </Label>
                      <Input
                        {...register("address")}
                        placeholder="e.g. Shop 4, Ground Floor, Hiranandani Market"
                      />
                    </div>

                    {/* Contact person */}
                    <div className="space-y-1.5">
                      <Label>
                        Contact person{" "}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </Label>
                      <Input
                        {...register("contactPerson")}
                        placeholder="e.g. Ramesh"
                      />
                    </div>

                    {/* Hours */}
                    <div className="space-y-1.5">
                      <Label>
                        Working hours{" "}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </Label>
                      <Input
                        {...register("hours")}
                        placeholder="e.g. Mon–Sat, 9am–8pm"
                      />
                    </div>

                    {/* Submitter email */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        Your email{" "}
                        <span className="text-gray-400 font-normal">(optional - for follow-up)</span>
                      </Label>
                      <Input
                        {...register("submittedBy")}
                        type="email"
                        placeholder="you@example.com"
                        aria-invalid={!!errors.submittedBy}
                      />
                      {errors.submittedBy && (
                        <p className="text-xs text-red-500">
                          {errors.submittedBy.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!done && (
              <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex justify-end gap-2">
                <Button variant="outline" onClick={close} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="add-contact-form"
                  disabled={isSubmitting}
                  className="gap-2 rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit for review"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

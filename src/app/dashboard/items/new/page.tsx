"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ItemForm, { type DetailsData, type UploadedImage } from "@/components/marketplace/ItemForm";
import { useAccountPhone } from "@/components/ui/ContactPhoneField";

export default function NewItemPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const accountPhone = useAccountPhone();

  async function handleSubmit(details: DetailsData, images: UploadedImage[]) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          yearPurchased: details.yearPurchased || null,
          images: images.map((img) => ({
            url: img.url,
            s3Key: img.s3Key,
            isPrimary: img.isPrimary,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }
      toast.success("Your listing is now live!");
      router.push("/dashboard/items");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // The details step is the first screen and takes its defaults once, so wait
  // for the saved number before mounting the form
  if (accountPhone === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sell an item</h1>
        <p className="text-sm text-gray-500 mt-1">
          List something you no longer need — reach every resident of the estate.
        </p>
      </div>
      <ItemForm
        defaults={{ details: { contactPhone: accountPhone } }}
        submitLabel="Post Listing"
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ItemForm, { type DetailsData, type UploadedImage } from "@/components/marketplace/ItemForm";

export default function EditItemPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [defaults,   setDefaults]   = useState<{ details: Partial<DetailsData>; images: UploadedImage[] } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/items/${id}`);
        if (!res.ok) { toast.error("Failed to load item"); router.push("/dashboard/items"); return; }
        const { item } = await res.json();
        setDefaults({
          details: {
            title:           item.title,
            description:     item.description,
            category:        item.category,
            vehicleType:     item.vehicleType ?? undefined,
            condition:       item.condition,
            brand:           item.brand ?? "",
            yearPurchased:   item.yearPurchased ?? undefined,
            pickupLocality:  item.pickupLocality,
            pickupArea:      item.pickupArea ?? "",
            price:           item.price,
            priceNegotiable: item.priceNegotiable ?? false,
          },
          images: (item.images ?? []).map((img: { url: string; s3Key: string; isPrimary: boolean }) => ({
            preview: img.url, url: img.url, s3Key: img.s3Key,
            isPrimary: img.isPrimary, uploading: false,
          })),
        });
      } catch {
        toast.error("Failed to load item");
        router.push("/dashboard/items");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleSubmit(details: DetailsData, images: UploadedImage[]) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
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
      toast.success("Listing updated and live!");
      router.push("/dashboard/items");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

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
        <p className="text-sm text-gray-500 mt-1">Changes go live immediately.</p>
      </div>
      <ItemForm
        defaults={defaults ?? undefined}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}

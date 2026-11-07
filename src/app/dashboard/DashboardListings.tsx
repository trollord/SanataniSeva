"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
} from "@/lib/constants";
import { turnaroundDays, formatPrice, formatDate } from "@/lib/utils/formatters";
import { Building2, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

interface PropertyImage {
  url: string;
  isPrimary: boolean;
}

interface PropertyWithCount {
  id: string;
  title: string;
  type: string;
  listingType: string;
  status: string;
  locality: string;
  building: string;
  bedrooms: number | null;
  areaSqft: number;
  price: number;
  deposit: number | null;
  rentNegotiable: boolean;
  lockInMonths: number | null;
  createdAt: Date;
  activatedAt: Date | null;
  closedAt: Date | null;
  images: PropertyImage[];
  _count: { inquiries: number };
}

interface Inquiry {
  id: string;
  status: string;
  createdAt: string;
  seeker: {
    name: string | null;
    email: string;
    phone: string | null;
  };
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  DELETE_REQUESTED: {
    label: "Deletion Requested",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export default function DashboardListings({
  properties: initialProperties,
}: {
  properties: PropertyWithCount[];
}) {
  const router = useRouter();
  const [properties, setProperties] = useState(initialProperties);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [interests, setInterests] = useState<Inquiry[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [inactiveConfirmId, setInactiveConfirmId] = useState<string | null>(null);

  const counts = {
    ACTIVE: properties.filter((p) => p.status === "ACTIVE").length,
    PENDING: properties.filter((p) => p.status === "PENDING").length,
    REJECTED: properties.filter((p) => p.status === "REJECTED").length,
    INACTIVE: properties.filter((p) => p.status === "INACTIVE").length,
  };

  async function openInterests(propertyId: string) {
    setSheetOpen(true);
    setInterestsLoading(true);
    setInterests([]);
    try {
      const res = await fetch(`/api/dashboard/properties/${propertyId}/interests`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInterests(data.inquiries ?? []);
    } catch {
      toast.error("Failed to load interests");
    } finally {
      setInterestsLoading(false);
    }
  }

  async function requestDelete(propertyId: string) {
    setDeleteLoading(propertyId);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to request deletion");
      }
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: "DELETE_REQUESTED" } : p))
      );
      toast.success("Deletion request submitted. Admin will review shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteLoading(null);
    }
  }

  async function toggleStatus(propertyId: string, newStatus: "ACTIVE" | "INACTIVE") {
    setStatusLoading(propertyId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update status");
      }
      const data = await res.json();
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: data.status } : p))
      );
      toast.success(
        newStatus === "INACTIVE"
          ? "Property marked as rented/sold"
          : "Property reactivated"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStatusLoading(null);
    }
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
        <div className="inline-flex p-5 rounded-full bg-gray-100 mb-6">
          <Building2 className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No properties listed yet</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
          You haven&apos;t listed any properties yet. Start listing now and connect with serious buyers and tenants in Hiranandani Estate - completely free.
        </p>
        <Link href="/dashboard/new">
          <Button className="bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 px-6 py-5 text-base">
            <PlusCircle className="h-5 w-5" />
            Start Listing Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Stats - only shown when the owner has more than 5 listings */}
      {properties.length > 5 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {(
            [
              { key: "ACTIVE", label: "Active", color: "text-gray-700 bg-[#f9f9f9] border-[#e0e0e0]" },
              { key: "PENDING", label: "Pending", color: "text-[#2d3435] bg-white border-[#d4d4d4]" },
              { key: "REJECTED", label: "Rejected", color: "text-gray-700 bg-[#f0f0f0] border-[#c8c8c8]" },
              { key: "INACTIVE", label: "Inactive", color: "text-[#5a6061] bg-[#fafafa] border-[#e5e5e5]" },
            ] as const
          ).map(({ key, label, color }) => (
            <div key={key} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-2xl font-bold">{counts[key]}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Listings */}
      <div className="space-y-4">
        {properties.map((property) => {
          const badge = STATUS_BADGE[property.status] ?? STATUS_BADGE.INACTIVE;
          const thumb = property.images[0]?.url;
          const isLoading = statusLoading === property.id;

          return (
            <div
              key={property.id}
              className="flex gap-5 bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* Thumbnail */}
              <div className="w-36 h-28 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-9 w-9 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {property.title}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badge.className} shrink-0`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1.5">
                  {PROPERTY_TYPE_LABELS[property.type]} ·{" "}
                  {LISTING_TYPE_LABELS[property.listingType]} ·{" "}
                  {property.locality}
                  {property.bedrooms ? ` · ${property.bedrooms} BHK` : ""}
                  {property.areaSqft ? ` · ${property.areaSqft.toLocaleString()} sq.ft` : ""}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <p className="text-base font-bold text-blue-700">
                    {formatPrice(property.price)}
                    {property.listingType === "RENT" ? "/mo" : ""}
                  </p>
                  {property.rentNegotiable && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      Negotiable
                    </span>
                  )}
                  {property.lockInMonths && property.lockInMonths > 0 && (
                    <span className="text-xs text-gray-400">
                      Lock-in: {property.lockInMonths}m
                    </span>
                  )}
                  {property.status === "ACTIVE" && turnaroundDays(property.activatedAt) !== null && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Live for {turnaroundDays(property.activatedAt)}d
                    </span>
                  )}
                  {property.status === "INACTIVE" && turnaroundDays(property.activatedAt, property.closedAt) !== null && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Closed in {turnaroundDays(property.activatedAt, property.closedAt)}d
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/listings/${property.id}`)}
                  >
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/listings/${property.id}/edit`)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInterests(property.id)}
                  >
                    Interests ({property._count.inquiries})
                  </Button>

                  {property.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setInactiveConfirmId(property.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Mark as Rented/Sold"
                      )}
                    </Button>
                  )}

                  {property.status === "INACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => toggleStatus(property.id, "ACTIVE")}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reactivate"}
                    </Button>
                  )}

                  {property.status !== "DELETE_REQUESTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 mt-1"
                      onClick={() => setDeleteConfirmId(property.id)}
                      disabled={deleteLoading === property.id}
                    >
                      {deleteLoading === property.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Request Deletion"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interests Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-6">
          <SheetHeader>
            <SheetTitle>Interested Seekers</SheetTitle>
          </SheetHeader>

          {interestsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : interests.length === 0 ? (
            <p className="text-sm text-gray-500 mt-6">No one has registered interest yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {interests.map((inquiry) => (
                    <tr key={inquiry.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-medium text-gray-900">
                        {inquiry.seeker.name ?? "-"}
                      </td>
                      <td className="py-2 pr-2 text-gray-600">
                        <a href={`mailto:${inquiry.seeker.email}`} className="hover:underline">
                          {inquiry.seeker.email}
                        </a>
                      </td>
                      <td className="py-2 pr-2 text-gray-600">
                        {inquiry.seeker.phone ? (
                          <a href={`tel:${inquiry.seeker.phone}`} className="hover:underline">
                            {inquiry.seeker.phone}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="py-2 text-gray-400 text-xs">
                        {formatDate(inquiry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mark as Rented/Sold confirm */}
      <Modal
        open={!!inactiveConfirmId}
        onClose={() => setInactiveConfirmId(null)}
        title="Mark as Rented / Sold?"
        description="All interested seekers will be notified. You can reactivate this listing later if needed."
        confirmLabel="Yes, Mark as Rented/Sold"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!inactiveConfirmId) return;
          const id = inactiveConfirmId;
          setInactiveConfirmId(null);
          await toggleStatus(id, "INACTIVE");
        }}
        loading={!!statusLoading}
      />

      {/* Request deletion confirm */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Request Deletion?"
        description="An admin will review your request before permanently removing this listing."
        confirmLabel="Request Deletion"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!deleteConfirmId) return;
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          await requestDelete(id);
        }}
        danger
        loading={!!deleteLoading}
      />
    </>
  );
}

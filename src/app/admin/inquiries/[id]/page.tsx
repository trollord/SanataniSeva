"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User, Building2, FileText, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/formatters";
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/lib/constants";

interface InquiryDetail {
  id: string;
  status: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  seeker: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
  };
  property: {
    id: string;
    title: string;
    locality: string;
    building: string;
    listingType: string;
    type: string;
    owner: { id: string; name: string | null; email: string | null; phone: string | null };
  };
}

export default function AdminInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/inquiries/${id}`)
      .then((r) => r.json())
      .then((d) => setInquiry(d.inquiry ?? null))
      .catch(() => toast.error("Failed to load inquiry"))
      .finally(() => setLoading(false));
  }, [id]);

  async function markAsSeen() {
    if (!inquiry || inquiry.status === "SEEN") return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SEEN" }),
      });
      if (!res.ok) throw new Error();
      setInquiry((prev) => prev ? { ...prev, status: "SEEN" } : prev);
      toast.success("Marked as seen");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!inquiry) {
    return <div className="p-8 text-gray-500">Inquiry not found.</div>;
  }

  const contactPhone = inquiry.phone ?? inquiry.seeker.phone;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <button
        onClick={() => router.push("/admin/inquiries")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inquiries
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inquiry Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(new Date(inquiry.createdAt))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs sm:text-sm px-3 py-1 rounded-full font-medium ${
              inquiry.status === "SEEN"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {inquiry.status}
          </span>
          {inquiry.status !== "SEEN" && (
            <button
              onClick={markAsSeen}
              disabled={updating}
              className="flex items-center gap-1.5 text-xs sm:text-sm bg-[#FF5F15] text-white px-3 sm:px-4 py-1.5 rounded-lg hover:bg-[#E84A00] transition-colors disabled:opacity-50"
            >
              {updating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark as Seen
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Inquiry Info Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Inquiry Info
            </h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Date" value={formatDate(new Date(inquiry.createdAt))} />
            <InfoRow label="Status" value={inquiry.status} />
            <InfoRow
              label="Property"
              value={inquiry.property.title}
              link={`/admin/listings/${inquiry.property.id}`}
            />
            <InfoRow label="Location" value={`${inquiry.property.locality} · ${inquiry.property.building}`} />
            <InfoRow
              label="Listing Type"
              value={`${PROPERTY_TYPE_LABELS[inquiry.property.type] ?? inquiry.property.type} · For ${LISTING_TYPE_LABELS[inquiry.property.listingType] ?? inquiry.property.listingType}`}
            />
          </div>
        </div>

        {/* Seeker Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Inquirer
            </h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Name" value={inquiry.seeker.name ?? "-"} />
            <InfoRow label="Email" value={inquiry.seeker.email ?? "-"} />
            <InfoRow
              label="Phone"
              value={contactPhone ?? "Not provided"}
              muted={!contactPhone}
            />
            <InfoRow label="Member Since" value={formatDate(new Date(inquiry.seeker.createdAt))} />
          </div>
        </div>

        {/* Owner Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Property Owner
            </h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Name" value={inquiry.property.owner.name ?? "-"} />
            <InfoRow label="Email" value={inquiry.property.owner.email ?? "-"} />
            <InfoRow
              label="Phone"
              value={inquiry.property.owner.phone ?? "Not provided"}
              muted={!inquiry.property.owner.phone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  muted,
  link,
}: {
  label: string;
  value: string;
  muted?: boolean;
  link?: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400 shrink-0">{label}</span>
      {link ? (
        <a href={link} className="text-blue-600 hover:underline text-right truncate">
          {value}
        </a>
      ) : (
        <span className={`text-right ${muted ? "text-gray-400 italic" : "text-gray-900"}`}>
          {value}
        </span>
      )}
    </div>
  );
}

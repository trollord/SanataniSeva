"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/formatters";

interface InquiryItem {
  id: string;
  status: string;
  createdAt: string;
  phone: string | null;
  seeker: { id: string; name: string | null; email: string | null; phone: string | null };
  property: {
    id: string;
    title: string;
    locality: string;
    building: string;
    owner: { id: string; name: string | null; email: string | null; phone: string | null };
  };
}

export default function AdminInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then((r) => r.json())
      .then((d) => setInquiries(d.inquiries ?? []))
      .catch(() => toast.error("Failed to load inquiries"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <MessageSquare className="h-5 w-5 text-gray-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inquiries</h1>
        <span className="text-sm text-gray-400 ml-1">({inquiries.length})</span>
      </div>

      {inquiries.length === 0 ? (
        <p className="text-gray-400 italic text-sm">No inquiries yet.</p>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <button
              key={inq.id}
              onClick={() => router.push(`/admin/inquiries/${inq.id}`)}
              className="w-full flex items-center justify-between bg-white rounded-xl px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {inq.seeker.name ?? inq.seeker.email ?? "Unknown seeker"}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {inq.property.title} · {inq.property.locality}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(new Date(inq.createdAt))}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    inq.status === "SEEN"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {inq.status}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

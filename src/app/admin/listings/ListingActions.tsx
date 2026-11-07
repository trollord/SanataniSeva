"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

export default function ListingActions({
  propertyId,
  status,
}: {
  propertyId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function changeStatus(newStatus: string) {
    if (newStatus === status) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update status");
        return;
      }
      toast.success(`Status updated to ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProperty() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/status`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete listing");
        return;
      }
      toast.success("Listing deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => {
        // Prevent row/card link navigation when interacting with actions
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : confirmDelete ? (
        <>
          <span className="text-xs text-red-600 font-medium whitespace-nowrap">Delete permanently?</span>
          <button
            onClick={deleteProperty}
            className="text-xs px-2 py-1 rounded font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            No
          </button>
        </>
      ) : (
        <>
          <select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
            {!STATUS_OPTIONS.some((s) => s.value === status) && (
              <option value={status}>{status}</option>
            )}
          </select>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete listing"
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

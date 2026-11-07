"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCircle } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
];

export default function CommunityAdminActions({
  contactId,
  status,
}: {
  contactId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function changeStatus(newStatus: string) {
    if (newStatus === status) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/community/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update");
        return;
      }
      toast.success(`Set to ${newStatus}`);
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/community/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete");
        return;
      }
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
      {status !== "ACTIVE" && (
        <button
          onClick={() => changeStatus("ACTIVE")}
          disabled={busy}
          className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          Accept
        </button>
      )}

      <select
        value={status}
        disabled={busy}
        onChange={(e) => changeStatus(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {confirmDelete ? (
        <>
          <button
            onClick={doDelete}
            disabled={busy}
            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={busy}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs font-semibold text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      )}
    </div>
  );
}

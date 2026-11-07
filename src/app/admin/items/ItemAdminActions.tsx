"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCircle2 } from "lucide-react";

const OTHER_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "SOLD",    label: "Sold" },
  { value: "CLOSED",  label: "Closed" },
];

export default function ItemAdminActions({
  itemId,
  status,
}: {
  itemId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function changeStatus(newStatus: string) {
    if (newStatus === status) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update");
        return;
      }
      toast.success(newStatus === "ACTIVE" ? "Item verified and live!" : `Set to ${newStatus}`);
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
      const res = await fetch(`/api/admin/items/${itemId}/status`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete");
        return;
      }
      toast.success("Item deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {/* Verify button - only for PENDING items */}
      {status === "PENDING" && (
        <button
          onClick={() => changeStatus("ACTIVE")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white
                     bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5
                     disabled:opacity-50 transition-colors"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Verify
        </button>
      )}

      {/* Status dropdown - excludes ACTIVE (use Verify button instead) */}
      {status !== "PENDING" && (
        <select
          value={status}
          disabled={busy}
          onChange={(e) => changeStatus(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white"
        >
          {OTHER_STATUSES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {/* Delete */}
      {confirmDelete ? (
        <>
          <button
            onClick={doDelete}
            disabled={busy}
            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700
                       rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={busy}
            className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs font-semibold text-red-600 border border-gray-200
                     hover:border-red-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      )}
    </div>
  );
}

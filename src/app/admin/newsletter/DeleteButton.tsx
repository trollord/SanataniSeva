"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={doDelete}
          disabled={busy}
          className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Confirm
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}

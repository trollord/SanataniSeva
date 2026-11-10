"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export default function DeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    const ok = await confirm({
      title: "Delete this edition?",
      description: `"${title}" and its PDF will be removed for good. This cannot be undone - unpublish it instead if you only want it off the public page.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

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

  return (
    <button
      onClick={doDelete}
      disabled={busy}
      aria-label={`Delete ${title}`}
      className="text-xs text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}

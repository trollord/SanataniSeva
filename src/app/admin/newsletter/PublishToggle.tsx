"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";

/**
 * Moves an edition between DRAFT and PUBLISHED.
 *
 * Both directions change what residents can see, so both confirm first - the
 * same dialog the rest of the admin uses. Unpublishing is reversible and the
 * copy says so, which is the difference between this and a delete.
 */
export default function PublishToggle({
  id,
  status,
  title,
}: {
  id: string;
  status: string;
  title: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const published = status === "PUBLISHED";
  const next = published ? "DRAFT" : "PUBLISHED";

  async function toggle() {
    const ok = await confirm({
      title: published ? "Unpublish this edition?" : "Publish this edition?",
      description: published
        ? `"${title}" will come off the newspaper page and stop opening for anyone holding the link. You can publish it again at any time.`
        : `"${title}" will appear on the public newspaper page straight away.`,
      confirmLabel: published ? "Unpublish" : "Publish",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || `Request failed (${res.status})`);
      }
      toast.success(published ? "Moved to draft" : "Published");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={published ? `Unpublish ${title}` : `Publish ${title}`}
      className={`text-xs rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        published
          ? "text-gray-600 border-gray-200 hover:border-gray-400"
          : "text-green-700 border-green-200 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : published ? (
        <EyeOff className="h-3.5 w-3.5" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{published ? "Unpublish" : "Publish"}</span>
    </button>
  );
}

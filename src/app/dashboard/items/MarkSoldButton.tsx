"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export default function MarkSoldButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  async function handleMarkSold() {
    const ok = await confirm({
      title: "Mark this item as sold?",
      description: "It stays visible in the marketplace, labelled as sold.",
      confirmLabel: "Mark as sold",
    });
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as sold");
      toast.success("Item marked as sold.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleMarkSold}
      disabled={loading}
      className="gap-1.5 px-2.5 sm:px-3 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <CheckCircle2 className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">Mark Sold</span>
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarkSoldButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkSold() {
    if (!confirm("Mark this item as sold? It will still be visible in the marketplace.")) return;
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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const doDelete = () => {
    start(async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to delete");
        }
        toast.success("Item deleted");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={doDelete}
          disabled={pending}
          className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Confirm
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setConfirming(true)}
      className="gap-1.5 px-2.5 sm:px-3 text-red-600 hover:text-red-700 hover:border-red-300"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Delete</span>
    </Button>
  );
}

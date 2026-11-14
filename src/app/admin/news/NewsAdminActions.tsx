"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import CreateNewsForm, { type NewsFormItem } from "./CreateNewsForm";

interface Props {
  item: NewsFormItem;
  status: string;
}

export default function NewsAdminActions({ item, status }: Props) {
  const { id } = item;
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    router.refresh();
    setLoading(false);
  }

  async function del() {
    const ok = await confirm({
      title: "Delete this news item?",
      description: "It will be removed from the feed immediately. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      <button
        onClick={() => setEditing(true)}
        disabled={loading}
        className="text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        Edit
      </button>
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          status === "PUBLISHED"
            ? "text-gray-600 border-gray-200 hover:border-gray-400"
            : "text-green-700 border-green-200 hover:border-green-400"
        }`}
      >
        {status === "PUBLISHED" ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={del}
        disabled={loading}
        className="text-xs font-medium text-red-600 border border-red-200 hover:border-red-400 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        Delete
      </button>

      {/* Modal unmounts its children when closed, so each open starts from the
          saved post rather than from an abandoned edit. `contents` undoes the
          cell's text-right without adding a box to this flex row. */}
      <div className="contents text-left">
        <Modal
          open={editing}
          onClose={() => setEditing(false)}
          size="lg"
          title="Edit news item"
          description="Changes go live as soon as you save. The post keeps its original date."
        >
          <CreateNewsForm item={item} onDone={() => setEditing(false)} />
        </Modal>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  id: string;
  status: string;
}

export default function NewsAdminActions({ id, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    if (!confirm("Delete this news item? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
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
    </div>
  );
}

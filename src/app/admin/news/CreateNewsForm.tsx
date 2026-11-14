"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import SearchableSelect from "@/components/ui/searchable-select";
import ImageDropzone from "@/components/ui/ImageDropzone";
import { toast } from "sonner";
import { MAX_NEWS_IMAGES } from "@/lib/news";

const CATEGORIES = [
  { value: "EVENTS",        label: "Events" },
  { value: "COMMUNITY",     label: "Community" },
  { value: "ANNOUNCEMENTS", label: "Announcements" },
  { value: "SPORTS",        label: "Sports" },
  { value: "GENERAL",       label: "General" },
];

const todayIso = () => new Date().toISOString().split("T")[0];

export interface NewsFormItem {
  id: string;
  headline: string;
  body: string;
  category: string;
  imageUrls: string[];
}

/**
 * Posts a news item, or - given `item` - edits one. Edit mode renders bare
 * (the dialog supplies the title and frame) and has no date field: the feed is
 * ordered by publishedAt, so an edit keeps the post where it is.
 */
export default function CreateNewsForm({
  item,
  onDone,
}: {
  item?: NewsFormItem;
  /** Edit mode only: closes the dialog on save or cancel. */
  onDone?: () => void;
}) {
  const isEdit = Boolean(item);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    headline: item?.headline ?? "",
    body: item?.body ?? "",
    category: item?.category ?? "GENERAL",
    imageUrls: item?.imageUrls ?? [],
    publishedAt: todayIso(),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setImages(urls: string[]) {
    setForm((f) => ({ ...f, imageUrls: urls }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Don't hold the form hostage to the round trip: clear it straight away and
    // let a toast carry the outcome. The write itself is fast; what the admin
    // felt was the request, and a frozen button reads as a broken one.
    const payload = form;
    const request = fetch(isEdit ? `/api/news/${item!.id}` : "/api/news", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Something went wrong.");
      }
      router.refresh();
      return res;
    });

    toast.promise(request, {
      loading: isEdit ? "Saving changes…" : "Publishing…",
      success: isEdit ? `Saved “${payload.headline}”` : `Published “${payload.headline}”`,
      error: (err: Error) => err.message,
    });

    if (isEdit) {
      onDone?.();
      return;
    }
    setForm({ headline: "", body: "", category: "GENERAL", imageUrls: [], publishedAt: todayIso() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={isEdit ? "space-y-4" : "bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4"}
    >
      {!isEdit && (
        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Post a News Item</h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Headline *
          </label>
          <input
            required
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C8541A] transition-colors"
            placeholder="e.g. Ganesh Chaturthi celebration in Central Park"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Body *
          </label>
          <textarea
            required
            rows={3}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C8541A] transition-colors resize-none"
            placeholder="2–3 sentence summary shown on the news feed."
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <SearchableSelect
            value={form.category}
            onChange={(v) => set("category", v)}
            options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            aria-label="News category"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Images <span className="normal-case font-normal text-gray-400">(optional)</span>
          </label>
          <ImageDropzone
            value={form.imageUrls}
            onChange={setImages}
            max={MAX_NEWS_IMAGES}
            disabled={loading}
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C8541A] transition-colors"
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className={isEdit ? "flex items-center justify-end gap-2.5" : ""}>
        {isEdit && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm font-semibold text-gray-600 border border-gray-200 hover:border-gray-400 px-5 py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#C8541A] hover:bg-[#B34A16] active:scale-[0.97]
                     text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : loading ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}

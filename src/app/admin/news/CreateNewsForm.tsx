"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "EVENTS",        label: "Events" },
  { value: "COMMUNITY",     label: "Community" },
  { value: "ANNOUNCEMENTS", label: "Announcements" },
  { value: "SPORTS",        label: "Sports" },
  { value: "GENERAL",       label: "General" },
];

const todayIso = () => new Date().toISOString().split("T")[0];

export default function CreateNewsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    headline: "",
    body: "",
    category: "GENERAL",
    imageUrl: "",
    publishedAt: todayIso(),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Something went wrong.");
        return;
      }
      setForm({ headline: "", body: "", category: "GENERAL", imageUrl: "", publishedAt: todayIso() });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4"
    >
      <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Post a News Item</h2>

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
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#C8541A] transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Image URL <span className="normal-case font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C8541A] transition-colors"
            placeholder="https://..."
          />
        </div>

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
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-[#C8541A] hover:bg-[#B34A16] active:scale-[0.97]
                   text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}

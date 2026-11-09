"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Search box for the community table. Filtering happens in Postgres against a
 * trigram-indexed generated column, so the term has to reach the server - it
 * goes in the URL, which also makes a search shareable and survives a refresh.
 *
 * Debounced: typing pushes a new URL on every keystroke otherwise, and each one
 * is a server render.
 */
export default function CommunitySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("q") ?? "";
  const [value, setValue] = useState(current);

  // Keep in step when the URL changes from elsewhere (tab switch, back button).
  useEffect(() => setValue(current), [current]);

  useEffect(() => {
    if (value === current) return;
    const t = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value.trim()) sp.set("q", value.trim());
      else sp.delete("q");
      sp.delete("page"); // a narrower result set invalidates the current page
      router.replace(`/admin/community?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(t);
  }, [value, current, router, searchParams]);

  return (
    <div className="relative mb-4 sm:mb-5">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, person, phone, service, locality, address or tag…"
        aria-label="Search contacts"
        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

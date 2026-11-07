"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HIRANANDANI_LOCALITIES, PROPERTY_TYPE_LABELS } from "@/lib/constants";

export default function SearchBar() {
  const router = useRouter();
  const [listingType, setListingType] = useState("RENT");
  const [type, setType] = useState("");
  const [locality, setLocality] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (listingType) params.set("listingType", listingType);
    if (type) params.set("type", type);
    if (locality) params.set("locality", locality);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col sm:flex-row gap-2 w-full max-w-3xl mx-auto">
      {/* Rent / Buy toggle */}
      <div className="flex rounded-full overflow-hidden bg-gray-100 shrink-0 p-0.5">
        {["RENT", "SALE"].map((t) => (
          <button
            key={t}
            onClick={() => setListingType(t)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              listingType === t
                ? "bg-[#FF5F15] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "RENT" ? "Rent" : "Buy"}
          </button>
        ))}
      </div>

      {/* Property Type */}
      <Select value={type} onValueChange={(v) => setType(v ?? "")}>
        <SelectTrigger className="flex-1 border-0 bg-transparent min-w-[120px] focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Property type" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Divider */}
      <div className="hidden sm:block h-8 w-px bg-gray-200 self-center" />

      {/* Locality */}
      <Select value={locality} onValueChange={(v) => setLocality(v ?? "")}>
        <SelectTrigger className="flex-1 border-0 bg-transparent min-w-[140px] focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Select locality" />
        </SelectTrigger>
        <SelectContent>
          {HIRANANDANI_LOCALITIES.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleSearch}
        className="bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-[#FF5F15] font-semibold px-6 rounded-full shrink-0 gap-2 transition-all duration-300"
      >
        <Search className="h-4 w-4" />
        Search
      </Button>
    </div>
  );
}

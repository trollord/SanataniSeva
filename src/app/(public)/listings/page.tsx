import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Houses & Flats in Hiranandani Estate, Thane - Rent & Buy",
  description:
    "Browse verified houses and flats for rent and sale across Hiranandani Estate, Hiranandani Meadows, Rodas Enclave and One Hiranandani Park in Thane. Direct owner contact, zero brokerage.",
  alternates: { canonical: "/listings" },
};
import FilterPanel from "@/components/search/FilterPanel";
import ListingsContent from "@/components/property/ListingsContent";
import WelcomeTour from "@/components/tour/WelcomeTour";

export default function ListingsPage() {
  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <WelcomeTour />
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">

        {/* Filter Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div
            data-tour="filters"
            className="bg-white rounded-xl p-5 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto"
            style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}
          >
            <Suspense fallback={<div className="h-96 animate-pulse bg-[#f2f4f4] rounded-lg" />}>
              <FilterPanel />
            </Suspense>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                    <div className="h-48 sm:h-56 bg-zinc-100" />
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="h-4 bg-zinc-100 rounded w-3/4" />
                      <div className="h-3 bg-zinc-50 rounded w-1/2" />
                      <div className="h-5 bg-zinc-100 rounded w-1/3 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <ListingsContent />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

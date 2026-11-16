import type { Metadata } from "next";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import PromotionSpotlight from "@/components/promotions/PromotionSpotlight";
import PromotionsBrowser, { type PromotionCategory } from "@/components/promotions/PromotionsBrowser";
import { CONTACT_PHONE } from "@/lib/constants";
import { getDirectoryCategories } from "@/lib/directory-categories";
import { getLivePromotions } from "@/lib/promotions-data";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Promotions - Local businesses in Hiranandani Estate",
  description:
    "Offers and introductions from local businesses serving Hiranandani Estate, Thane. Call or WhatsApp them directly.",
  alternates: { canonical: "/promotions" },
};

// Which promotions are live depends on today's date in IST, so the page is
// rendered per request; the rows themselves come from a tagged cache.
export const dynamic = "force-dynamic";

const PF = "font-[family-name:var(--font-playfair)]";

export default async function PromotionsPage() {
  const [promotions, directory] = await Promise.all([getLivePromotions(), getDirectoryCategories()]);

  const inUse = new Set(promotions.map((p) => p.categoryKey));
  const categories: PromotionCategory[] = directory
    .filter((c) => inUse.has(c.key))
    .map(({ key, label, icon }) => ({ key, label, icon }));
  const categoryLabels = Object.fromEntries(directory.map((c) => [c.key, c.label]));
  const spotlight = promotions.filter((p) => p.spotlight);

  return (
    <div className="bg-[#FAF8F5] text-[#1C1C1C]">
      <div className="px-4 pt-24 pb-12 sm:px-8 sm:pt-32 sm:pb-16">
        <div className="mx-auto max-w-5xl">
          {/* ── Heading ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C8541A]" />
            <h1 className={`${PF} text-3xl font-bold leading-tight sm:text-4xl`}>Promotions</h1>
          </div>
          <p className="ml-[22px] mt-1 text-sm text-[#9E6B3F] sm:text-base">
            Local businesses serving the estate, and their offers for residents
          </p>

          {spotlight.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <PromotionSpotlight items={spotlight} categoryLabels={categoryLabels} />
            </div>
          )}

          <div className="mt-8 sm:mt-10">
            <PromotionsBrowser promotions={promotions} categories={categories} />
          </div>
        </div>
      </div>

      {/* ── Closing band ──────────────────────────────────────────────── */}
      <section className="px-4 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 rounded-2xl border border-[#EDE5D8] bg-[#F0E9DF] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="min-w-0">
            <h2 className={`${PF} text-2xl font-bold leading-tight sm:text-3xl`}>
              Own a business in the estate? Promote it here
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B] sm:text-base">
              Put your shop in front of Hiranandani Estate residents. Message us and we will set it up.
            </p>
          </div>
          <a
            href={whatsAppContactUrl(
              CONTACT_PHONE,
              "Hi Sanatani Seva, I'd like to promote my business on the Promotions page."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#1C1C1C] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8541A]"
          >
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
            WhatsApp us
          </a>
        </div>
      </section>
    </div>
  );
}

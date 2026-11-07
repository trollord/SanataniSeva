import type { Metadata } from "next";
import { Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CommunityDirectory from "@/components/community/CommunityDirectory";
import CommunityHero from "@/components/community/CommunityHero";
import BusTimings from "@/components/community/BusTimings";
import CommunityTabs from "@/components/community/CommunityTabs";
import { type DbCommunityContact } from "@/lib/community";

// 60s, not an hour: the bus section highlights the *next* departure against
// the current time, so an hour-old render would point at a bus that has
// already gone. The vendor directory tolerates the shorter window fine.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Community Directory - Local Vendors & Services in Hiranandani Estate",
  description:
    "Phone numbers and contact details for carpenters, plumbers, electricians, shopkeepers, tiffin services and other trusted local vendors serving Hiranandani Estate, Thane.",
  keywords: [
    "carpenter in Hiranandani Estate",
    "plumber Hiranandani Estate Thane",
    "electrician Hiranandani Estate",
    "local services Hiranandani Estate",
    "shops in Hiranandani Estate Thane",
    "tiffin service Hiranandani Estate",
    "pest control Thane",
  ],
  alternates: { canonical: "/community" },
};

export default async function CommunityPage() {
  const raw = await prisma.communityContact.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      category: true,
      service: true,
      phones: true,
      whatsapp: true,
      locality: true,
      address: true,
      hours: true,
      tags: true,
      verified: true,
      createdAt: true,
    },
  });

  // A card with no number has nothing to act on, so it is not shown. The
  // numberless rows are already PENDING, but this keeps that true even if one
  // is published by mistake.
  const dbContacts: DbCommunityContact[] = raw
    .filter((c) => c.phones.length > 0)
    .map((c) => ({ ...c, contactPerson: c.contactPerson ?? null }));

  // Only offer the bus tab when there is at least one published route.
  const busRouteCount = await prisma.busRoute.count({ where: { active: true } });

  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <CommunityHero />

        {/* ── Directory + buses, as sub-tabs ──────────────────────────────── */}
        <CommunityTabs
          busesAvailable={busRouteCount > 0}
          directory={<CommunityDirectory dbContacts={dbContacts} />}
          buses={<BusTimings />}
        />

        {/* ── Disclaimer — always shown ───────────────────────────────────── */}
        <p className="flex items-start gap-2 text-[11px] sm:text-xs text-gray-400 leading-relaxed mt-10 sm:mt-14">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            Listings are contributed by residents and are not vetted by us.
            Sanatani Seva does not employ or endorse the vendors listed here;
            please verify credentials and agree charges before hiring. Spotted a
            wrong number? Let us know and we will correct it.
          </span>
        </p>

      </div>
    </div>
  );
}

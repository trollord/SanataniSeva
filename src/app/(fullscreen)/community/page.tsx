import type { Metadata } from "next";
import { Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CommunityDirectory from "@/components/community/CommunityDirectory";
import CommunityHero from "@/components/community/CommunityHero";
import BusTimings from "@/components/community/BusTimings";
import EmergencyNumbers from "@/components/community/EmergencyNumbers";
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

  // The directory's own emergency category, also offered as a tab of its own.
  const emergencyContacts = dbContacts.filter((c) => c.category === "emergency");

  // Only offer the bus tab when there is at least one published route.
  const busRouteCount = await prisma.busRoute.count({ where: { active: true } });

  return (
    // Below lg the page scrolls as a normal document: a phone cannot show the
    // filter rail, the chrome and a useful number of rows at once. From lg up
    // the screen is exactly one viewport and the panes scroll themselves.
    <div className="flex flex-1 flex-col min-h-0 px-5 sm:px-8 pt-24 pb-16 md:pt-20 md:pb-4">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col min-h-0 min-w-0">

        {/* ── Header + directory/buses/emergency tabs, sharing one row ──────────────── */}
        <CommunityTabs
          heading={<CommunityHero />}
          busesAvailable={busRouteCount > 0}
          directory={<CommunityDirectory dbContacts={dbContacts} />}
          buses={<BusTimings />}
          emergencyAvailable={emergencyContacts.length > 0}
          emergency={<EmergencyNumbers contacts={emergencyContacts} />}
        />

        {/* ── Disclaimer — always shown ───────────────────────────────────── */}
        <p className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed mt-5 md:mt-3 shrink-0">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            Listings are contributed by residents and are not vetted by us.
            Sanatani Seva does not employ or endorse the vendors listed here;
            please verify credentials and agree charges before hiring.
            <span className="hidden lg:inline">
              {" "}Spotted a wrong number? Let us know and we will correct it.
            </span>
          </span>
        </p>

      </div>
    </div>
  );
}

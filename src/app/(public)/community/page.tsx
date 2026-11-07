import type { Metadata } from "next";
import { Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import CommunityDirectory from "@/components/community/CommunityDirectory";
import CommunityHero from "@/components/community/CommunityHero";
import AddContactModal from "@/components/community/AddContactModal";
import { type DbCommunityContact } from "@/lib/community";

export const revalidate = 3600;

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
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const raw = await prisma.communityContact.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      category: true,
      service: true,
      phone: true,
      whatsapp: true,
      locality: true,
      address: true,
      hours: true,
      tags: true,
      verified: true,
      createdAt: true,
    },
  });

  const dbContacts: DbCommunityContact[] = raw.map((c) => ({
    ...c,
    contactPerson: c.contactPerson ?? null,
  }));

  const isUsingSampleData = dbContacts.length === 0;

  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <CommunityHero isAdmin={isAdmin} />

        {/* ── Directory ───────────────────────────────────────────────────── */}
        <CommunityDirectory dbContacts={dbContacts} />

        {/* ── Sample-data notice (only when no real data) ─────────────────── */}
        {isUsingSampleData && (
          <p className="flex items-start gap-2 text-[11px] sm:text-xs text-gray-400 leading-relaxed mt-10 sm:mt-14">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              This directory currently shows sample entries - names and phone
              numbers are placeholders while we collect and verify real listings
              from residents. Sanatani Community does not employ or endorse the vendors
              listed here; please verify credentials before hiring.
            </span>
          </p>
        )}

        {/* ── CTA — admin only ─────────────────────────────────────────── */}
        {isAdmin && (
          <div className="bg-[#1C0A00] rounded-2xl p-6 sm:p-10 mt-8 sm:mt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3">
              Know someone reliable?
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-3xl font-bold text-white mb-3">
              Add a vendor to the directory
            </h2>
            <p className="text-white/45 text-xs sm:text-sm leading-relaxed max-w-lg mb-6">
              If you have a carpenter, electrician or shopkeeper you trust, send
              us their details and we will verify and list them for the
              community.
            </p>
            <AddContactModal />
          </div>
        )}
      </div>
    </div>
  );
}

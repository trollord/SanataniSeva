export const dynamic = "force-dynamic";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import NewsBannerStrip from "@/components/newspaper/NewsBannerStrip";
import EstateGallery from "@/components/home-v2/EstateGallery";
import HomeMasthead from "@/components/home/HomeMasthead";
import HomeRemit from "@/components/home/HomeRemit";
import HomeEntryHousing from "@/components/home/HomeEntryHousing";
import HomeEntryServices from "@/components/home/HomeEntryServices";
import HomeMarketDiptych from "@/components/home/HomeMarketDiptych";
import HomeEntryNewspaper from "@/components/home/HomeEntryNewspaper";
import HomeClosing from "@/components/home/HomeClosing";

const getHomeData = unstable_cache(
  async () => {
    const [stats, marketplaceItems, newsItems] = await Promise.all([
      Promise.all([
        prisma.property.count({ where: { status: "ACTIVE" } }),
        prisma.inquiry.count({ where: { status: "COMPLETED" } }),
        prisma.user.count({ where: { role: "OWNER" } }),
      ]),
      prisma.item.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          title: true,
          price: true,
          category: true,
          images: {
            select: { url: true, isPrimary: true },
            orderBy: { isPrimary: "desc" },
            take: 1,
          },
        },
      }),
      prisma.newsItem.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { headline: true, category: true },
      }),
    ]);
    return { stats, marketplaceItems, newsItems };
  },
  ["home-data"],
  { revalidate: 60 },
);

export default async function HomeV2Page() {
  const { stats, marketplaceItems, newsItems } = await getHomeData();
  // completedDeals is intentionally skipped and never rendered.
  const [activeListings, , owners] = stats;

  // Trade index for ENTRY 02, counted off the published directory. Grouping in
  // the DB rather than loading every contact just to length-check it.
  const grouped = await prisma.communityContact.groupBy({
    by: ["category"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  const countByCategory = new Map(grouped.map((g) => [g.category, g._count._all]));
  const trades = COMMUNITY_CATEGORIES.map((c) => ({
    label: c.label,
    count: countByCategory.get(c.key) ?? 0,
  })).filter((t) => t.count > 0);
  const totalContacts = grouped.reduce((n, g) => n + g._count._all, 0);

  return (
    <div className="bg-[#FAF8F5] text-[#1C1C1C]">
      <NewsBannerStrip items={newsItems} />
      <HomeMasthead hasNews={newsItems.length > 0} />
      <HomeRemit />
      <HomeEntryHousing activeListings={activeListings} owners={owners} />
      {/* Renders the photo mosaic when the files exist in public/images, and
          nothing at all when they do not — in every environment. The numbered
          entry sequence reads Entry 01 → Entry 02 either way. */}
      <EstateGallery />
      <HomeEntryServices trades={trades} totalContacts={totalContacts} />
      <HomeMarketDiptych items={marketplaceItems} />
      <HomeEntryNewspaper />
      <HomeClosing />
    </div>
  );
}

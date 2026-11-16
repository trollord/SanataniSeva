import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { istToday } from "@/lib/bus";
import { getDirectoryCategories } from "@/lib/directory-categories";
import { dateToYmd, promotionStatus } from "@/lib/promotions";
import PromotionsAdminClient, { type PromotionAdminRow } from "./PromotionsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Straight from the database rather than the public cache: this is where
  // promotions are edited, and it lists the hidden ones too.
  const [rows, categories] = await Promise.all([
    prisma.promotion.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    getDirectoryCategories(),
  ]);

  const today = istToday();
  const label = new Map(categories.map((c) => [c.key, c.label]));

  const promotions: PromotionAdminRow[] = rows.map((p) => {
    const startsOn = dateToYmd(p.startsAt);
    const endsOn = dateToYmd(p.endsAt);
    return {
      id: p.id,
      slug: p.slug,
      status: promotionStatus({ hidden: p.hidden, startsOn, endsOn }, today),
      hidden: p.hidden,
      categoryLabel: p.categoryKey ? (label.get(p.categoryKey) ?? p.categoryKey) : null,
      thumbUrl: p.imageUrls[0] ?? p.logoUrl,
      // The form edits strings; "" is "not set".
      form: {
        name: p.name,
        tagline: p.tagline,
        categoryKey: p.categoryKey ?? "",
        offer: p.offer ?? "",
        description: p.description,
        phone: p.phone ?? "",
        whatsapp: p.whatsapp,
        website: p.website ?? "",
        instagram: p.instagram ?? "",
        address: p.address ?? "",
        locality: p.locality ?? "",
        hours: p.hours ?? "",
        logoUrl: p.logoUrl ?? "",
        imageUrls: p.imageUrls,
        spotlight: p.spotlight,
        startsOn: startsOn ?? "",
        endsOn: endsOn ?? "",
      },
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PromotionsAdminClient
        promotions={promotions}
        categories={categories.map((c) => ({ value: c.key, label: c.label }))}
      />
    </div>
  );
}

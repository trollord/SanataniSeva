import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CategoriesAdminClient, { type CategoryAdminView } from "./CategoriesAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Straight from the database rather than the cached loader: this is where
  // categories are edited, so it must show the write that just happened.
  // Counts cover every status, because any contact blocks a delete.
  const [categories, byCategory, bySubcategory] = await Promise.all([
    prisma.directoryCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        key: true,
        label: true,
        icon: true,
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          select: { id: true, label: true },
        },
      },
    }),
    prisma.communityContact.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.communityContact.groupBy({
      by: ["subcategoryId"],
      where: { subcategoryId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const categoryCount = new Map(byCategory.map((g) => [g.category, g._count._all]));
  const subcategoryCount = new Map(bySubcategory.map((g) => [g.subcategoryId, g._count._all]));

  const view: CategoryAdminView[] = categories.map((c) => ({
    ...c,
    contacts: categoryCount.get(c.key) ?? 0,
    subcategories: c.subcategories.map((s) => ({ ...s, contacts: subcategoryCount.get(s.id) ?? 0 })),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CategoriesAdminClient categories={view} />
    </div>
  );
}

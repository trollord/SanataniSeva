import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import DashboardListings from "./DashboardListings";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Plain users have no listings - send them to their interests page
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard/interests");
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      listingType: true,
      status: true,
      locality: true,
      building: true,
      bedrooms: true,
      areaSqft: true,
      price: true,
      deposit: true,
      rentNegotiable: true,
      lockInMonths: true,
      createdAt: true,
      activatedAt: true,
      closedAt: true,
      images: {
        select: { url: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
        take: 1,
      },
      _count: { select: { inquiries: true } },
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your property listings on Sanatani Community
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add New Listing
          </Button>
        </Link>
      </div>

      <DashboardListings properties={properties} />
    </div>
  );
}

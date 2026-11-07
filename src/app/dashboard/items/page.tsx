import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, PackageOpen, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils/formatters";
import {
  ITEM_CATEGORY_LABELS,
  VEHICLE_TYPE_LABELS,
  ITEM_CONDITION_LABELS,
} from "@/lib/constants";
import DeleteItemButton from "./DeleteItemButton";
import MarkSoldButton from "./MarkSoldButton";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SOLD: "bg-gray-100 text-gray-700 border-gray-200",
  CLOSED: "bg-gray-100 text-gray-500 border-gray-200",
};

export default async function MyItemsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const items = await prisma.item.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      vehicleType: true,
      condition: true,
      status: true,
      price: true,
      priceNegotiable: true,
      createdAt: true,
      images: {
        select: { url: true, isPrimary: true },
        orderBy: { isPrimary: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
          <p className="text-sm text-gray-500 mt-1">
            Items you&apos;ve listed on the marketplace
          </p>
        </div>
        <Link href="/dashboard/items/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" /> Sell an item
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-14 text-center">
          <PackageOpen className="w-10 h-10 mx-auto text-gray-300 mb-4" />
          <h2 className="text-base font-semibold text-gray-900">
            Nothing listed yet
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Have furniture, electronics or a vehicle to sell? Post it in a few
            minutes and reach every resident of the estate.
          </p>
          <Link href="/dashboard/items/new" className="inline-block mt-5">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" /> Sell your first item
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const img = item.images[0];
            const categoryLabel =
              ITEM_CATEGORY_LABELS[item.category] ?? item.category;
            const vehicleLabel = item.vehicleType
              ? VEHICLE_TYPE_LABELS[item.vehicleType]
              : null;
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
              >
                <div className="relative w-full sm:w-28 h-28 shrink-0 bg-[#F5F5F5] rounded-xl overflow-hidden">
                  {img ? (
                    <Image
                      src={img.url}
                      alt={item.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-400">
                      No photo
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Chip>{vehicleLabel ?? categoryLabel}</Chip>
                        <Chip>
                          {ITEM_CONDITION_LABELS[item.condition] ?? item.condition}
                        </Chip>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border ${
                        STATUS_STYLES[item.status] ?? ""
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(item.price)}
                        {item.priceNegotiable && (
                          <span className="font-normal text-xs text-gray-500 ml-1.5">
                            · Negotiable
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Posted {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {item.status === "ACTIVE" && (
                        <>
                          <Link href={`/marketplace/${item.id}`} target="_blank">
                            <Button size="sm" variant="outline" className="gap-1.5 px-2.5 sm:px-3">
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <MarkSoldButton itemId={item.id} />
                        </>
                      )}
                      <Link href={`/dashboard/items/${item.id}/edit`}>
                        <Button size="sm" variant="outline" className="gap-1.5 px-2.5 sm:px-3">
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                      <DeleteItemButton itemId={item.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500 bg-[#EBEBEB] px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

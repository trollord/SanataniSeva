import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils/formatters";
import {
  ITEM_CATEGORY_LABELS,
  VEHICLE_TYPE_LABELS,
  ITEM_CONDITION_LABELS,
} from "@/lib/constants";
import ItemAdminActions from "./ItemAdminActions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-gray-200 text-gray-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminItemsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const filters = await searchParams;
  const statusFilter = filters.status ?? "PENDING";

  const items = await prisma.item.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      category: true,
      vehicleType: true,
      condition: true,
      status: true,
      price: true,
      createdAt: true,
      pickupLocality: true,
      seller: { select: { name: true, email: true } },
    },
  });

  const tabs = ["PENDING", "ACTIVE", "SOLD", "CLOSED", "ALL"];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Marketplace Items
      </h1>

      <div className="flex gap-1 mb-5 sm:mb-6 bg-gray-100 rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/admin/items?status=${tab}`}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p>No items with status: {statusFilter}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Item</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Seller</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Price</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Posted</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const categoryLabel =
                  ITEM_CATEGORY_LABELS[item.category] ?? item.category;
                const vehicleLabel = item.vehicleType
                  ? VEHICLE_TYPE_LABELS[item.vehicleType]
                  : null;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 cursor-pointer group">
                    <td className="px-4 py-3">
                      <Link
                        href={`/marketplace/${item.id}`}
                        target="_blank"
                        className="font-medium text-gray-900 group-hover:text-blue-600 group-hover:underline underline-offset-2 transition-colors"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {vehicleLabel ?? categoryLabel} ·{" "}
                        {ITEM_CONDITION_LABELS[item.condition] ?? item.condition} ·{" "}
                        {item.pickupLocality}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                      <p className="font-medium text-gray-900 text-sm">
                        {item.seller.name ?? "-"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
                        {item.seller.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 hidden sm:table-cell">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full ${
                          STATUS_STYLES[item.status] ?? ""
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <ItemAdminActions itemId={item.id} status={item.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

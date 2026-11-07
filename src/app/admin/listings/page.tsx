import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice, formatDate, turnaroundDays } from "@/lib/utils/formatters";
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/lib/constants";
import type { PropertyFilters } from "@/types/property";
import ListingActions from "./ListingActions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  INACTIVE: "bg-gray-100 text-gray-600",
  DELETE_REQUESTED: "bg-red-100 text-red-700",
};

interface PageProps {
  searchParams: Promise<PropertyFilters & { status?: string }>;
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !["ADMIN"].includes(session.user.role ?? "")) {
    redirect("/login");
  }

  const filters = await searchParams;
  const statusFilter = filters.status ?? "PENDING";

  const properties = await prisma.property.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter as never },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      type: true,
      listingType: true,
      locality: true,
      bedrooms: true,
      price: true,
      status: true,
      createdAt: true,
      activatedAt: true,
      closedAt: true,
      views: true,
      owner: { select: { name: true } },
    },
  });

  const tabs = ["PENDING", "ACTIVE", "INACTIVE", "REJECTED", "DELETE_REQUESTED", "ALL"];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Listings</h1>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 sm:mb-6 bg-gray-100 rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/admin/listings?status=${tab}`}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "ALL" ? "All" : tab === "DELETE_REQUESTED" ? "Delete Requests" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-gray-400">
          <p>No listings with status: {statusFilter}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <Link href={`/admin/listings/${p.id}`} className="block">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{p.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${STATUS_STYLES[p.status] ?? ""}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    {PROPERTY_TYPE_LABELS[p.type] ?? p.type} · {LISTING_TYPE_LABELS[p.listingType] ?? p.listingType}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {p.locality} · {p.owner.name ?? "-"}
                    {p.status === "ACTIVE" && turnaroundDays(p.activatedAt) !== null && ` · Live ${turnaroundDays(p.activatedAt)}d`}
                    {p.closedAt && turnaroundDays(p.activatedAt, p.closedAt) !== null && ` · Closed in ${turnaroundDays(p.activatedAt, p.closedAt)}d`}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{formatPrice(p.price)}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(p.createdAt)}</span>
                  </div>
                </Link>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <ListingActions propertyId={p.id} status={p.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Property</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Locality</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Submitted</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Turnaround</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        {p.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {PROPERTY_TYPE_LABELS[p.type] ?? p.type}
                        <span className="ml-1 text-xs">({LISTING_TYPE_LABELS[p.listingType] ?? p.listingType})</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.locality}</td>
                      <td className="px-4 py-3 text-gray-700">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{p.owner.name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell whitespace-nowrap">
                        {p.status === "ACTIVE" && turnaroundDays(p.activatedAt) !== null
                          ? `Live ${turnaroundDays(p.activatedAt)}d`
                          : p.closedAt && turnaroundDays(p.activatedAt, p.closedAt) !== null
                          ? `Closed in ${turnaroundDays(p.activatedAt, p.closedAt)}d`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] ?? ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ListingActions propertyId={p.id} status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/listings/${p.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils/formatters";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import CommunityAdminActions from "./CommunityAdminActions";
import CommunityCSVTools from "./CommunityCSVTools";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

const CATEGORY_MAP = Object.fromEntries(
  COMMUNITY_CATEGORIES.map((c) => [c.key, c.label])
);

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminCommunityPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const filters = await searchParams;
  const statusFilter = filters.status ?? "PENDING";

  const contacts = await prisma.communityContact.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tabs = ["PENDING", "ACTIVE", "REJECTED", "ALL"];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Community Directory
      </h1>

      <CommunityCSVTools />

      <div className="flex gap-1 mb-5 sm:mb-6 bg-gray-100 rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/admin/community?status=${tab}`}
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

      {contacts.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p>No contacts with status: {statusFilter}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Contact</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Submitted</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                      {c.service}
                    </p>
                    {c.submittedBy && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        by {c.submittedBy}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                    <p className="text-sm">{CATEGORY_MAP[c.category] ?? c.category}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.locality}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium hidden sm:table-cell">
                    {c.phone}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full ${
                        STATUS_STYLES[c.status] ?? ""
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CommunityAdminActions
                      contactId={c.id}
                      status={c.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

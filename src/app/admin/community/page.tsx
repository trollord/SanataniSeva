import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils/formatters";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import CommunityAdminActions from "./CommunityAdminActions";
import CommunityCSVTools from "./CommunityCSVTools";
import ContactFormDialog from "./ContactFormDialog";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

const CATEGORY_MAP = Object.fromEntries(
  COMMUNITY_CATEGORIES.map((c) => [c.key, c.label])
);

/** Small enough to render fast, large enough to scan. */
const PER_PAGE = 50;

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminCommunityPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const filters = await searchParams;
  const statusFilter = filters.status ?? "PENDING";
  const where = statusFilter === "ALL" ? {} : { status: statusFilter };

  const total = await prisma.communityContact.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  // Clamped: a stale ?page= from a previous filter would otherwise show an
  // empty table with no hint that the rows are elsewhere.
  const page = Math.min(Math.max(1, Number(filters.page) || 1), pageCount);

  const contacts = await prisma.communityContact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  const tabs = ["PENDING", "ACTIVE", "REJECTED", "ALL"];
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Community Directory
        </h1>
        <ContactFormDialog />
      </div>

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
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
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
                      {c.phones.length === 0 ? (
                        <span className="text-xs font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          No number
                        </span>
                      ) : (
                        c.phones.map((p) => (
                          <p key={p} className="whitespace-nowrap">
                            {p}
                          </p>
                        ))
                      )}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ContactFormDialog
                          contact={{
                            id: c.id,
                            name: c.name,
                            contactPerson: c.contactPerson,
                            category: c.category,
                            service: c.service,
                            phones: c.phones,
                            whatsapp: c.whatsapp,
                            locality: c.locality,
                            address: c.address,
                            hours: c.hours,
                            verified: c.verified,
                            status: c.status,
                            notes: c.notes,
                          }}
                        />
                        <CommunityAdminActions contactId={c.id} status={c.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Row count and pager - without these the table silently truncated */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <p className="text-xs text-gray-500">
              Showing {from}–{to} of {total}
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <PagerLink
                  status={statusFilter}
                  page={page - 1}
                  disabled={page === 1}
                  label="Previous"
                />
                <span className="text-xs text-gray-500 px-2">
                  Page {page} of {pageCount}
                </span>
                <PagerLink
                  status={statusFilter}
                  page={page + 1}
                  disabled={page === pageCount}
                  label="Next"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PagerLink({
  status,
  page,
  disabled,
  label,
}: {
  status: string;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-1.5 text-xs font-medium text-gray-300 border border-gray-200 rounded-md cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/admin/community?status=${status}&page=${page}`}
      className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
    >
      {label}
    </Link>
  );
}

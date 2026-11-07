import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session || !["ADMIN"].includes(session.user.role ?? "")) {
    redirect("/login");
  }

  const [
    pendingCount,
    rejectedCount,
    activeCount,
    totalUsers,
    totalOwners,
    totalInterests,
    byType,
    byLocality,
    recentVerifications,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.property.count({ where: { status: "REJECTED" } }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.inquiry.count(),
    prisma.property.groupBy({ by: ["type"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.property.groupBy({ by: ["locality"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
    prisma.adminVerification.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        action: true,
        createdAt: true,
        notes: true,
        admin: { select: { name: true } },
        property: { select: { title: true } },
      },
    }),
  ]);

  const maxTypeCount = byType.length > 0 ? Math.max(...byType.map((t) => t._count.id)) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#FAF8F5] min-h-full">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Overview</h1>

      {/* Row 1 - Action needed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Link href="/admin/listings?status=PENDING" className="group">
          <div className="bg-white rounded-xl border border-amber-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Pending Review</p>
            <p className="text-3xl sm:text-4xl font-bold text-amber-500 mb-1">{pendingCount}</p>
            <p className="text-sm text-gray-500 group-hover:text-[#FF5F15] transition-colors">View listings →</p>
          </div>
        </Link>
        <div className="bg-white rounded-xl border border-red-200 p-4 sm:p-6">
          <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Rejected Listings</p>
          <p className="text-3xl sm:text-4xl font-bold text-red-500 mb-1">{rejectedCount}</p>
          <p className="text-sm text-gray-500">Total rejected</p>
        </div>
      </div>

      {/* Row 2 - Platform health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: "Active Listings", value: activeCount, color: "text-green-600" },
          { label: "Total Users", value: totalUsers, color: "text-gray-900" },
          { label: "Property Owners", value: totalOwners, color: "text-gray-900" },
          { label: "Interests Registered", value: totalInterests, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <p className={`text-2xl sm:text-3xl font-bold ${color} mb-1`}>{value}</p>
            <p className="text-xs sm:text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Row 3 - Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* By Property Type */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">By Property Type</h2>
          {byType.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
          <div className="space-y-3">
            {byType.map((t) => (
              <div key={t.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{PROPERTY_TYPE_LABELS[t.type] ?? t.type}</span>
                  <span className="font-semibold text-gray-900">{t._count.id}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FF5F15]"
                    style={{ width: `${(t._count.id / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Localities */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">Top Localities</h2>
          {byLocality.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
          <div className="space-y-3">
            {byLocality.map((l, i) => (
              <div key={l.locality} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#FF5F15] w-4">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{l.locality}</span>
                <span className="text-sm font-semibold text-gray-900">{l._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">Recent Activity</h2>
          {recentVerifications.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
          <div className="space-y-4">
            {recentVerifications.map((v, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                    v.action === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {v.action}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(v.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{v.property?.title ?? "Unknown property"}</p>
                <p className="text-xs text-gray-400">by {v.admin?.name ?? "Admin"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suppress unused import warning */}
      <span className="hidden">{formatDate(new Date())}</span>
    </div>
  );
}

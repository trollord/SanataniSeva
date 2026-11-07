import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Home,
  Eye,
  MessageSquare,
  Timer,
  CheckCircle2,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { formatDate, turnaroundDays } from "@/lib/utils/formatters";
import TrendsChart, { type DailyPoint } from "./TrendsChart";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const since30 = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalUsers,
    newUsers30,
    owners,
    propsByStatus,
    newProps30,
    inquiriesTotal,
    inquiriesByStatus,
    inquiries30,
    viewsAgg,
    closedProps,
    topProperties,
    daily,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.property.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.property.count({ where: { createdAt: { gte: since30 } } }),
    prisma.inquiry.count(),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inquiry.count({ where: { createdAt: { gte: since30 } } }),
    prisma.property.aggregate({ _sum: { views: true } }),
    prisma.property.findMany({
      where: { activatedAt: { not: null }, closedAt: { not: null } },
      select: { activatedAt: true, closedAt: true },
    }),
    prisma.property.findMany({
      orderBy: { views: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        views: true,
        activatedAt: true,
        closedAt: true,
        createdAt: true,
        _count: { select: { inquiries: true } },
      },
    }),
    prisma.$queryRaw<
      { day: Date; users: bigint; properties: bigint; inquiries: bigint }[]
    >`
      SELECT gs.day::date AS day,
        (SELECT COUNT(*) FROM "User" u
          WHERE u."createdAt" >= gs.day AND u."createdAt" < gs.day + interval '1 day') AS users,
        (SELECT COUNT(*) FROM "Property" p
          WHERE p."createdAt" >= gs.day AND p."createdAt" < gs.day + interval '1 day') AS properties,
        (SELECT COUNT(*) FROM "Inquiry" i
          WHERE i."createdAt" >= gs.day AND i."createdAt" < gs.day + interval '1 day') AS inquiries
      FROM generate_series(
        date_trunc('day', now()) - interval '29 days',
        date_trunc('day', now()),
        interval '1 day'
      ) AS gs(day)
      ORDER BY day
    `,
  ]);

  const statusCount = (rows: { status: string; _count: { _all: number } }[], status: string) =>
    rows.find((r) => r.status === status)?._count._all ?? 0;

  const turnarounds = closedProps
    .map((p) => turnaroundDays(p.activatedAt, p.closedAt))
    .filter((d): d is number => d !== null);
  const avgTurnaround = turnarounds.length
    ? Math.round(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length)
    : null;

  const trend: DailyPoint[] = daily.map((d) => ({
    day: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    users: Number(d.users),
    properties: Number(d.properties),
    inquiries: Number(d.inquiries),
  }));

  return {
    totalUsers,
    newUsers30,
    owners,
    activeListings: statusCount(propsByStatus, "ACTIVE"),
    pendingListings: statusCount(propsByStatus, "PENDING"),
    closedListings: closedProps.length,
    totalProperties: propsByStatus.reduce((a, r) => a + r._count._all, 0),
    newProps30,
    inquiriesTotal,
    inquiries30,
    completedDeals: statusCount(inquiriesByStatus, "COMPLETED"),
    totalViews: viewsAgg._sum.views ?? 0,
    avgTurnaround,
    topProperties,
    trend,
  };
}

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const a = await getAnalytics();

  const kpis = [
    { label: "Total Users", value: a.totalUsers, sub: `+${a.newUsers30} in 30 days`, icon: Users },
    { label: "Property Owners", value: a.owners, sub: `${a.totalUsers - a.owners} seekers`, icon: UserPlus },
    { label: "Properties Listed", value: a.totalProperties, sub: `+${a.newProps30} in 30 days`, icon: Home },
    { label: "Active Right Now", value: a.activeListings, sub: `${a.pendingListings} pending review`, icon: TrendingUp },
    { label: "Property Views", value: a.totalViews, sub: "across all listings", icon: Eye },
    { label: "Interests Captured", value: a.inquiriesTotal, sub: `+${a.inquiries30} in 30 days`, icon: MessageSquare },
    { label: "Deals Completed", value: a.completedDeals, sub: `${a.closedListings} listings closed`, icon: CheckCircle2 },
    { label: "Avg Turnaround", value: a.avgTurnaround !== null ? `${a.avgTurnaround}d` : "-", sub: "live → booked/sold", icon: Timer },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform activity, growth and property performance
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {kpis.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
              <Icon className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* 30-day trends */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Last 30 days</h2>
        <TrendsChart data={a.trend} />
      </div>

      {/* Top properties */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-900 px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
          Top Properties by Views
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="text-left px-4 sm:px-6 py-2.5 font-medium text-gray-600">Property</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Views</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Interests</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden md:table-cell">Turnaround</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden lg:table-cell">Listed</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {a.topProperties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 max-w-[240px]">
                    <Link href={`/admin/listings/${p.id}`} className="font-medium text-gray-900 hover:underline line-clamp-1">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.views}</td>
                  <td className="px-4 py-3 text-gray-700">{p._count.inquiries}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell whitespace-nowrap">
                    {p.status === "ACTIVE" && turnaroundDays(p.activatedAt) !== null
                      ? `Live ${turnaroundDays(p.activatedAt)}d`
                      : p.closedAt && turnaroundDays(p.activatedAt, p.closedAt) !== null
                      ? `Closed in ${turnaroundDays(p.activatedAt, p.closedAt)}d`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                      p.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {a.topProperties.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

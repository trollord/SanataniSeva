import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  DAY_SHORT,
  dayOfWeekFor,
  formatTime,
  istToday,
  parseDays,
  parseList,
  resolveDay,
} from "@/lib/bus";
import BusAdminClient from "./BusAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminBusTimingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const today = istToday();

  const routes = await prisma.busRoute.findMany({
    orderBy: [{ sortOrder: "asc" }, { routeNumber: "asc" }],
    include: {
      schedules: { orderBy: { createdAt: "asc" } },
      exceptions: { orderBy: { startDate: "asc" } },
    },
  });

  // Pre-resolve today's view so admins see exactly what residents see.
  const view = routes.map((r) => ({
    id: r.id,
    routeNumber: r.routeNumber,
    name: r.name,
    origin: r.origin,
    destination: r.destination,
    via: r.via,
    operator: r.operator,
    note: r.note,
    active: r.active,
    sortOrder: r.sortOrder,
    schedules: r.schedules.map((s) => ({
      id: s.id,
      label: s.label,
      days: parseDays(s.daysOfWeek),
      times: parseList(s.times),
      validFrom: s.validFrom,
      validUntil: s.validUntil,
      active: s.active,
    })),
    exceptions: r.exceptions.map((e) => ({
      id: e.id,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      times: parseList(e.times),
      reason: e.reason,
    })),
    todayResolved: resolveDay(r.schedules, r.exceptions, today),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Bus Timings</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        Set a recurring series once — it runs all year. Use an override to change
        a single day or a short stretch without touching the series. Residents
        only ever see today, resolved in IST.
      </p>

      <BusAdminClient
        routes={view}
        today={today}
        todayLabel={DAY_SHORT[dayOfWeekFor(today)]}
        formatted={Object.fromEntries(
          view.flatMap((r) => r.todayResolved.times.map((t) => [t, formatTime(t)])),
        )}
      />
    </div>
  );
}

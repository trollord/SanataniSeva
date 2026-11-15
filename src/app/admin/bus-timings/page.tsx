import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { istToday, parseDays, parseList } from "@/lib/bus";
import BusAdminClient from "./BusAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminBusTimingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const today = istToday();

  const routes = await prisma.busRoute.findMany({
    orderBy: [{ sortOrder: "asc" }, { routeNumber: "asc" }],
    include: {
      schedules: { where: { active: true }, orderBy: { createdAt: "asc" } },
    },
  });

  const view = routes.map((r) => ({
    id: r.id,
    routeNumber: r.routeNumber,
    origin: r.origin,
    destination: r.destination,
    via: r.via,
    operator: r.operator,
    note: r.note,
    active: r.active,
    // What the card summarises and the edit form pre-fills. A series whose
    // old "valid until" has passed is skipped: residents no longer see it,
    // and re-saving the form would otherwise bring it back for good.
    timings: r.schedules
      .filter((s) => !s.validUntil || s.validUntil >= today)
      .map((s) => ({ days: parseDays(s.daysOfWeek), times: parseList(s.times) })),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <BusAdminClient routes={view} />
    </div>
  );
}

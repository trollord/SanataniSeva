import { Bus, CircleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  DAY_NAMES,
  dayOfWeekFor,
  formatTime,
  istNowTime,
  istToday,
  nextDeparture,
  resolveDay,
} from "@/lib/bus";

const PF = "font-[family-name:var(--font-playfair)]";

/**
 * Today's bus departures, read only.
 *
 * The full week lives in BusSchedule; residents only ever see the single day
 * they are standing in, resolved in Asia/Kolkata so the day does not roll over
 * at 05:30 IST on a UTC server.
 */
export default async function BusTimings() {
  const today = istToday();
  const nowTime = istNowTime();

  const routes = await prisma.busRoute.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { routeNumber: "asc" }],
    include: {
      schedules: { where: { active: true } },
      // Only the exceptions that could touch today.
      exceptions: { where: { startDate: { lte: today }, endDate: { gte: today } } },
    },
  });

  if (routes.length === 0) return null;

  const resolved = routes
    .map((route) => {
      const day = resolveDay(route.schedules, route.exceptions, today);
      return { route, day, next: nextDeparture(day.times, nowTime) };
    })
    // A route with no service today and no reason to show is just noise.
    .filter(({ day }) => day.times.length > 0 || day.reason);

  const dayName = DAY_NAMES[dayOfWeekFor(today)];

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-6 mb-6 sm:mb-8">
        <h2 className={`${PF} text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight`}>
          Today&apos;s departures
        </h2>
        <p className="text-[#6B6B6B] text-sm">
          {dayName} &middot; times shown in IST, updated by the estate office
        </p>
      </div>

      {resolved.length === 0 ? (
        <div className="border-t border-[#EDE5D8] py-10">
          <p className="text-[15px] font-semibold text-[#1C1C1C]">
            No buses are scheduled today.
          </p>
          <p className="text-sm text-[#6B6B6B] mt-1.5 max-w-prose">
            Services on this route run on other days of the week. Check back tomorrow,
            or contact the estate office for the current timetable.
          </p>
        </div>
      ) : (
      <div className="border-t border-[#EDE5D8]">
        {resolved.map(({ route, day, next }) => (
          <article
            key={route.id}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,15rem)_1fr] gap-3 md:gap-8 py-5 sm:py-6 border-b border-[#EDE5D8]"
          >
            {/* Identity */}
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[13px] font-bold text-[#C8541A] tabular-nums">
                  {route.routeNumber}
                </span>
                {route.operator && (
                  <span className="text-[11px] text-[#9E6B3F]">{route.operator}</span>
                )}
              </div>
              <h3 className="text-[15px] font-semibold text-[#1C1C1C] leading-snug mt-1">
                {route.origin} &rarr; {route.destination}
              </h3>
              {route.via && (
                <p className="text-xs text-[#6B6B6B] mt-0.5">via {route.via}</p>
              )}
            </div>

            {/* Today's times */}
            <div>
              {!day.running ? (
                <div className="flex items-start gap-2 text-[#9E6B3F]">
                  <CircleAlert className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.6} />
                  <p className="text-sm">
                    <span className="font-semibold text-[#1C1C1C]">No service today.</span>
                    {day.reason ? ` ${day.reason}` : ""}
                  </p>
                </div>
              ) : (
                <>
                  {day.reason && (
                    <p className="text-xs text-[#9E6B3F] mb-2.5">
                      <span className="font-semibold">Revised timings.</span> {day.reason}
                    </p>
                  )}
                  <ul className="flex flex-wrap gap-1.5">
                    {day.times.map((t) => {
                      const isNext = t === next;
                      const gone = !isNext && t < nowTime;
                      return (
                        <li
                          key={t}
                          className={`text-[13px] tabular-nums rounded-md px-2.5 py-1.5 border transition-colors ${
                            isNext
                              ? "bg-[#1C1C1C] text-white border-[#1C1C1C] font-semibold"
                              : gone
                                ? "bg-transparent text-[#6B6B6B]/55 border-[#EDE5D8]"
                                : "bg-white text-[#1C1C1C] border-[#EDE5D8]"
                          }`}
                          title={isNext ? "Next departure" : gone ? "Already departed" : undefined}
                        >
                          {formatTime(t)}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-xs text-[#6B6B6B] mt-2.5">
                    {next ? (
                      <>
                        Next bus <span className="font-semibold text-[#1C1C1C]">{formatTime(next)}</span>
                      </>
                    ) : (
                      <>Last bus for today has departed.</>
                    )}
                  </p>
                </>
              )}
              {route.note && (
                <p className="text-xs text-[#6B6B6B] mt-2 max-w-prose">{route.note}</p>
              )}
            </div>
          </article>
        ))}
      </div>
      )}

      <p className="flex items-start gap-2 text-xs text-[#6B6B6B] mt-4 max-w-prose">
        <Bus className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#9E6B3F]" strokeWidth={1.6} />
        Timings are published by the estate office and can change without notice.
        Please allow a few minutes either side.
      </p>
    </section>
  );
}

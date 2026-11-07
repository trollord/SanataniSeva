/**
 * Bus timetable resolution.
 *
 * A timetable is local clock time, not a set of instants: "06:15" means 06:15
 * on the platform in Thane, regardless of where the server runs. So times are
 * stored as "HH:MM" strings and dates as "YYYY-MM-DD" strings, and every
 * "what is today" question is answered in Asia/Kolkata. Vercel runs in UTC —
 * a naive new Date().getDay() would roll the day over at 05:30 IST and serve
 * the wrong day's timetable every morning.
 */

export const IST_TZ = "Asia/Kolkata";

/** Day names indexed 0=Sunday … 6=Saturday, matching getUTCDay(). */
export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** The calendar date in Thane right now, as "YYYY-MM-DD". */
export function istToday(now: Date = new Date()): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The wall-clock time in Thane right now, as "HH:MM" (24h). */
export function istNowTime(now: Date = new Date()): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  // en-GB renders midnight as "24" in some runtimes; normalise it.
  const hh = get("hour") === "24" ? "00" : get("hour");
  return `${hh}:${get("minute")}`;
}

/** 0=Sunday … 6=Saturday for a "YYYY-MM-DD" date, free of timezone drift. */
export function dayOfWeekFor(ymd: string): number {
  return new Date(`${ymd}T00:00:00Z`).getUTCDay();
}

/** Parses the JSON-in-string columns, never throwing on bad data. */
export function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parseDays(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v)
      ? v.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      : [];
  } catch {
    return [];
  }
}

/** "HH:MM" → minutes since midnight. Returns -1 for anything malformed. */
export function toMinutes(time: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return -1;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return -1;
  return h * 60 + min;
}

/** "06:15" → "6:15 am", for display. */
export function formatTime(time: string): string {
  const mins = toMinutes(time);
  if (mins < 0) return time;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** True when `ymd` falls inside an inclusive window; null bounds are open. */
function withinWindow(ymd: string, from: string | null, until: string | null): boolean {
  if (from && ymd < from) return false;
  if (until && ymd > until) return false;
  return true;
}

export const EXCEPTION_TYPES = ["CANCELLED", "REPLACED", "EXTRA"] as const;
export type ExceptionType = (typeof EXCEPTION_TYPES)[number];

export interface ScheduleInput {
  daysOfWeek: string;   // JSON array of 0-6
  times: string;        // JSON array of "HH:MM"
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
}

export interface ExceptionInput {
  type: string;
  startDate: string;
  endDate: string;
  times: string;        // JSON array of "HH:MM"
  reason: string | null;
}

export interface ResolvedDay {
  /** false when an exception cancels the service for this date. */
  running: boolean;
  /** Why it is cancelled, or why the times differ. */
  reason: string | null;
  /** Sorted, de-duplicated "HH:MM" departures for the date. */
  times: string[];
  /** True when an exception altered the usual timetable. */
  overridden: boolean;
}

/**
 * Resolves one route's timetable for a single date: the matching recurring
 * series, then any exception overlapping that date applied on top.
 *
 * CANCELLED wins outright. REPLACED swaps the series times for its own.
 * EXTRA adds to whatever is already running.
 */
export function resolveDay(
  schedules: ScheduleInput[],
  exceptions: ExceptionInput[],
  ymd: string,
): ResolvedDay {
  const dow = dayOfWeekFor(ymd);

  const base = schedules
    .filter((s) => s.active)
    .filter((s) => parseDays(s.daysOfWeek).includes(dow))
    .filter((s) => withinWindow(ymd, s.validFrom, s.validUntil))
    .flatMap((s) => parseList(s.times));

  const active = exceptions.filter(
    (e) => ymd >= e.startDate && ymd <= e.endDate,
  );

  const cancelled = active.find((e) => e.type === "CANCELLED");
  if (cancelled) {
    return { running: false, reason: cancelled.reason ?? null, times: [], overridden: true };
  }

  const replaced = active.find((e) => e.type === "REPLACED");
  const extras = active.filter((e) => e.type === "EXTRA").flatMap((e) => parseList(e.times));

  const combined = replaced ? [...parseList(replaced.times), ...extras] : [...base, ...extras];

  const times = Array.from(new Set(combined))
    .filter((t) => toMinutes(t) >= 0)
    .sort((a, b) => toMinutes(a) - toMinutes(b));

  const overridden = Boolean(replaced) || extras.length > 0;
  const reason = replaced?.reason ?? active.find((e) => e.reason)?.reason ?? null;

  return { running: times.length > 0, reason, times, overridden };
}

/** The first departure at or after `nowTime`, or null once the day is done. */
export function nextDeparture(times: string[], nowTime: string): string | null {
  const now = toMinutes(nowTime);
  return times.find((t) => toMinutes(t) >= now) ?? null;
}

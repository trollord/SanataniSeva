import { DAY_SHORT, daysLabel, toMinutes } from "@/lib/bus";

const TIME_SEPARATORS = /[\s,;\n]+/;

/** "6:15", "06.15", "0615" → "06:15"; null for anything that is not a clock time. */
function normaliseTime(token: string): string | null {
  const m = /^(\d{1,2})[:.]?(\d{2})$/.exec(token);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function timeTokens(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw.split(TIME_SEPARATORS).map((t) => t.trim()).filter(Boolean);
}

/** Accepts "06:15, 7:00  18.45" and similar human input. */
export function parseTimesInput(raw: unknown): string[] {
  return Array.from(
    new Set(
      timeTokens(raw)
        .map(normaliseTime)
        .filter((t): t is string => t !== null),
    ),
  ).sort((a, b) => toMinutes(a) - toMinutes(b));
}

/**
 * The tokens parseTimesInput would drop. Surfaced as an error rather than
 * ignored, so a typo like "7:5" cannot silently remove a departure.
 */
export function invalidTimeTokens(raw: unknown): string[] {
  return timeTokens(raw).filter((t) => normaliseTime(t) === null);
}

export function parseDaysInput(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(raw.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)),
  ).sort((a, b) => a - b);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" or null. Rejects anything else, including real-looking junk. */
export function parseDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !DATE_RE.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Guards against "2026-02-31" silently rolling into March.
  return d.toISOString().slice(0, 10) === raw ? raw : null;
}

export function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** One row of the admin "Timings" form, after parsing. */
export interface Timing {
  days: number[];
  times: string[];
}

export interface TimingsCheck {
  timings: Timing[];
  /** One message per input row, null where the row is fine. */
  rowErrors: (string | null)[];
  /** The first problem, worded for a toast or a 400; null when all is valid. */
  error: string | null;
}

/**
 * Validates the admin form's timings rows. Shared by the dialog and the API so
 * the browser can never accept something the server rejects.
 *
 * Each row needs a day and a valid time, and a day may sit in only one row:
 * otherwise residents would see two lists silently merged for that day.
 * `times` may be the raw textarea string or an array of times.
 */
export function checkTimings(raw: unknown): TimingsCheck {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { timings: [], rowErrors: [], error: "Add at least one set of timings." };
  }

  const firstRowFor = new Map<number, number>();
  const timings: Timing[] = [];
  const rowErrors = raw.map((row, i): string | null => {
    const r = (row ?? {}) as { days?: unknown; times?: unknown };
    const days = parseDaysInput(r.days);
    const rawTimes = Array.isArray(r.times)
      ? r.times.filter((t) => typeof t === "string").join(",")
      : r.times;
    const times = parseTimesInput(rawTimes);
    const bad = invalidTimeTokens(rawTimes);

    const clash = days.filter((d) => firstRowFor.has(d));
    for (const d of days) if (!firstRowFor.has(d)) firstRowFor.set(d, i);
    timings.push({ days, times });

    if (days.length === 0) return "Pick at least one day.";
    if (clash.length > 0) {
      const names = clash.map((d) => DAY_SHORT[d]).join(", ");
      return `${names} ${clash.length === 1 ? "is" : "are"} already in another row. Each day can have only one list of times.`;
    }
    if (bad.length > 0) {
      return `Not a valid time: ${bad.slice(0, 3).join(", ")}. Use the 24-hour clock, e.g. 06:15 or 18:30.`;
    }
    if (times.length === 0) return "Add at least one departure time.";
    return null;
  });

  const first = rowErrors.findIndex((e) => e !== null);
  const error =
    first === -1
      ? null
      : raw.length === 1
        ? rowErrors[first]
        : `Timings row ${first + 1}: ${rowErrors[first]}`;

  return { timings, rowErrors, error };
}

/** BusSchedule rows for validated timings: undated, active, auto-labelled. */
export function scheduleRows(timings: Timing[]) {
  return timings.map((t) => ({
    label: daysLabel(t.days),
    daysOfWeek: JSON.stringify(t.days),
    times: JSON.stringify(t.times),
    validFrom: null,
    validUntil: null,
    active: true,
  }));
}

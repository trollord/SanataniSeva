import { EXCEPTION_TYPES, toMinutes } from "@/lib/bus";

/** Accepts "06:15, 7:00  18.45" and similar human input. */
export function parseTimesInput(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(/[\s,;\n]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => {
          const m = /^(\d{1,2})[:.]?(\d{2})$/.exec(t);
          if (!m) return null;
          const h = Number(m[1]);
          const min = Number(m[2]);
          if (h > 23 || min > 59) return null;
          return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        })
        .filter((t): t is string => t !== null),
    ),
  ).sort((a, b) => toMinutes(a) - toMinutes(b));
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

export function isExceptionType(v: unknown): v is (typeof EXCEPTION_TYPES)[number] {
  return typeof v === "string" && (EXCEPTION_TYPES as readonly string[]).includes(v);
}

export function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

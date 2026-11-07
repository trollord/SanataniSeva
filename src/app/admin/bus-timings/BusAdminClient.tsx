"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, CalendarClock, Repeat, ChevronDown } from "lucide-react";
import { DAY_SHORT, formatTime, type ResolvedDay } from "@/lib/bus";

interface Schedule {
  id: string;
  label: string;
  days: number[];
  times: string[];
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
}
interface Exception {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  times: string[];
  reason: string | null;
}
export interface RouteView {
  id: string;
  routeNumber: string;
  name: string;
  origin: string;
  destination: string;
  via: string | null;
  operator: string | null;
  note: string | null;
  active: boolean;
  sortOrder: number;
  schedules: Schedule[];
  exceptions: Exception[];
  todayResolved: ResolvedDay;
}

const WEEKDAYS = [1, 2, 3, 4, 5];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const TYPE_STYLES: Record<string, string> = {
  CANCELLED: "bg-red-100 text-red-700",
  REPLACED: "bg-amber-100 text-amber-800",
  EXTRA: "bg-green-100 text-green-800",
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Something went wrong");
  return json;
}

export default function BusAdminClient({
  routes,
  today,
  todayLabel,
}: {
  routes: RouteView[];
  today: string;
  todayLabel: string;
  formatted?: Record<string, string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [openRoute, setOpenRoute] = useState<string | null>(routes[0]?.id ?? null);
  const [showNewRoute, setShowNewRoute] = useState(routes.length === 0);

  async function run(fn: () => Promise<unknown>, okMsg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── New route ─────────────────────────────────────────────────── */}
      {showNewRoute ? (
        <form
          className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            run(
              () =>
                send("/api/admin/bus/routes", "POST", {
                  routeNumber: f.get("routeNumber"),
                  origin: f.get("origin"),
                  destination: f.get("destination"),
                  via: f.get("via"),
                  operator: f.get("operator"),
                  note: f.get("note"),
                }),
              "Route added",
            ).then(() => setShowNewRoute(false));
          }}
        >
          <h2 className="font-semibold text-gray-900 mb-3">Add a route</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field name="routeNumber" label="Route number" placeholder="TMT 45" required />
            <Field name="origin" label="From" placeholder="Hiranandani Estate" required />
            <Field name="destination" label="To" placeholder="Thane Station" required />
            <Field name="via" label="Via (optional)" placeholder="Rodas Enclave" />
            <Field name="operator" label="Operator (optional)" placeholder="TMT" />
            <Field name="note" label="Note (optional)" placeholder="AC service" />
          </div>
          <div className="flex gap-2 mt-4">
            <button disabled={busy} className="bg-[#C8541A] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              Add route
            </button>
            {routes.length > 0 && (
              <button type="button" onClick={() => setShowNewRoute(false)} className="text-sm text-gray-500 px-3">
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewRoute(true)}
          className="flex items-center gap-2 text-sm font-semibold text-[#C8541A] hover:underline"
        >
          <Plus className="h-4 w-4" /> Add a route
        </button>
      )}

      {routes.length === 0 && !showNewRoute && (
        <p className="text-sm text-gray-500">No routes yet.</p>
      )}

      {/* ── Routes ────────────────────────────────────────────────────── */}
      {routes.map((r) => {
        const open = openRoute === r.id;
        return (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenRoute(open ? null : r.id)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#C8541A]">{r.routeNumber}</span>
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {r.origin} → {r.destination}
                  </span>
                  {!r.active && (
                    <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-600 rounded px-1.5 py-0.5">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.todayResolved.running
                    ? `Today (${todayLabel}): ${r.todayResolved.times.length} departures`
                    : `Today (${todayLabel}): no service`}
                  {r.todayResolved.overridden && " · overridden"}
                  {` · ${r.schedules.length} series · ${r.exceptions.length} overrides`}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 p-4 space-y-5">
                {/* Today preview — exactly what residents see */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                    What residents see today ({today})
                  </p>
                  {r.todayResolved.running ? (
                    <div className="flex flex-wrap gap-1.5">
                      {r.todayResolved.times.map((t) => (
                        <span key={t} className="text-xs tabular-nums bg-white border border-gray-200 rounded px-2 py-1">
                          {formatTime(t)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No service today{r.todayResolved.reason ? ` — ${r.todayResolved.reason}` : ""}
                    </p>
                  )}
                </div>

                {/* ── Recurring series ──────────────────────────────── */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
                    <Repeat className="h-3.5 w-3.5" /> Recurring series
                  </h3>
                  <div className="space-y-2 mb-3">
                    {r.schedules.length === 0 && (
                      <p className="text-xs text-gray-500">No series yet — add one below.</p>
                    )}
                    {r.schedules.map((s) => (
                      <div key={s.id} className="flex items-start justify-between gap-3 border border-gray-200 rounded-lg p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {s.label || "Service"}{" "}
                            <span className="font-normal text-gray-500">
                              · {s.days.map((d) => DAY_SHORT[d]).join(" ")}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1 tabular-nums break-words">
                            {s.times.join("  ")}
                          </p>
                          {(s.validFrom || s.validUntil) && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              {s.validFrom ?? "always"} → {s.validUntil ?? "forever"}
                            </p>
                          )}
                        </div>
                        <button
                          disabled={busy}
                          onClick={() => run(() => send(`/api/admin/bus/schedules/${s.id}`, "DELETE"), "Series removed")}
                          className="text-gray-400 hover:text-red-600 shrink-0"
                          aria-label="Delete series"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <SeriesForm routeId={r.id} busy={busy} run={run} />
                </section>

                {/* ── Overrides ─────────────────────────────────────── */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2">
                    <CalendarClock className="h-3.5 w-3.5" /> Overrides
                  </h3>
                  <div className="space-y-2 mb-3">
                    {r.exceptions.length === 0 && (
                      <p className="text-xs text-gray-500">No overrides.</p>
                    )}
                    {r.exceptions.map((e) => (
                      <div key={e.id} className="flex items-start justify-between gap-3 border border-gray-200 rounded-lg p-3">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 mr-2 ${TYPE_STYLES[e.type] ?? "bg-gray-100 text-gray-700"}`}>
                              {e.type}
                            </span>
                            {e.startDate}
                            {e.endDate !== e.startDate && ` → ${e.endDate}`}
                          </p>
                          {e.times.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1 tabular-nums">{e.times.join("  ")}</p>
                          )}
                          {e.reason && <p className="text-xs text-gray-500 mt-1">{e.reason}</p>}
                        </div>
                        <button
                          disabled={busy}
                          onClick={() => run(() => send(`/api/admin/bus/exceptions/${e.id}`, "DELETE"), "Override removed")}
                          className="text-gray-400 hover:text-red-600 shrink-0"
                          aria-label="Delete override"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ExceptionForm routeId={r.id} today={today} busy={busy} run={run} />
                </section>

                <div className="pt-1 flex gap-3">
                  <button
                    disabled={busy}
                    onClick={() => run(() => send(`/api/admin/bus/routes/${r.id}`, "PATCH", { active: !r.active }), r.active ? "Route hidden" : "Route visible")}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    {r.active ? "Hide from residents" : "Show to residents"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(`Delete route ${r.routeNumber} and all its timings?`)) return;
                      run(() => send(`/api/admin/bus/routes/${r.id}`, "DELETE"), "Route deleted");
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Delete route
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ name, label, placeholder, required, type = "text", defaultValue }: {
  name: string; label: string; placeholder?: string; required?: boolean; type?: string; defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8541A]/30"
      />
    </label>
  );
}

function SeriesForm({ routeId, busy, run }: {
  routeId: string; busy: boolean; run: (fn: () => Promise<unknown>, msg: string) => Promise<void>;
}) {
  const [days, setDays] = useState<number[]>(WEEKDAYS);
  return (
    <form
      className="border border-dashed border-gray-300 rounded-lg p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const f = new FormData(form);
        run(
          () =>
            send("/api/admin/bus/schedules", "POST", {
              routeId,
              label: f.get("label"),
              daysOfWeek: days,
              times: f.get("times"),
              validFrom: f.get("validFrom") || null,
              validUntil: f.get("validUntil") || null,
            }),
          "Series added",
        ).then(() => form.reset());
      }}
    >
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ALL_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()))}
            className={`text-xs font-semibold rounded-md px-2.5 py-1.5 border transition-colors ${
              days.includes(d)
                ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {DAY_SHORT[d]}
          </button>
        ))}
        <button type="button" onClick={() => setDays(WEEKDAYS)} className="text-xs text-[#C8541A] px-2">Mon–Fri</button>
        <button type="button" onClick={() => setDays(ALL_DAYS)} className="text-xs text-[#C8541A] px-2">All</button>
      </div>
      <label className="block mb-3">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
          Departure times
        </span>
        <textarea
          name="times"
          required
          rows={2}
          placeholder="06:15, 06:45, 07:20, 08:00"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C8541A]/30"
        />
        <span className="block text-[11px] text-gray-500 mt-1">
          Separate with commas, spaces or new lines. 24-hour clock.
        </span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <Field name="label" label="Label (optional)" placeholder="Weekday service" />
        <Field name="validFrom" label="Valid from (optional)" type="date" />
        <Field name="validUntil" label="Valid until (optional)" type="date" />
      </div>
      <button disabled={busy} className="bg-[#1C1C1C] text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50">
        Add series
      </button>
    </form>
  );
}

function ExceptionForm({ routeId, today, busy, run }: {
  routeId: string; today: string; busy: boolean; run: (fn: () => Promise<unknown>, msg: string) => Promise<void>;
}) {
  const [type, setType] = useState("CANCELLED");
  return (
    <form
      className="border border-dashed border-gray-300 rounded-lg p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const f = new FormData(form);
        run(
          () =>
            send("/api/admin/bus/exceptions", "POST", {
              routeId,
              type,
              startDate: f.get("startDate"),
              endDate: f.get("endDate") || f.get("startDate"),
              times: f.get("times"),
              reason: f.get("reason"),
            }),
          "Override added",
        ).then(() => form.reset());
      }}
    >
      <div className="flex flex-wrap gap-1.5 mb-3">
        {["CANCELLED", "REPLACED", "EXTRA"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`text-xs font-semibold rounded-md px-2.5 py-1.5 border transition-colors ${
              type === t ? "bg-[#1C1C1C] text-white border-[#1C1C1C]" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {t === "CANCELLED" ? "No service" : t === "REPLACED" ? "Different times" : "Extra buses"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field name="startDate" label="From date" type="date" required defaultValue={today} />
        <Field name="endDate" label="To date (blank = same day)" type="date" />
      </div>
      {type !== "CANCELLED" && (
        <label className="block mb-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
            {type === "REPLACED" ? "Times to run instead" : "Extra times to add"}
          </span>
          <textarea
            name="times"
            rows={2}
            placeholder="09:00, 10:30"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C8541A]/30"
          />
        </label>
      )}
      <div className="mb-3">
        <Field name="reason" label="Reason shown to residents" placeholder="Diwali holiday timetable" />
      </div>
      <button disabled={busy} className="bg-[#1C1C1C] text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50">
        Add override
      </button>
    </form>
  );
}

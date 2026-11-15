"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, EyeOff, Loader2 } from "lucide-react";
import { DAY_SHORT, daysLabel, formatTime } from "@/lib/bus";
import { checkTimings } from "@/lib/bus-validate";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";

export interface RouteView {
  id: string;
  routeNumber: string;
  origin: string;
  destination: string;
  via: string | null;
  operator: string | null;
  note: string | null;
  active: boolean;
  timings: { days: number[]; times: string[] }[];
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const PRESETS = [
  { label: "Mon–Fri", days: [1, 2, 3, 4, 5] },
  { label: "Sat–Sun", days: [0, 6] },
  { label: "Every day", days: ALL_DAYS },
];

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

export default function BusAdminClient({ routes }: { routes: RouteView[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  // `n` remounts the dialog on every open, so it always starts from the
  // route's saved state rather than whatever was typed and cancelled last time.
  const [dialog, setDialog] = useState<{ route: RouteView | null; n: number }>({ route: null, n: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(route: RouteView | null) {
    setDialog((d) => ({ route, n: d.n + 1 }));
    setDialogOpen(true);
  }

  async function run(id: string, fn: () => Promise<unknown>, okMsg: string) {
    setBusyId(id);
    try {
      await fn();
      toast.success(okMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bus Timings</h1>
        <button
          onClick={() => openDialog(null)}
          className="inline-flex items-center gap-1.5 bg-[#C8541A] hover:bg-[#C8541A]/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          <Plus className="h-4 w-4" /> Add route
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        Each route has one list of departure times per set of days. Residents see
        today&apos;s list, in IST.
      </p>

      {routes.length === 0 && <p className="text-sm text-gray-500">No routes yet.</p>}

      <div className="space-y-3">
        {routes.map((r) => {
          const busy = busyId === r.id;
          const meta = [r.via && `via ${r.via}`, r.operator].filter(Boolean).join(" · ");
          return (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#C8541A]">{r.routeNumber}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {r.origin} → {r.destination}
                </span>
                {!r.active && (
                  <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-600 rounded px-1.5 py-0.5">
                    Hidden
                  </span>
                )}
              </div>
              {meta && <p className="text-xs text-gray-500 mt-0.5">{meta}</p>}

              <div className="mt-2.5 space-y-1">
                {r.timings.length === 0 && (
                  <p className="text-xs text-gray-500">No timings yet. Residents will not see this route.</p>
                )}
                {r.timings.map((t, i) => {
                  const times = t.times.map(formatTime).join(", ");
                  return (
                    <p key={i} className="text-xs text-gray-700 tabular-nums truncate" title={times}>
                      <span className="font-semibold text-gray-900">{daysLabel(t.days)}</span> · {times}
                    </p>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-1 mt-3 -ml-2">
                <button
                  disabled={busy}
                  onClick={() => openDialog(r)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(
                      r.id,
                      () => send(`/api/admin/bus/routes/${r.id}`, "PATCH", { active: !r.active }),
                      r.active ? "Route hidden" : "Route visible",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  {r.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {r.active ? "Hide" : "Show"}
                </button>
                <button
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Delete route ${r.routeNumber}?`,
                      description: "Its timings go too. This cannot be undone.",
                      confirmLabel: "Delete route",
                      danger: true,
                    });
                    if (!ok) return;
                    run(r.id, () => send(`/api/admin/bus/routes/${r.id}`, "DELETE"), "Route deleted");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <RouteDialog
        key={dialog.n}
        route={dialog.route}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

interface Row {
  key: number;
  days: number[];
  times: string;
}

let rowKey = 0;
const newRow = (days: number[], times = ""): Row => ({ key: ++rowKey, days, times });

/** Add and Edit share this form; `route` is null when adding. */
function RouteDialog({ route, open, onClose }: {
  route: RouteView | null; open: boolean; onClose: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() =>
    route?.timings.length
      ? route.timings.map((t) => newRow(t.days, t.times.join(", ")))
      : [newRow(ALL_DAYS)],
  );
  const [saving, setSaving] = useState(false);
  // Row errors stay quiet until the first save attempt, then track every edit.
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const check = checkTimings(rows);
  const formId = route ? `edit-route-${route.id}` : "add-route";

  function patchRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTried(true);
    setServerError(null);
    if (check.error) return;

    const f = new FormData(e.currentTarget);
    const body = {
      routeNumber: f.get("routeNumber"),
      origin: f.get("origin"),
      destination: f.get("destination"),
      // Kept in step with the endpoints, as on creation
      name: `${f.get("origin")} → ${f.get("destination")}`,
      via: f.get("via"),
      operator: f.get("operator"),
      note: f.get("note"),
      timings: rows.map((r) => ({ days: r.days, times: r.times })),
    };

    setSaving(true);
    try {
      await send(route ? `/api/admin/bus/routes/${route.id}` : "/api/admin/bus/routes", route ? "PATCH" : "POST", body);
      toast.success(route ? "Route saved" : "Route added");
      router.refresh();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save. Please try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={route ? "Edit route" : "Add route"}
      description="Changes show on the Bus Timings tab as soon as you save."
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-gray-900 px-4 py-2.5">
            Cancel
          </button>
          {/* Lives outside the <form>, so it submits by id */}
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-[#C8541A] hover:bg-[#C8541A]/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={save} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field name="routeNumber" label="Route number" placeholder="TMT 45" required defaultValue={route?.routeNumber} />
          <Field name="origin" label="From" placeholder="Hiranandani Estate" required defaultValue={route?.origin} />
          <Field name="destination" label="To" placeholder="Thane Station" required defaultValue={route?.destination} />
          <Field name="via" label="Via (optional)" placeholder="Rodas Enclave" defaultValue={route?.via ?? undefined} />
          <Field name="operator" label="Operator (optional)" placeholder="TMT" defaultValue={route?.operator ?? undefined} />
          <Field name="note" label="Note (optional)" placeholder="AC service" defaultValue={route?.note ?? undefined} />
        </div>

        <section>
          <h3 className="text-sm font-semibold text-gray-900">Timings</h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">
            Pick the days, then list the departures. A day can be in only one row.
          </p>

          <div className="space-y-3">
            {rows.map((row, i) => {
              const err = tried ? check.rowErrors[i] : null;
              return (
                <div
                  key={row.key}
                  className={`border rounded-xl p-3 sm:p-4 ${err ? "border-red-300" : "border-gray-200"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_DAYS.map((d) => {
                        const on = row.days.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              patchRow(row.key, {
                                days: on ? row.days.filter((x) => x !== d) : [...row.days, d].sort((a, b) => a - b),
                              })
                            }
                            className={`min-w-11 h-9 text-xs font-semibold rounded-md px-2 border transition-colors ${
                              on ? "bg-[#1C1C1C] text-white border-[#1C1C1C]" : "bg-white text-gray-600 border-gray-300"
                            }`}
                          >
                            {DAY_SHORT[d]}
                          </button>
                        );
                      })}
                    </div>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        aria-label="Remove these timings"
                        className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-1 mt-1 -ml-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => patchRow(row.key, { days: p.days })}
                        className="text-xs font-semibold text-[#C8541A] hover:underline px-2 py-2"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={row.times}
                    onChange={(e) => patchRow(row.key, { times: e.target.value })}
                    rows={2}
                    aria-label={`Departure times for ${daysLabel(row.days) || "these days"}`}
                    placeholder="06:15, 06:45, 07:20"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C8541A]/30"
                  />
                  {err ? (
                    <p className="text-xs text-red-600 mt-1">{err}</p>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Separate with commas, spaces or new lines. 24-hour clock.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {rows.length < 7 && (
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, newRow([])])}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8541A] hover:underline py-2 mt-1"
            >
              <Plus className="h-4 w-4" /> Add timings for other days
            </button>
          )}
        </section>

        {serverError && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {serverError}
          </p>
        )}
      </form>
    </Modal>
  );
}

function Field({ name, label, placeholder, required, defaultValue }: {
  name: string; label: string; placeholder?: string; required?: boolean; defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8541A]/30"
      />
    </label>
  );
}

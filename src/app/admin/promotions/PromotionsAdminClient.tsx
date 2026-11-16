"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Store,
  Trash2,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type { SelectOption } from "@/components/ui/searchable-select";
import { formatYmd, type PromotionFormValues, type PromotionStatus } from "@/lib/promotions";
import PromotionFormDialog, { EMPTY_PROMOTION } from "./PromotionFormDialog";

export interface PromotionAdminRow {
  id: string;
  slug: string;
  status: PromotionStatus;
  hidden: boolean;
  categoryLabel: string | null;
  thumbUrl: string | null;
  form: PromotionFormValues;
}

const API = "/api/admin/promotions";

const STATUS: Record<PromotionStatus, { label: string; className: string }> = {
  LIVE: { label: "Live", className: "bg-green-100 text-green-800" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-50 text-blue-700" },
  EXPIRED: { label: "Expired", className: "bg-amber-50 text-amber-700" },
  HIDDEN: { label: "Hidden", className: "bg-gray-100 text-gray-600" },
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

function runText({ startsOn, endsOn }: PromotionFormValues): string {
  if (startsOn && endsOn) return `${formatYmd(startsOn)} – ${formatYmd(endsOn)}`;
  if (startsOn) return `From ${formatYmd(startsOn)}, no end date`;
  if (endsOn) return `Until ${formatYmd(endsOn)}`;
  return "No start or end date";
}

export default function PromotionsAdminClient({
  promotions,
  categories,
}: {
  promotions: PromotionAdminRow[];
  categories: SelectOption[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  // `n` remounts the dialog on every open, so it always starts from the saved
  // state rather than whatever was typed and cancelled last time.
  const [dialog, setDialog] = useState<{ row: PromotionAdminRow | null; n: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(row: PromotionAdminRow | null) {
    setDialog((d) => ({ row, n: (d?.n ?? 0) + 1 }));
    setDialogOpen(true);
  }

  /** `okMsg` null for reorders, which show themselves and would only add noise. */
  async function run(id: string, fn: () => Promise<unknown>, okMsg: string | null) {
    setBusyId(id);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: PromotionAdminRow) {
    const ok = await confirm({
      title: `Delete ${p.form.name}?`,
      description: "It comes off the site straight away and its photos are deleted. This cannot be undone.",
      confirmLabel: "Delete promotion",
      danger: true,
    });
    if (!ok) return;
    run(p.id, () => send(`${API}/${p.id}`, "DELETE"), "Promotion deleted");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Promotions</h1>
        <button
          onClick={() => openDialog(null)}
          className="inline-flex items-center gap-1.5 bg-[#C8541A] hover:bg-[#C8541A]/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          <Plus className="h-4 w-4" /> Add promotion
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        Paid business promotions, shown on the Promotions page in this order. A promotion is
        live between its start and end dates (IST, both days included) unless it is hidden.
      </p>

      {promotions.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-sm">No promotions yet. Add the first one above.</p>
        </div>
      )}

      <div className="space-y-3">
        {promotions.map((p, i) => {
          const busy = busyId === p.id;
          const status = STATUS[p.status];
          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-[#F7F3EC]">
                  {p.thumbUrl ? (
                    <Image src={p.thumbUrl} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <Store className="absolute inset-0 m-auto h-5 w-5 text-[#B8AC9B]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.form.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {p.categoryLabel ?? "No category"} · {runText(p.form)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {p.form.spotlight && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#FDDCC8] bg-[#FFF3EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8541A]">
                        <Star className="h-3 w-3" /> Spotlight
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0">
                  <MoveButton
                    label={`Move ${p.form.name} up`}
                    disabled={busy || i === 0}
                    onClick={() => run(p.id, () => send(`${API}/${p.id}`, "PATCH", { move: "up" }), null)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </MoveButton>
                  <MoveButton
                    label={`Move ${p.form.name} down`}
                    disabled={busy || i === promotions.length - 1}
                    onClick={() => run(p.id, () => send(`${API}/${p.id}`, "PATCH", { move: "down" }), null)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </MoveButton>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2 -ml-2">
                <button
                  disabled={busy}
                  onClick={() => openDialog(p)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(
                      p.id,
                      () => send(`${API}/${p.id}`, "PATCH", { hidden: !p.hidden }),
                      p.hidden ? `${p.form.name} is visible again` : `${p.form.name} hidden`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  {p.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {p.hidden ? "Show" : "Hide"}
                </button>
                {p.status === "LIVE" && (
                  <Link
                    href={`/promotions/${p.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Link>
                )}
                <button
                  disabled={busy}
                  onClick={() => remove(p)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {dialog && (
        <PromotionFormDialog
          key={dialog.n}
          id={dialog.row?.id ?? null}
          initial={dialog.row?.form ?? EMPTY_PROMOTION}
          categories={categories}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

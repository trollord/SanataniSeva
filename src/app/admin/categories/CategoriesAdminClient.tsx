"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { categoryDeleteBlocker, slugifyCategoryKey } from "@/lib/directory";
import {
  DEFAULT_DIRECTORY_ICON,
  DIRECTORY_ICONS,
  DIRECTORY_ICON_NAMES,
  type DirectoryIconName,
  directoryIconName,
  isDirectoryIconName,
} from "@/lib/directory-icons";

export interface CategoryAdminView {
  key: string;
  label: string;
  icon: string;
  /** Every status: any contact blocks a delete */
  contacts: number;
  subcategories: { id: string; label: string; contacts: number }[];
}

type SubcategoryAdminView = CategoryAdminView["subcategories"][number];

const API = "/api/admin/directory-categories";

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

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Dialog =
  | { kind: "category"; category: CategoryAdminView | null }
  | { kind: "subcategory"; category: CategoryAdminView; sub: SubcategoryAdminView | null }
  | { kind: "blocked"; title: string; message: string };

export default function CategoriesAdminClient({ categories }: { categories: CategoryAdminView[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  // `n` remounts the dialog on every open, so it always starts from the saved
  // state rather than whatever was typed and cancelled last time.
  const [dialog, setDialog] = useState<{ value: Dialog | null; n: number }>({ value: null, n: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(value: Dialog) {
    setDialog((d) => ({ value, n: d.n + 1 }));
    setDialogOpen(true);
  }
  const closeDialog = () => setDialogOpen(false);

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

  async function deleteCategory(c: CategoryAdminView) {
    const blocker = categoryDeleteBlocker(c.label, c.contacts, c.subcategories.length);
    if (blocker) {
      openDialog({ kind: "blocked", title: `${c.label} can't be deleted yet`, message: blocker });
      return;
    }
    const ok = await confirm({
      title: `Delete ${c.label}?`,
      description: "No contacts use it. This cannot be undone.",
      confirmLabel: "Delete category",
      danger: true,
    });
    if (!ok) return;
    run(c.key, () => send(`${API}/${encodeURIComponent(c.key)}`, "DELETE"), "Category deleted");
  }

  async function deleteSubcategory(c: CategoryAdminView, s: SubcategoryAdminView) {
    const ok = await confirm({
      title: `Delete “${s.label}”?`,
      description:
        s.contacts > 0
          ? `${count(s.contacts, "contact", "contacts")} will become unassigned. They stay in ${c.label}.`
          : "No contacts use it.",
      confirmLabel: "Delete subcategory",
      danger: true,
    });
    if (!ok) return;
    run(
      s.id,
      () => send(`${API}/${encodeURIComponent(c.key)}/subcategories/${s.id}`, "DELETE"),
      "Subcategory deleted",
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => openDialog({ kind: "category", category: null })}
          className="inline-flex items-center gap-1.5 bg-[#C8541A] hover:bg-[#C8541A]/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6 max-w-2xl">
        The Service Providers page lists categories in this order. Subcategories are
        optional; residents see them under a category once they tick it.
      </p>

      {categories.length === 0 && <p className="text-sm text-gray-500">No categories yet.</p>}

      <div className="space-y-3">
        {categories.map((c, i) => {
          const Icon = DIRECTORY_ICONS[directoryIconName(c.icon)];
          const busy = busyId === c.key;
          const path = `${API}/${encodeURIComponent(c.key)}`;
          return (
            <div key={c.key} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-[#F5F5F5] rounded-lg p-2 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-[#C8541A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {count(c.contacts, "contact", "contacts")} ·{" "}
                    <span className="font-mono">{c.key}</span>
                  </p>
                </div>
                <MoveButtons
                  label={c.label}
                  first={i === 0}
                  last={i === categories.length - 1}
                  disabled={busy}
                  onMove={(move) => run(c.key, () => send(path, "PATCH", { move }), null)}
                />
              </div>

              {c.subcategories.length > 0 && (
                <ul className="mt-3 border-t border-gray-100 divide-y divide-gray-100">
                  {c.subcategories.map((s, j) => {
                    const subBusy = busyId === s.id;
                    return (
                      <li key={s.id} className="flex items-center gap-1 py-1 sm:pl-11">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 truncate">{s.label}</p>
                          <p className="text-[11px] text-gray-500">
                            {count(s.contacts, "contact", "contacts")}
                          </p>
                        </div>
                        <MoveButtons
                          label={s.label}
                          first={j === 0}
                          last={j === c.subcategories.length - 1}
                          disabled={subBusy}
                          onMove={(move) =>
                            run(s.id, () => send(`${path}/subcategories/${s.id}`, "PATCH", { move }), null)
                          }
                        />
                        <button
                          disabled={subBusy}
                          onClick={() => openDialog({ kind: "subcategory", category: c, sub: s })}
                          aria-label={`Rename ${s.label}`}
                          className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={subBusy}
                          onClick={() => deleteSubcategory(c, s)}
                          aria-label={`Delete ${s.label}`}
                          className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex flex-wrap gap-1 mt-2 -ml-2">
                <button
                  disabled={busy}
                  onClick={() => openDialog({ kind: "category", category: c })}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  disabled={busy}
                  onClick={() => openDialog({ kind: "subcategory", category: c, sub: null })}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add subcategory
                </button>
                <button
                  disabled={busy}
                  onClick={() => deleteCategory(c)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {dialog.value?.kind === "category" && (
        <CategoryDialog
          key={dialog.n}
          category={dialog.value.category}
          takenKeys={categories.map((c) => c.key)}
          open={dialogOpen}
          onClose={closeDialog}
        />
      )}
      {dialog.value?.kind === "subcategory" && (
        <SubcategoryDialog
          key={dialog.n}
          category={dialog.value.category}
          sub={dialog.value.sub}
          open={dialogOpen}
          onClose={closeDialog}
        />
      )}
      {dialog.value?.kind === "blocked" && (
        <Modal
          key={dialog.n}
          open={dialogOpen}
          onClose={closeDialog}
          title={dialog.value.title}
          description={dialog.value.message}
        >
          <button
            onClick={closeDialog}
            className="w-full bg-[#1C1C1C] hover:bg-[#1C1C1C]/90 text-white text-sm font-semibold py-2.5 rounded-lg"
          >
            OK
          </button>
        </Modal>
      )}
    </>
  );
}

function MoveButtons({
  label,
  first,
  last,
  disabled,
  onMove,
}: {
  label: string;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  const cls =
    "h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="flex shrink-0">
      <button type="button" disabled={disabled || first} onClick={() => onMove("up")} aria-label={`Move ${label} up`} className={cls}>
        <ChevronUp className="h-4 w-4" />
      </button>
      <button type="button" disabled={disabled || last} onClick={() => onMove("down")} aria-label={`Move ${label} down`} className={cls}>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Shared by both dialogs: save, refresh, close, or keep the error on screen. */
function useSave(onClose: () => void) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function save(request: () => Promise<unknown>, okMsg: string) {
    setServerError(null);
    setSaving(true);
    try {
      await request();
      toast.success(okMsg);
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
  return { save, saving, serverError };
}

function DialogFooter({ formId, saving, onClose }: { formId: string; saving: boolean; onClose: () => void }) {
  return (
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
  );
}

function NameInput({ value, onChange, placeholder, hint }: {
  value: string; onChange: (v: string) => void; placeholder: string; hint?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Name</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        maxLength={60}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8541A]/30"
      />
      {hint && <span className="block text-[11px] text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

function ServerError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{message}</p>
  );
}

/** Add and Edit share this form; `category` is null when adding. */
function CategoryDialog({ category, takenKeys, open, onClose }: {
  category: CategoryAdminView | null; takenKeys: string[]; open: boolean; onClose: () => void;
}) {
  const [label, setLabel] = useState(category?.label ?? "");
  const [icon, setIcon] = useState<DirectoryIconName>(
    category && isDirectoryIconName(category.icon) ? category.icon : DEFAULT_DIRECTORY_ICON,
  );
  const { save, saving, serverError } = useSave(onClose);
  const formId = category ? `edit-category-${category.key}` : "add-category";
  // Previewed so the admin knows the key before it is fixed for good. The
  // server makes the same slug, against the same keys.
  const key = category?.key ?? (label.trim() ? slugifyCategoryKey(label, takenKeys) : "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={category ? "Edit category" : "Add category"}
      description="Changes show on the Service Providers page as soon as you save."
      footer={<DialogFooter formId={formId} saving={saving} onClose={onClose} />}
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          save(
            () =>
              category
                ? send(`${API}/${encodeURIComponent(category.key)}`, "PATCH", { label, icon })
                : send(API, "POST", { label, icon }),
            category ? "Category saved" : "Category added",
          );
        }}
        className="space-y-6"
      >
        <NameInput
          value={label}
          onChange={setLabel}
          placeholder="e.g. Fitness & Yoga"
          hint={
            key && (
              <>
                Key <span className="font-mono">{key}</span>
                {category ? ", fixed" : ", fixed once added"}
              </>
            )
          }
        />

        <fieldset>
          <legend className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Icon</legend>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
            {DIRECTORY_ICON_NAMES.map((name) => {
              const Icon = DIRECTORY_ICONS[name];
              const on = name === icon;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  aria-label={name}
                  title={name}
                  onClick={() => setIcon(name)}
                  className={`h-11 rounded-lg border flex items-center justify-center transition-colors ${
                    on
                      ? "border-[#C8541A] bg-[#C8541A]/10 text-[#C8541A]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          {category && !isDirectoryIconName(category.icon) && (
            <p className="text-[11px] text-gray-500 mt-2">
              Its saved icon, “{category.icon}”, is no longer offered, so it shows the default until you pick one.
            </p>
          )}
        </fieldset>

        <ServerError message={serverError} />
      </form>
    </Modal>
  );
}

/** Add and Rename share this form; `sub` is null when adding. */
function SubcategoryDialog({ category, sub, open, onClose }: {
  category: CategoryAdminView; sub: SubcategoryAdminView | null; open: boolean; onClose: () => void;
}) {
  const [label, setLabel] = useState(sub?.label ?? "");
  const { save, saving, serverError } = useSave(onClose);
  const formId = sub ? `edit-subcategory-${sub.id}` : "add-subcategory";
  const path = `${API}/${encodeURIComponent(category.key)}/subcategories`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sub ? "Rename subcategory" : "Add subcategory"}
      description={`In ${category.label}.`}
      footer={<DialogFooter formId={formId} saving={saving} onClose={onClose} />}
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          save(
            () => (sub ? send(`${path}/${sub.id}`, "PATCH", { label }) : send(path, "POST", { label })),
            sub ? "Subcategory renamed" : "Subcategory added",
          );
        }}
        className="space-y-4"
      >
        <NameInput value={label} onChange={setLabel} placeholder="e.g. Dental" />
        <ServerError message={serverError} />
      </form>
    </Modal>
  );
}

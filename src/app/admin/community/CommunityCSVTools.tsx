"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";
import { formatPhone, parsePhone } from "@/lib/phone";
import {
  type DirectoryCategoryView,
  findSubcategoryByLabel,
  sameLabel,
} from "@/lib/directory";

const VALID_LOCALITIES = new Set(HIRANANDANI_LOCALITIES as readonly string[]);

const REQUIRED_COLS = ["name", "extension", "number", "category", "service", "locality"];
// Template column order. Import reads by header name, so older sheets without
// a subcategory column still load.
const ALL_COLS = [
  "name", "extension", "number", "category", "subcategory", "service", "locality",
  "contactPerson", "address", "hours", "whatsapp",
];

/** Spreadsheet column letter for a template header (all fit in A-Z). */
const colLetter = (name: string) => String.fromCharCode(65 + ALL_COLS.indexOf(name));

type ParsedRow = {
  index: number;
  data: Record<string, string>;
  errors: string[];
  /** Imported anyway, but worth telling the admin about */
  warnings: string[];
  mapped: Record<string, unknown> | null;
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
/** By key, or by label ignoring case. */
function resolveCategory(
  raw: string,
  categories: DirectoryCategoryView[]
): DirectoryCategoryView | null {
  const trimmed = raw.trim();
  return (
    categories.find((c) => c.key === trimmed) ??
    categories.find((c) => sameLabel(c.label, trimmed)) ??
    null
  );
}

function resolveLocality(raw: string): string | null {
  const trimmed = raw.trim();
  if (VALID_LOCALITIES.has(trimmed)) return trimmed;
  return null;
}

function validateRow(
  raw: Record<string, string>,
  index: number,
  categories: DirectoryCategoryView[]
): ParsedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = raw.name?.trim() ?? "";
  // Two aligned columns, pipe-separated when a vendor has several numbers:
  //   extension  +91|022
  //   number     9876543210|25972040
  // A sheet exported before this change had a single `phones` column, so that
  // is still accepted rather than failing every historic file.
  const exts = (raw.extension ?? "").split("|").map((v) => v.trim());
  const nums = (raw.number ?? "").split("|").map((v) => v.trim()).filter(Boolean);
  const phones = nums.length
    ? nums.map((n, i) => formatPhone(exts[i] ?? exts[0] ?? "+91", n))
    : (raw.phones ?? "").split("|").map((v) => v.trim()).filter(Boolean);
  const service = raw.service?.trim() ?? "";
  const whatsappRaw = raw.whatsapp?.trim().toLowerCase() ?? "";

  if (name.length < 2 || name.length > 120) errors.push("Name must be 2–120 chars");
  if (phones.length === 0) errors.push("At least one phone number is required");
  else if (phones.length > 5) errors.push("At most five numbers");
  else
    phones.forEach((p) => {
      const parsed = parsePhone(p);
      if (!parsed.valid) errors.push(`"${p}": ${parsed.reason}`);
    });
  if (service.length < 5 || service.length > 200) errors.push("Service must be 5–200 chars");

  const category = resolveCategory(raw.category ?? "", categories);
  if (!category) errors.push(`Invalid category "${raw.category}" — use key or label`);

  // Matched by label within the row's category, never created: a typo should
  // not quietly become a new subcategory. No match leaves the contact
  // unassigned, which is a valid state, so it is a warning and not an error.
  const subLabel = raw.subcategory?.trim() ?? "";
  const subcategory = findSubcategoryByLabel(category ?? undefined, subLabel);
  if (category && subLabel && !subcategory) {
    warnings.push(`No subcategory "${subLabel}" in ${category.label}; left unassigned`);
  }

  const locality = resolveLocality(raw.locality ?? "");
  if (!locality) errors.push(`Invalid locality "${raw.locality}"`);

  const whatsapp = ["yes", "true", "1"].includes(whatsappRaw);

  const mapped =
    errors.length === 0
      ? {
          name,
          phones,
          category: category!.key,
          subcategoryId: subcategory?.id ?? null,
          service,
          locality: locality!,
          contactPerson: raw.contactPerson?.trim() || undefined,
          address: raw.address?.trim() || "",
          hours: raw.hours?.trim() || "",
          whatsapp,
        }
      : null;

  return { index, data: raw, errors, warnings, mapped };
}

/* ── Template download ──────────────────────────────────────────────────── */
function downloadTemplate(categories: DirectoryCategoryView[]) {
  const wb = XLSX.utils.book_new();

  /* Sheet 1 — Data entry */
  const headers = ALL_COLS;
  const exampleRow = [
    "Ramesh Plumbing Works",
    "+91",
    "9876543210",
    "plumber",
    "",
    "All plumbing repairs, pipe fitting, tap replacement",
    "Hiranandani Estate",
    "Ramesh",
    "Shop 4, Ground Floor, Rodas Tower",
    "Mon–Sat 9am–7pm",
    "Yes",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

  /* Column widths */
  ws["!cols"] = [22, 10, 16, 16, 20, 36, 22, 18, 32, 22, 10].map((w) => ({ wch: w }));

  const localityList = [...HIRANANDANI_LOCALITIES];

  if (!ws["!dataValidations"]) ws["!dataValidations"] = [];
  // Letters come from ALL_COLS, so inserting a column cannot leave a
  // validation on the wrong one.
  const category = colLetter("category");
  (ws["!dataValidations"] as unknown[]).push({
    sqref: `${category}2:${category}500`,
    type: "list",
    formula1: `"${categories.map((c) => c.key).join(",")}"`,
    showDropDown: false,
    showErrorMessage: true,
    errorTitle: "Invalid category",
    error: `Must be one of: ${categories.map((c) => c.key).join(", ")}`,
  });
  const locality = colLetter("locality");
  (ws["!dataValidations"] as unknown[]).push({
    sqref: `${locality}2:${locality}500`,
    type: "list",
    formula1: `"${localityList.join(",")}"`,
    showDropDown: false,
    showErrorMessage: true,
    errorTitle: "Invalid locality",
    error: `Must be one of: ${localityList.join(", ")}`,
  });
  const whatsapp = colLetter("whatsapp");
  (ws["!dataValidations"] as unknown[]).push({
    sqref: `${whatsapp}2:${whatsapp}500`,
    type: "list",
    formula1: '"Yes,No"',
    showDropDown: false,
  });

  XLSX.utils.book_append_sheet(wb, ws, "Contacts");

  /* Sheet 2 — Reference */
  const refData = [
    ["Category Key", "Category Label", "Subcategories (optional, by label)"],
    ...categories.map((c) => [c.key, c.label, c.subcategories.map((s) => s.label).join(" | ")]),
    [],
    ["Locality Values"],
    ...HIRANANDANI_LOCALITIES.map((l) => [l]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef["!cols"] = [{ wch: 18 }, { wch: 26 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, wsRef, "Valid Values");

  XLSX.writeFile(wb, "community-template.xlsx");
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function CommunityCSVTools({
  categories,
}: {
  /** In display order, from the DB */
  categories: DirectoryCategoryView[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; unassigned: number } | null>(null);

  const labelByKey = useMemo(
    () => new Map(categories.map((c) => [c.key, c.label])),
    [categories]
  );

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setHeaderError(null);
    setRows([]);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const found = results.meta.fields ?? [];
        const missing = REQUIRED_COLS.filter((c) => !found.includes(c));
        if (missing.length > 0) {
          setHeaderError(
            `Missing required columns: ${missing.join(", ")}. Found: ${found.join(", ")}`
          );
          return;
        }
        setRows(results.data.map((row, i) => validateRow(row, i + 1, categories)));
      },
    });

    e.target.value = "";
  }

  async function upload() {
    if (validRows.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/community/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((r) => r.mapped) }),
      });
      const data = await res.json();
      setResult({
        created: data.created,
        skipped: errorRows.length,
        // Unmatched in the preview, plus any the server dropped as stale
        unassigned:
          validRows.filter((r) => r.warnings.length > 0).length + (data.unassigned?.length ?? 0),
      });
      setRows([]);
    } finally {
      setUploading(false);
    }
  }

  function exportCSV() {
    window.location.href = "/api/admin/community/export";
  }

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-700 mr-1">Bulk tools</span>

        {/* Download template */}
        <button
          onClick={() => downloadTemplate(categories)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
          Download Template
        </button>

        {/* Upload CSV */}
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-blue-500" />
          Upload CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />

        {/* Export */}
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          Export CSV
        </button>
      </div>

      {/* Header error */}
      {headerError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 leading-relaxed">
          <p className="font-semibold mb-0.5">Column mismatch</p>
          {headerError}
        </div>
      )}

      {/* Upload result */}
      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            <strong>{result.created} contacts added</strong> and set to Active.
            {result.skipped > 0 && ` ${result.skipped} rows skipped due to errors.`}
            {result.unassigned > 0 &&
              ` ${result.unassigned} ${result.unassigned === 1 ? "contact was" : "contacts were"} added without a subcategory, as theirs did not match one in their category.`}
          </span>
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              <span className="text-green-700 font-semibold">{validRows.length} valid</span>
              {errorRows.length > 0 && (
                <span className="text-red-600 font-semibold ml-2">{errorRows.length} errors</span>
              )}
            </p>
            {validRows.length > 0 && (
              <button
                onClick={upload}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0B0B0C] text-white rounded-lg px-3 py-2 hover:opacity-80 disabled:opacity-50 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Upload {validRows.length} contacts
              </button>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-64">
            <table className="w-full text-xs min-w-[600px]">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium w-6">#</th>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Phone</th>
                  <th className="text-left px-3 py-2 font-medium">Category</th>
                  <th className="text-left px-3 py-2 font-medium">Locality</th>
                  <th className="text-left px-3 py-2 font-medium">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row.index}
                    className={row.errors.length > 0 ? "bg-red-50" : "bg-white"}
                  >
                    <td className="px-3 py-2 text-gray-400">{row.index}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 max-w-[140px] truncate">
                      {row.data.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{[row.data.extension, row.data.number].filter(Boolean).join(" ") || row.data.phones || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.mapped
                        ? labelByKey.get(row.mapped.category as string) ?? row.data.category
                        : row.data.category || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">
                      {row.data.locality || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.errors.length > 0 ? (
                        <span className="flex items-start gap-1 text-red-600">
                          <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          {row.errors[0]}
                        </span>
                      ) : row.warnings.length > 0 ? (
                        <span className="flex items-start gap-1 text-amber-700">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          {row.warnings[0]}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

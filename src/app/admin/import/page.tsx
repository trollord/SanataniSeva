"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

export default function AdminImportPage() {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number } | null>(null);

  async function handleImport() {
    if (!csv.trim()) { toast.error("Paste CSV data first"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
      setResult(data);
      toast.success(`Imported ${data.imported} price records`);
      setCsv("");
    } catch {
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsv((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Import Price History</h1>
      <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6">
        CSV format: <code className="bg-gray-100 px-1 rounded text-xs">propertyId,price,recordedAt,source</code>
        <br />
        <span className="text-xs">source must be <code className="bg-gray-100 px-1 rounded">LISTING</code> or <code className="bg-gray-100 px-1 rounded">ADMIN_IMPORT</code></span>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV file</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or paste CSV data</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[200px]"
            placeholder={"propertyId,price,recordedAt,source\ncm123abc,4500000,2024-01-15T00:00:00Z,ADMIN_IMPORT"}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
        </div>

        <Button
          onClick={handleImport}
          disabled={loading || !csv.trim()}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Import
        </Button>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            Successfully imported <strong>{result.imported}</strong> price history records.
          </div>
        )}
      </div>
    </div>
  );
}

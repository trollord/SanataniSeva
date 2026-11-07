"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return toast.error("Select a PDF first.");
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    if (!title || !date) return toast.error("Fill in title and date.");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("date", date);

      const res = await fetch("/api/admin/newsletter", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      const { pageCount } = await res.json();
      toast.success(`Uploaded - ${pageCount} page${pageCount !== 1 ? "s" : ""} detected`);
      form.reset();
      setFile(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-semibold text-gray-900">Upload new edition</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Sanatani Community Weekly - Oct 2026"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Edition date</Label>
          <Input id="date" name="date" type="date" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>PDF file</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            file ? "border-[#FF5F15]/30 bg-gray-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
              <FileText className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Click to select a PDF</p>
              <p className="text-xs text-gray-400 mt-1">Max 50 MB</p>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={uploading || !file} className="gap-2 rounded-xl">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

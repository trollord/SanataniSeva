"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** fetch() cannot report upload progress, and a 30 MB edition needs some. */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage refused the upload (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export default function UploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // 0-100 while the PDF goes to storage, null otherwise
  const [progress, setProgress] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return toast.error("Select a PDF first.");
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    if (!title || !date) return toast.error("Fill in title and date.");

    if (file.size > 50 * 1024 * 1024) return toast.error("PDF must be under 50 MB.");

    setUploading(true);
    try {
      // The PDF goes straight to storage, then only its key is posted here:
      // sending the file through the server capped it at Vercel's 4.5 MB
      // request limit and sent every byte twice.
      const presign = await fetch(`/api/admin/newsletter?fileSize=${file.size}`);
      if (!presign.ok) {
        const err = await presign.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not start the upload");
      }
      const { presignedUrl, s3Key } = await presign.json();

      setProgress(0);
      await putWithProgress(presignedUrl, file, setProgress);

      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, title, date }),
      });
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
      setProgress(null);
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
            placeholder="e.g. Sanatani Seva Weekly - Oct 2026"
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
          ) : null}
          {file && progress !== null ? (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-[#FF5F15] transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
          ) : !file ? (
            <>
              <Upload className="h-7 w-7 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Click to select a PDF</p>
              <p className="text-xs text-gray-400 mt-1">Max 50 MB</p>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={uploading || !file} className="gap-2 rounded-xl">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress === null ? "Saving…" : progress < 100 ? `Uploading ${progress}%` : "Reading pages…"}
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

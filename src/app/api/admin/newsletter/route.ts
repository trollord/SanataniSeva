import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteS3Object, getPresignedUploadUrl, getS3Url, uploadBufferToS3 } from "@/lib/s3";
import { PDFDocument } from "pdf-lib";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

const MAX_PDF_BYTES = 50 * 1024 * 1024;
// The IAM user is scoped to sanatani-seva-folder/*; a key outside that prefix
// is refused with a 403 at PutObject.
const KEY_PREFIX = "sanatani-seva-folder/newspapers/";
const KEY_PATTERN = /^sanatani-seva-folder\/newspapers\/[0-9a-f-]{36}\.pdf$/;

async function requireAdmin() {
  const session = await auth();
  return session?.user.role === "ADMIN";
}

/**
 * Step 1 of an upload: a presigned URL so the browser sends the PDF straight
 * to S3. Posting the file through this function capped editions at Vercel's
 * 4.5 MB request-body limit, whatever the form said, and sent every byte
 * twice.
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fileSize = Number(new URL(req.url).searchParams.get("fileSize") ?? "0");
  if (!fileSize || fileSize > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF must be under 50 MB" }, { status: 400 });
  }
  const s3Key = `${KEY_PREFIX}${randomUUID()}.pdf`;
  const presignedUrl = await getPresignedUploadUrl(s3Key, "application/pdf");
  return NextResponse.json({ presignedUrl, s3Key });
}

/** Throws if the bytes are not a readable PDF, which is the real type check. */
async function countPages(buffer: Buffer) {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

async function saveEdition(pageCount: number, s3Key: string, pdfUrl: string, title: string, date: string) {
  const newsletter = await prisma.newsletter.create({
    data: {
      title,
      date: new Date(date),
      pdfUrl,
      publicId: s3Key,
      pageCount,
      status: "PUBLISHED",
    },
    select: { id: true },
  });
  revalidatePath("/newspaper");
  return NextResponse.json({ id: newsletter.id, pageCount }, { status: 201 });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2 of a direct upload: the PDF is already in S3 under s3Key.
  if (req.headers.get("content-type")?.includes("application/json")) {
    const { s3Key, title, date } = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof s3Key !== "string" || !KEY_PATTERN.test(s3Key)) {
      return NextResponse.json({ error: "Invalid upload key" }, { status: 400 });
    }
    if (typeof title !== "string" || !title.trim() || typeof date !== "string" || !date) {
      return NextResponse.json({ error: "title and date are required" }, { status: 400 });
    }
    const pdfUrl = getS3Url(s3Key);
    try {
      // Same region as this function, so reading it back is quick. This is
      // also what proves the upload really is a PDF.
      const res = await fetch(pdfUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`could not read the uploaded file (${res.status})`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_PDF_BYTES) throw new Error("PDF must be under 50 MB");
      const pageCount = await countPages(buffer);
      return await saveEdition(pageCount, s3Key, pdfUrl, title.trim(), date);
    } catch (err) {
      await deleteS3Object(s3Key).catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[newsletter] direct upload failed:", msg);
      return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 400 });
    }
  }

  // Older path: the file in the request body. Kept for tabs opened before
  // the direct upload shipped; it only works below Vercel's 4.5 MB limit.
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string)?.trim();
  const date = form.get("date") as string;

  if (!file || !title || !date) {
    return NextResponse.json({ error: "file, title and date are required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF must be under 50 MB" }, { status: 400 });
  }

  let step = "buffer";
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("[newsletter] buffer read, size:", buffer.length);

    step = "pdf-lib";
    const pageCount = await countPages(buffer);
    console.log("[newsletter] pageCount:", pageCount);

    step = "s3-upload";
    const s3Key = `${KEY_PREFIX}${randomUUID()}.pdf`;
    const pdfUrl = await uploadBufferToS3(s3Key, buffer, "application/pdf");
    console.log("[newsletter] S3 upload ok:", pdfUrl);

    step = "db";
    return await saveEdition(pageCount, s3Key, pdfUrl, title, date);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[newsletter] FAILED at step="${step}":`, msg);
    return NextResponse.json({ error: `Upload failed at ${step}: ${msg}` }, { status: 500 });
  }
}
